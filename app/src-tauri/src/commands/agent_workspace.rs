use std::path::{Path, PathBuf};
use std::sync::Arc;

use tauri::State;

use crate::commands::projects::{
    classify_sync_status, ensure_dir_within_root, ensure_safe_skill_relative_path,
    source_ref_matches_skill_path, ProjectSkillDocumentDto,
};
use crate::core::skill_store::{SkillRecord, SkillStore, SkillTargetRecord};
use crate::core::{
    error::AppError, installer, project_scanner, scenario_service, sync_engine, tool_adapters,
    tool_service,
};

fn target_path_equals_skill(target_path: &str, skill_path: &str) -> bool {
    if target_path == skill_path {
        return true;
    }
    match (
        std::fs::canonicalize(target_path),
        std::fs::canonicalize(skill_path),
    ) {
        (Ok(a), Ok(b)) => a == b,
        _ => false,
    }
}

fn adapter_for_agent(
    store: &SkillStore,
    agent: &str,
) -> Result<tool_adapters::ToolAdapter, AppError> {
    tool_adapters::all_tool_adapters(store)
        .into_iter()
        .find(|adapter| adapter.key == agent)
        .ok_or_else(|| AppError::not_found(format!("Unknown agent: {}", agent)))
}

fn read_agent_local_skills(
    adapter: &tool_adapters::ToolAdapter,
) -> Vec<project_scanner::ProjectSkillInfo> {
    // Scan the primary skills dir plus any additional discovery roots (e.g.
    // Codex also reads the shared `~/.agents/skills`). Skills are merged and
    // deduped by canonical path so a skill reachable from two roots (e.g. via
    // symlink) is listed once. The primary dir is scanned first and wins.
    let mut skills: Vec<project_scanner::ProjectSkillInfo> = Vec::new();
    let mut seen: std::collections::HashSet<PathBuf> = std::collections::HashSet::new();

    for scan_dir in adapter.all_scan_dirs() {
        for skill in project_scanner::read_linked_workspace_skills(
            &scan_dir,
            None,
            &adapter.key,
            &adapter.display_name,
            adapter.recursive_scan,
        ) {
            let canonical =
                std::fs::canonicalize(&skill.path).unwrap_or_else(|_| PathBuf::from(&skill.path));
            if seen.insert(canonical) {
                skills.push(skill);
            }
        }
    }

    // Read-only vendor/plugin dirs (e.g. Codex's ~/.codex/plugins/cache).
    // Display-only; deduped against writable dirs so a skill already surfaced
    // there isn't re-added as read-only.
    for scan_dir in adapter.readonly_existing_scan_dirs() {
        for skill in
            project_scanner::read_readonly_skills(&scan_dir, &adapter.key, &adapter.display_name)
        {
            let canonical =
                std::fs::canonicalize(&skill.path).unwrap_or_else(|_| PathBuf::from(&skill.path));
            if seen.insert(canonical) {
                skills.push(skill);
            }
        }
    }

    skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    skills
}

/// Validate that `path` lives within one of the adapter's scan directories
/// (primary skills dir or any additional discovery root). Multi-dir aware
/// replacement for a single-root `ensure_dir_within_root` check — the security
/// boundary is unchanged (still confined to adapter-declared directories).
fn ensure_path_within_scan_dirs(
    path: &Path,
    adapter: &tool_adapters::ToolAdapter,
) -> Result<(), AppError> {
    if adapter
        .all_scan_dirs()
        .iter()
        .any(|root| ensure_dir_within_root(path, root).is_ok())
    {
        return Ok(());
    }
    Err(AppError::invalid_input("Invalid skill directory path"))
}

/// Reject write operations on vendor/plugin-managed (read-only) skills. Defense
/// in depth beyond hiding the UI buttons.
fn ensure_not_read_only(skill: &project_scanner::ProjectSkillInfo) -> Result<(), AppError> {
    if skill.read_only {
        return Err(AppError::invalid_input(
            "This skill is read-only (vendor/plugin-managed) and cannot be modified",
        ));
    }
    Ok(())
}

fn enrich_center_status(
    mut skills: Vec<project_scanner::ProjectSkillInfo>,
    all_managed: &[SkillRecord],
    all_targets: &[SkillTargetRecord],
    tags_map: &std::collections::HashMap<String, Vec<String>>,
) -> Vec<project_scanner::ProjectSkillInfo> {
    for skill in &mut skills {
        let matched = find_verified_center_match(skill, all_managed, all_targets);
        skill.in_center = matched.is_some();
        skill.center_skill_id = matched.map(|record| record.id.clone());
        skill.tags = skill
            .center_skill_id
            .as_ref()
            .and_then(|skill_id| tags_map.get(skill_id).cloned())
            .unwrap_or_default();
        skill.sync_status = classify_sync_status(skill, matched);
    }
    skills
}

fn find_agent_skill(
    adapter: &tool_adapters::ToolAdapter,
    skill_relative_path: &str,
) -> Result<project_scanner::ProjectSkillInfo, AppError> {
    ensure_safe_skill_relative_path(skill_relative_path)?;
    read_agent_local_skills(adapter)
        .into_iter()
        .find(|skill| skill.relative_path == skill_relative_path)
        .ok_or_else(|| AppError::not_found("Skill not found in agent local directory"))
}

fn path_matches_skill_path(
    skill_path: &str,
    skill_canonical: Option<&PathBuf>,
    other: &str,
) -> bool {
    if other == skill_path {
        return true;
    }
    let Some(skill_canonical) = skill_canonical else {
        return false;
    };
    let Ok(other_canonical) = std::fs::canonicalize(other) else {
        return false;
    };
    other_canonical == *skill_canonical
}

fn target_matches_skill_path(
    target: &SkillTargetRecord,
    skill_path: &str,
    skill_canonical: Option<&PathBuf>,
) -> bool {
    path_matches_skill_path(skill_path, skill_canonical, &target.target_path)
}

fn adopt_agent_skill_target(
    store: &SkillStore,
    skill: &SkillRecord,
    agent: &str,
    target_path: &Path,
) -> Result<(), AppError> {
    let source = PathBuf::from(&skill.central_path);
    sync_engine::remove_target(target_path).map_err(AppError::io)?;
    let actual_mode = sync_engine::sync_skill(&source, target_path, sync_engine::SyncMode::Symlink)
        .map_err(AppError::io)?;
    let now = chrono::Utc::now().timestamp_millis();
    let target_record = SkillTargetRecord {
        id: uuid::Uuid::new_v4().to_string(),
        skill_id: skill.id.clone(),
        tool: agent.to_string(),
        target_path: target_path.to_string_lossy().to_string(),
        mode: actual_mode.as_str().to_string(),
        status: "ok".to_string(),
        synced_at: Some(now),
        last_error: None,
        source_hash: skill.content_hash.clone(),
    };
    store.insert_target(&target_record).map_err(AppError::db)?;
    Ok(())
}

fn find_verified_center_match<'a>(
    skill: &project_scanner::ProjectSkillInfo,
    all_managed: &'a [SkillRecord],
    all_targets: &[SkillTargetRecord],
) -> Option<&'a SkillRecord> {
    let skill_hash = skill.content_hash.as_deref();
    let canonical_skill_path = std::fs::canonicalize(&skill.path).ok();

    all_managed
        .iter()
        .filter_map(|managed| {
            if source_ref_matches_skill_path(&skill.path, canonical_skill_path.as_ref(), managed) {
                return Some((managed, 3));
            }
            if all_targets.iter().any(|target| {
                target.skill_id == managed.id
                    && target_matches_skill_path(target, &skill.path, canonical_skill_path.as_ref())
            }) {
                return Some((managed, 3));
            }
            if skill_hash.is_some() && managed.content_hash.as_deref() == skill_hash {
                return Some((managed, 2));
            }
            None
        })
        .max_by_key(|(_, score)| *score)
        .map(|(managed, _)| managed)
}

#[tauri::command]
pub async fn get_global_local_skills(
    store: State<'_, Arc<SkillStore>>,
    agent: String,
) -> Result<Vec<project_scanner::ProjectSkillInfo>, AppError> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let adapter = adapter_for_agent(&store, &agent)?;
        let skills = read_agent_local_skills(&adapter);
        let all_managed = store.get_all_skills().map_err(AppError::db)?;
        let all_targets = store.get_all_targets().map_err(AppError::db)?;
        let tags_map = store.get_tags_map().unwrap_or_default();
        Ok(enrich_center_status(
            skills,
            &all_managed,
            &all_targets,
            &tags_map,
        ))
    })
    .await?
}

/// Open one of the agent's skill scan directories in the OS file browser.
/// The path is validated to be one of the agent's declared scan dirs (primary,
/// additional, or read-only) so arbitrary paths can't be opened through this
/// command. Opening a read-only dir is safe — it's a view action.
#[tauri::command]
pub async fn open_agent_scan_dir(
    store: State<'_, Arc<SkillStore>>,
    agent: String,
    dir: String,
) -> Result<(), AppError> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let adapter = adapter_for_agent(&store, &agent)?;
        let requested = PathBuf::from(&dir);
        let requested_canon = std::fs::canonicalize(&requested).unwrap_or_else(|_| requested.clone());

        let mut allowed = adapter.all_scan_dirs();
        allowed.extend(adapter.readonly_existing_scan_dirs());
        let is_scan_dir = allowed.iter().any(|scan_dir| {
            let scan_canon =
                std::fs::canonicalize(scan_dir).unwrap_or_else(|_| scan_dir.clone());
            scan_canon == requested_canon || *scan_dir == requested
        });
        if !is_scan_dir {
            return Err(AppError::invalid_input(
                "Directory is not a scan directory for this agent",
            ));
        }

        if !requested.exists() {
            return Err(AppError::io(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Directory not found: {}", requested.display()),
            )));
        }

        tauri_plugin_opener::open_path(&requested, Option::<&str>::None).map_err(|e| {
            AppError::io(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to open directory: {}", e),
            ))
        })?;
        Ok(())
    })
    .await?
}

#[tauri::command]
pub async fn get_global_local_skill_document(
    store: State<'_, Arc<SkillStore>>,
    agent: String,
    skill_relative_path: String,
) -> Result<ProjectSkillDocumentDto, AppError> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let adapter = adapter_for_agent(&store, &agent)?;
        ensure_safe_skill_relative_path(&skill_relative_path)?;

        // Locate the skill across all scan dirs (primary + additional roots
        // like `~/.agents/skills`), then read its document from the real path.
        let skill = find_agent_skill(&adapter, &skill_relative_path)?;
        let skill_dir = PathBuf::from(&skill.path);
        ensure_path_within_scan_dirs(&skill_dir, &adapter)?;

        let allowed_roots = adapter.all_scan_dirs();
        let candidates = ["SKILL.md", "skill.md", "CLAUDE.md", "README.md"];
        for candidate in &candidates {
            let file_path = skill_dir.join(candidate);
            if !file_path.exists() {
                continue;
            }
            if let Ok(meta) = std::fs::symlink_metadata(&file_path) {
                if meta.file_type().is_symlink() {
                    let resolved = match std::fs::canonicalize(&file_path) {
                        Ok(path) => path,
                        Err(_) => continue,
                    };
                    let in_allowed_root = allowed_roots.iter().any(|root| {
                        std::fs::canonicalize(root)
                            .map(|canon| resolved.starts_with(&canon))
                            .unwrap_or(false)
                    });
                    if !in_allowed_root {
                        continue;
                    }
                }
            }
            if file_path.is_file() {
                let content = std::fs::read_to_string(&file_path)?;
                return Ok(ProjectSkillDocumentDto {
                    skill_name: skill_relative_path,
                    filename: candidate.to_string(),
                    content,
                });
            }
        }

        Err(AppError::not_found(
            "No document file found in skill directory",
        ))
    })
    .await?
}

#[tauri::command]
pub async fn import_global_local_skill_to_center(
    store: State<'_, Arc<SkillStore>>,
    agent: String,
    skill_relative_path: String,
) -> Result<(), AppError> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        import_agent_local_skill_to_center(&store, &agent, &skill_relative_path)
    })
    .await?
}

fn import_agent_local_skill_to_center(
    store: &SkillStore,
    agent: &str,
    skill_relative_path: &str,
) -> Result<(), AppError> {
    let adapter = adapter_for_agent(store, agent)?;
    let skill = find_agent_skill(&adapter, skill_relative_path)?;
    ensure_not_read_only(&skill)?;

    let source_path = PathBuf::from(&skill.path);
    ensure_path_within_scan_dirs(&source_path, &adapter)?;

    let all_managed = store.get_all_skills().unwrap_or_default();
    let all_targets = store.get_all_targets().unwrap_or_default();
    if let Some(existing) = find_verified_center_match(&skill, &all_managed, &all_targets) {
        let result = installer::install_from_local_to_destination(
            &source_path,
            Some(&existing.name),
            Path::new(&existing.central_path),
        )
        .map_err(AppError::io)?;
        store
            .update_skill_after_install(
                &existing.id,
                &existing.name,
                result.description.as_deref(),
                existing.source_revision.as_deref(),
                existing.remote_revision.as_deref(),
                Some(&result.content_hash),
                "local_only",
            )
            .map_err(AppError::db)?;

        let updated = store
            .get_skill_by_id(&existing.id)
            .map_err(AppError::db)?
            .ok_or_else(|| AppError::not_found("Skill not found"))?;
        adopt_agent_skill_target(store, &updated, agent, &source_path)?;
        return Ok(());
    }

    let result =
        installer::install_from_local(&source_path, Some(&skill.name)).map_err(AppError::io)?;
    let now = chrono::Utc::now().timestamp_millis();
    let id = uuid::Uuid::new_v4().to_string();
    let skill_record = SkillRecord {
        id,
        name: result.name.clone(),
        description: result.description.clone(),
        source_type: "local".to_string(),
        source_ref: None,
        source_ref_resolved: None,
        source_subpath: None,
        source_branch: None,
        source_revision: None,
        remote_revision: None,
        central_path: result.central_path.to_string_lossy().to_string(),
        content_hash: Some(result.content_hash.clone()),
        enabled: true,
        created_at: now,
        updated_at: now,
        status: "ok".to_string(),
        update_status: "local_only".to_string(),
        last_checked_at: Some(now),
        last_check_error: None,
    };

    store.insert_skill(&skill_record).map_err(AppError::db)?;
    // Register the managed sync target and replace the agent-local directory
    // with a symlink to the central copy. On failure, drop the
    // just-inserted skill row (which cascades to any target) so we never leave
    // an orphaned, button-less skill behind. We deliberately do NOT delete the
    // central directory: `install_from_local` may have de-duplicated onto a
    // directory shared with another skill, and removing it could corrupt that
    // skill — an orphaned dir is harmless by comparison.
    if let Err(err) = adopt_agent_skill_target(store, &skill_record, agent, &source_path) {
        let _ = store.delete_skill(&skill_record.id);
        return Err(err);
    }
    Ok(())
}

/// Repair "stranded" center skills left behind by uploads that predate the
/// sync-target registration fix. Such a skill has a center record whose
/// `source_ref` still points at a skill living in an agent's skills directory,
/// but no `skill_targets` row for that agent — so the global workspace treats
/// it as in-sync-but-unmanaged and renders no actions (the missing delete
/// button). Runs once at startup; idempotent (after repair the target exists,
/// so later runs find nothing and exit on the cheap pre-check).
///
/// We match strictly by `source_ref` — the strong "this skill was uploaded
/// FROM here" signal — never by content hash, which could silently adopt a
/// look-alike skill the user never uploaded. We also only repair skills whose
/// on-disk content still equals the center copy (hash match): completing the
/// registration runs `sync_single_skill_to_tool`, which rewrites the agent
/// artifact from the central copy, so acting on a diverged skill could clobber
/// newer local edits. Diverged stranded skills are left for an explicit user
/// action. Best-effort: per-skill failures are logged and skipped.
pub fn backfill_stranded_agent_targets(store: &SkillStore) -> usize {
    let all_managed = store.get_all_skills().unwrap_or_default();
    let all_targets = store.get_all_targets().unwrap_or_default();

    // Cheap pre-check: a stranded skill carries a `source_ref` but has no target
    // row at all. When every source_ref-bearing skill is already targeted there
    // is nothing to repair, so we skip the filesystem scan entirely.
    let has_candidate = all_managed.iter().any(|managed| {
        managed.source_ref.as_deref().is_some_and(|s| !s.is_empty())
            && !all_targets.iter().any(|t| t.skill_id == managed.id)
    });
    if !has_candidate {
        return 0;
    }

    let disabled = tool_service::get_disabled_tools(store);
    let mut repaired = 0usize;

    for adapter in tool_adapters::all_tool_adapters(store) {
        if !adapter.is_installed() || disabled.contains(&adapter.key) {
            continue;
        }
        let targets = store.get_all_targets().unwrap_or_default();

        for skill in read_agent_local_skills(&adapter) {
            let canonical = std::fs::canonicalize(&skill.path).ok();
            let Some(matched) = all_managed
                .iter()
                .find(|managed| source_ref_matches_skill_path(&skill.path, canonical.as_ref(), managed))
            else {
                continue;
            };

            if targets
                .iter()
                .any(|t| t.skill_id == matched.id && t.tool == adapter.key)
            {
                continue;
            }

            // Only safe when the local copy still equals center: the sync below
            // rewrites the agent artifact from central, so a diverged local would
            // lose its newer edits. Reuse the workspace's own classifier (which
            // also recomputes the live center hash when the DB hash is stale) so
            // we repair exactly the skills the UI shows as in-sync, no more.
            if classify_sync_status(&skill, Some(matched)) != "in_sync" {
                log::info!(
                    "backfill: skipping diverged stranded skill '{}' on agent '{}' (needs manual action)",
                    matched.name,
                    adapter.key
                );
                continue;
            }

            match scenario_service::sync_single_skill_to_tool(store, &matched.id, &adapter.key) {
                Ok(()) => {
                    repaired += 1;
                    log::info!(
                        "backfill: registered missing sync target for stranded skill '{}' on agent '{}'",
                        matched.name,
                        adapter.key
                    );
                }
                Err(err) => log::warn!(
                    "backfill: failed to repair stranded skill '{}' on agent '{}': {}",
                    matched.name,
                    adapter.key,
                    err
                ),
            }
        }
    }

    if repaired > 0 {
        log::info!("backfill: repaired {repaired} stranded agent skill target(s)");
    }
    repaired
}

#[tauri::command]
pub async fn update_global_local_skill_from_center(
    store: State<'_, Arc<SkillStore>>,
    agent: String,
    skill_relative_path: String,
) -> Result<(), AppError> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        update_agent_local_skill_from_center(&store, &agent, &skill_relative_path)
    })
    .await?
}

fn update_agent_local_skill_from_center(
    store: &SkillStore,
    agent: &str,
    skill_relative_path: &str,
) -> Result<(), AppError> {
    let adapter = adapter_for_agent(store, agent)?;
    let skill = find_agent_skill(&adapter, skill_relative_path)?;
    ensure_not_read_only(&skill)?;
    let all_managed = store.get_all_skills().unwrap_or_default();
    let all_targets = store.get_all_targets().unwrap_or_default();
    let managed = find_verified_center_match(&skill, &all_managed, &all_targets)
        .ok_or_else(|| AppError::not_found("No matching managed skill in center"))?;

    if classify_sync_status(&skill, Some(managed)) == "project_newer" {
        return Err(AppError::invalid_input(
            "Local skill is newer than the Skills Center version",
        ));
    }

    let target_path = PathBuf::from(&skill.path);
    ensure_path_within_scan_dirs(&target_path, &adapter)?;

    let source = PathBuf::from(&managed.central_path);
    let configured_mode = store.get_setting("sync_mode").map_err(AppError::db)?;
    let mode = sync_engine::sync_mode_for_tool(agent, configured_mode.as_deref());
    sync_engine::sync_skill(&source, &target_path, mode).map_err(AppError::io)?;
    Ok(())
}

#[tauri::command]
pub async fn delete_global_local_skill(
    store: State<'_, Arc<SkillStore>>,
    agent: String,
    skill_relative_path: String,
) -> Result<(), AppError> {
    let store = store.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        delete_agent_local_skill(&store, &agent, &skill_relative_path)
    })
    .await?
}

fn delete_agent_local_skill(
    store: &SkillStore,
    agent: &str,
    skill_relative_path: &str,
) -> Result<(), AppError> {
    let adapter = adapter_for_agent(store, agent)?;
    ensure_safe_skill_relative_path(skill_relative_path)?;

    // Broken-symlink fast path: a dangling symlink is not a valid skill dir, so
    // `find_agent_skill` can't locate it. Probe each scan dir for the relative
    // path and remove it directly if it's a broken symlink.
    for scan_dir in adapter.all_scan_dirs() {
        let requested_path = scan_dir.join(skill_relative_path);
        if ensure_dir_within_root(&requested_path, &scan_dir).is_err() {
            continue;
        }
        if let Ok(metadata) = std::fs::symlink_metadata(&requested_path) {
            if metadata.file_type().is_symlink() && !requested_path.exists() {
                sync_engine::remove_target(&requested_path).map_err(AppError::io)?;
                return Ok(());
            }
        }
    }

    let skill = find_agent_skill(&adapter, skill_relative_path)?;
    ensure_not_read_only(&skill)?;

    let all_managed = store.get_all_skills().unwrap_or_default();
    let all_targets = store.get_all_targets().unwrap_or_default();
    if let Some(managed) = find_verified_center_match(&skill, &all_managed, &all_targets) {
        let still_linked = all_targets
            .iter()
            .any(|t| t.skill_id == managed.id && target_path_equals_skill(&t.target_path, &skill.path));
        if still_linked {
            return Err(AppError::invalid_input(
                "Skill is managed by Skills Center — remove from the agent first.",
            ));
        }
    }

    let target_path = PathBuf::from(&skill.path);
    ensure_path_within_scan_dirs(&target_path, &adapter)?;
    sync_engine::remove_target(&target_path).map_err(AppError::io)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        backfill_stranded_agent_targets, delete_agent_local_skill, enrich_center_status,
        ensure_path_within_scan_dirs, import_agent_local_skill_to_center, read_agent_local_skills,
        update_agent_local_skill_from_center,
    };
    use crate::core::content_hash;
    use crate::core::project_scanner::ProjectSkillInfo;
    use crate::core::skill_store::{ScenarioRecord, SkillRecord, SkillStore};
    use crate::core::tool_adapters::{ToolAdapter, ToolCategory};
    use crate::core::{central_repo, installer};

    fn write_skill(dir: &std::path::Path, name: &str) {
        std::fs::create_dir_all(dir).unwrap();
        std::fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: test\n---\n# {name}"),
        )
        .unwrap();
    }

    fn adapter_with_extra_dir(primary: &std::path::Path, extra: &std::path::Path) -> ToolAdapter {
        // `additional_scan_dirs` normally resolves home-relative; use an
        // absolute override there so the test can point at a tempdir.
        ToolAdapter {
            key: "test_agent".into(),
            display_name: "Test Agent".into(),
            relative_skills_dir: String::new(),
            relative_detect_dir: String::new(),
            additional_scan_dirs: vec![extra.to_string_lossy().into_owned()],
            readonly_scan_dirs: vec![],
            override_skills_dir: Some(primary.to_string_lossy().into_owned()),
            is_custom: true,
            recursive_scan: false,
            project_relative_skills_dir: None,
            category: ToolCategory::Coding,
        }
    }

    #[test]
    fn read_agent_local_skills_merges_primary_and_additional_dirs() {
        let temp = tempfile::tempdir().unwrap();
        let primary = temp.path().join("codex-skills");
        let shared = temp.path().join("agents-skills");
        write_skill(&primary.join("primary-skill"), "primary-skill");
        write_skill(&shared.join("shared-skill"), "shared-skill");

        let adapter = adapter_with_extra_dir(&primary, &shared);
        let skills = read_agent_local_skills(&adapter);

        let names: Vec<&str> = skills.iter().map(|s| s.dir_name.as_str()).collect();
        assert!(names.contains(&"primary-skill"), "got {names:?}");
        assert!(names.contains(&"shared-skill"), "got {names:?}");
    }

    #[test]
    fn read_agent_local_skills_dedups_same_canonical_path() {
        // When primary and additional roots resolve to the same directory, a
        // skill must appear once, not twice.
        let temp = tempfile::tempdir().unwrap();
        let primary = temp.path().join("skills");
        write_skill(&primary.join("only-skill"), "only-skill");

        let adapter = adapter_with_extra_dir(&primary, &primary);
        let skills = read_agent_local_skills(&adapter);

        assert_eq!(
            skills.iter().filter(|s| s.dir_name == "only-skill").count(),
            1
        );
    }

    fn adapter_with_readonly_dir(primary: &std::path::Path, readonly: &std::path::Path) -> ToolAdapter {
        ToolAdapter {
            key: "test_agent".into(),
            display_name: "Test Agent".into(),
            relative_skills_dir: String::new(),
            relative_detect_dir: String::new(),
            additional_scan_dirs: vec![],
            readonly_scan_dirs: vec![readonly.to_string_lossy().into_owned()],
            override_skills_dir: Some(primary.to_string_lossy().into_owned()),
            is_custom: true,
            recursive_scan: false,
            project_relative_skills_dir: None,
            category: ToolCategory::Coding,
        }
    }

    #[test]
    fn read_agent_local_skills_tags_readonly_and_finds_nested_bundle() {
        // Read-only dir uses deep discovery: a plugin-cache-style nested layout
        // <pkg>/<version>/skills/<skill> must be found and flagged read_only.
        let temp = tempfile::tempdir().unwrap();
        let primary = temp.path().join("skills");
        write_skill(&primary.join("writable-skill"), "writable-skill");
        let readonly = temp.path().join("plugins/cache");
        write_skill(
            &readonly.join("vendor-pkg/1.0.0/skills/bundled-skill"),
            "bundled-skill",
        );

        let adapter = adapter_with_readonly_dir(&primary, &readonly);
        let skills = read_agent_local_skills(&adapter);

        let writable = skills.iter().find(|s| s.dir_name == "writable-skill").unwrap();
        assert!(!writable.read_only);
        let bundled = skills.iter().find(|s| s.dir_name == "bundled-skill").unwrap();
        assert!(bundled.read_only, "nested bundle skill should be read_only");
    }

    #[test]
    fn delete_rejects_read_only_skill() {
        // A vendor/plugin skill (read_only) must be rejected by the write guard
        // that import/update/delete all call.
        let temp = tempfile::tempdir().unwrap();
        let primary = temp.path().join("skills");
        std::fs::create_dir_all(&primary).unwrap();
        let readonly = temp.path().join("plugins/cache");
        write_skill(&readonly.join("vendor/1.0.0/skills/bundled"), "bundled");

        let adapter = adapter_with_readonly_dir(&primary, &readonly);
        let skill = read_agent_local_skills(&adapter)
            .into_iter()
            .find(|s| s.dir_name == "bundled")
            .unwrap();
        assert!(skill.read_only);
        assert!(super::ensure_not_read_only(&skill).is_err());
    }

    #[test]
    fn ensure_path_within_scan_dirs_accepts_additional_and_rejects_outside() {
        let temp = tempfile::tempdir().unwrap();
        let primary = temp.path().join("primary");
        let shared = temp.path().join("shared");
        std::fs::create_dir_all(&primary).unwrap();
        std::fs::create_dir_all(&shared).unwrap();
        let adapter = adapter_with_extra_dir(&primary, &shared);

        assert!(ensure_path_within_scan_dirs(&primary.join("a-skill"), &adapter).is_ok());
        assert!(ensure_path_within_scan_dirs(&shared.join("b-skill"), &adapter).is_ok());
        assert!(
            ensure_path_within_scan_dirs(&temp.path().join("elsewhere/x"), &adapter).is_err()
        );
    }

    use std::collections::HashMap;

    #[cfg(unix)]
    #[test]
    fn deleting_agent_local_skill_removes_broken_symlink() {
        let temp = tempfile::tempdir().unwrap();
        let db_path = temp.path().join("store.db");
        let store = SkillStore::new(&db_path).unwrap();

        let skills_root = temp.path().join("agent-skills");
        std::fs::create_dir_all(&skills_root).unwrap();
        let broken_link = skills_root.join(".ruff_cache");
        std::os::unix::fs::symlink(temp.path().join("missing-target"), &broken_link).unwrap();

        store
            .set_setting(
                "custom_tools",
                &serde_json::json!([
                    {
                        "key": "test_agent",
                        "display_name": "Test Agent",
                        "skills_dir": skills_root.to_string_lossy(),
                        "project_relative_skills_dir": ".test-agent/skills"
                    }
                ])
                .to_string(),
            )
            .unwrap();

        delete_agent_local_skill(&store, "test_agent", ".ruff_cache").unwrap();

        assert!(std::fs::symlink_metadata(&broken_link).is_err());
    }

    #[test]
    fn importing_agent_local_skill_attaches_target_but_not_scenario() {
        let _guard = central_repo::test_base_dir_lock();
        let temp = tempfile::tempdir().unwrap();
        central_repo::set_test_base_dir_override(Some(temp.path().join("center")));

        let db_path = temp.path().join("store.db");
        let store = SkillStore::new(&db_path).unwrap();

        let skills_root = temp.path().join("agent-skills");
        let skill_dir = skills_root.join("local-tool");
        std::fs::create_dir_all(&skill_dir).unwrap();
        std::fs::write(
            skill_dir.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Local test skill\n---\n",
        )
        .unwrap();

        store
            .set_setting(
                "custom_tools",
                &serde_json::json!([
                    {
                        "key": "test_agent",
                        "display_name": "Test Agent",
                        "skills_dir": skills_root.to_string_lossy(),
                        "project_relative_skills_dir": ".test-agent/skills"
                    }
                ])
                .to_string(),
            )
            .unwrap();

        let now = chrono::Utc::now().timestamp_millis();
        store
            .insert_scenario(&ScenarioRecord {
                id: "active".to_string(),
                name: "Active".to_string(),
                description: None,
                icon: None,
                sort_order: 0,
                created_at: now,
                updated_at: now,
            })
            .unwrap();
        store.set_active_scenario("active").unwrap();

        import_agent_local_skill_to_center(&store, "test_agent", "local-tool").unwrap();

        let skills = store.get_all_skills().unwrap();
        assert_eq!(skills.len(), 1);
        // Importing must NOT silently enroll the skill into the active scenario.
        assert!(store
            .get_scenarios_for_skill(&skills[0].id)
            .unwrap()
            .is_empty());
        // But it MUST register a managed sync target for the importing agent,
        // pointed at the skill's actual on-disk location, so the workspace
        // recognizes it as managed and shows its delete button.
        let targets = store.get_all_targets().unwrap();
        assert_eq!(targets.len(), 1);
        assert_eq!(targets[0].skill_id, skills[0].id);
        assert_eq!(targets[0].tool, "test_agent");
        assert_eq!(targets[0].target_path, skill_dir.to_string_lossy());

        // The on-disk artifact must be a sync_engine-owned symlink resolving to
        // the central copy — NOT the user's original real directory. This is
        // the property that makes a later unsync safe: removing the target only
        // drops the managed link, leaving the central skill intact.
        let meta = std::fs::symlink_metadata(&skill_dir).unwrap();
        assert!(meta.file_type().is_symlink());
        assert_eq!(
            std::fs::canonicalize(&skill_dir).unwrap(),
            std::fs::canonicalize(&skills[0].central_path).unwrap()
        );

        central_repo::set_test_base_dir_override(None);
    }

    #[test]
    fn enriching_agent_local_skills_copies_center_tags() {
        let skill = ProjectSkillInfo {
            name: "local-tool".to_string(),
            dir_name: "local-tool".to_string(),
            relative_path: "local-tool".to_string(),
            description: Some("Agent copy".to_string()),
            path: "/tmp/agent-skills/local-tool".to_string(),
            files: vec![],
            enabled: true,
            agent: "test_agent".to_string(),
            agent_display_name: "Test Agent".to_string(),
            tags: Vec::new(),
            in_center: false,
            sync_status: "project_only".to_string(),
            center_skill_id: None,
            read_only: false,
            last_modified_at: None,
            content_hash: Some("same-hash".to_string()),
        };

        let managed = SkillRecord {
            id: "center-id".to_string(),
            name: "local-tool".to_string(),
            description: Some("Center copy".to_string()),
            source_type: "local".to_string(),
            source_ref: None,
            source_ref_resolved: None,
            source_subpath: None,
            source_branch: None,
            source_revision: None,
            remote_revision: None,
            central_path: "/tmp/center/local-tool".to_string(),
            content_hash: Some("same-hash".to_string()),
            enabled: true,
            created_at: 0,
            updated_at: 0,
            status: "ok".to_string(),
            update_status: "local_only".to_string(),
            last_checked_at: Some(0),
            last_check_error: None,
        };

        let mut tags_map = HashMap::new();
        tags_map.insert(
            "center-id".to_string(),
            vec!["create".to_string(), "manage".to_string()],
        );

        let enriched = enrich_center_status(vec![skill], &[managed], &[], &tags_map);
        assert_eq!(enriched[0].center_skill_id.as_deref(), Some("center-id"));
        assert_eq!(
            enriched[0].tags,
            vec!["create".to_string(), "manage".to_string()]
        );
    }

    #[test]
    fn importing_agent_local_skill_does_not_overwrite_name_only_center_match() {
        let _guard = central_repo::test_base_dir_lock();
        let temp = tempfile::tempdir().unwrap();
        central_repo::set_test_base_dir_override(Some(temp.path().join("center")));

        let db_path = temp.path().join("store.db");
        let store = SkillStore::new(&db_path).unwrap();

        let center_source = temp.path().join("center-source");
        std::fs::create_dir_all(&center_source).unwrap();
        std::fs::write(
            center_source.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Center copy\n---\ncenter\n",
        )
        .unwrap();
        let existing = installer::install_from_local(&center_source, Some("local-tool")).unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        store
            .insert_skill(&SkillRecord {
                id: "existing-center".to_string(),
                name: "local-tool".to_string(),
                description: existing.description.clone(),
                source_type: "local".to_string(),
                source_ref: Some(center_source.to_string_lossy().to_string()),
                source_ref_resolved: None,
                source_subpath: None,
                source_branch: None,
                source_revision: None,
                remote_revision: None,
                central_path: existing.central_path.to_string_lossy().to_string(),
                content_hash: Some(existing.content_hash.clone()),
                enabled: true,
                created_at: now,
                updated_at: now,
                status: "ok".to_string(),
                update_status: "local_only".to_string(),
                last_checked_at: Some(now),
                last_check_error: None,
            })
            .unwrap();

        let skills_root = temp.path().join("agent-skills");
        let skill_dir = skills_root.join("local-tool");
        std::fs::create_dir_all(&skill_dir).unwrap();
        std::fs::write(
            skill_dir.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Agent copy\n---\nagent\n",
        )
        .unwrap();

        store
            .set_setting(
                "custom_tools",
                &serde_json::json!([
                    {
                        "key": "test_agent",
                        "display_name": "Test Agent",
                        "skills_dir": skills_root.to_string_lossy(),
                        "project_relative_skills_dir": ".test-agent/skills"
                    }
                ])
                .to_string(),
            )
            .unwrap();

        import_agent_local_skill_to_center(&store, "test_agent", "local-tool").unwrap();

        let skills = store.get_all_skills().unwrap();
        assert_eq!(skills.len(), 2);
        let original_content =
            std::fs::read_to_string(std::path::Path::new(&existing.central_path).join("SKILL.md"))
                .unwrap();
        assert!(original_content.contains("Center copy"));
        assert!(skills.iter().any(|skill| skill.name == "local-tool-2"));

        central_repo::set_test_base_dir_override(None);
    }

    #[test]
    fn importing_verified_center_match_reuses_skill_and_attaches_target() {
        let _guard = central_repo::test_base_dir_lock();
        let temp = tempfile::tempdir().unwrap();
        central_repo::set_test_base_dir_override(Some(temp.path().join("center")));

        let db_path = temp.path().join("store.db");
        let store = SkillStore::new(&db_path).unwrap();

        let skills_root = temp.path().join("agent-skills");
        let skill_dir = skills_root.join("local-tool");
        std::fs::create_dir_all(&skill_dir).unwrap();
        std::fs::write(
            skill_dir.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Agent copy\n---\nlocal\n",
        )
        .unwrap();

        // Pre-existing center skill whose source_ref points at the local skill,
        // so the import resolves to a *verified* match (the existing-match
        // branch) rather than creating a duplicate.
        let existing = installer::install_from_local(&skill_dir, Some("local-tool")).unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        store
            .insert_skill(&SkillRecord {
                id: "existing-center".to_string(),
                name: "local-tool".to_string(),
                description: existing.description.clone(),
                source_type: "local".to_string(),
                source_ref: Some(skill_dir.to_string_lossy().to_string()),
                source_ref_resolved: None,
                source_subpath: None,
                source_branch: None,
                source_revision: None,
                remote_revision: None,
                central_path: existing.central_path.to_string_lossy().to_string(),
                content_hash: Some(existing.content_hash.clone()),
                enabled: true,
                created_at: now,
                updated_at: now,
                status: "ok".to_string(),
                update_status: "local_only".to_string(),
                last_checked_at: Some(now),
                last_check_error: None,
            })
            .unwrap();

        store
            .set_setting(
                "custom_tools",
                &serde_json::json!([
                    {
                        "key": "test_agent",
                        "display_name": "Test Agent",
                        "skills_dir": skills_root.to_string_lossy(),
                        "project_relative_skills_dir": ".test-agent/skills"
                    }
                ])
                .to_string(),
            )
            .unwrap();

        import_agent_local_skill_to_center(&store, "test_agent", "local-tool").unwrap();

        // The existing center skill is reused, not duplicated.
        let skills = store.get_all_skills().unwrap();
        assert_eq!(skills.len(), 1);
        assert_eq!(skills[0].id, "existing-center");

        // And a managed target is attached for the importing agent at the
        // skill's actual on-disk path.
        let targets = store.get_all_targets().unwrap();
        assert_eq!(targets.len(), 1);
        assert_eq!(targets[0].skill_id, "existing-center");
        assert_eq!(targets[0].tool, "test_agent");
        assert_eq!(targets[0].target_path, skill_dir.to_string_lossy());

        central_repo::set_test_base_dir_override(None);
    }

    #[test]
    fn backfill_registers_target_for_stranded_in_sync_skill() {
        let _guard = central_repo::test_base_dir_lock();
        let temp = tempfile::tempdir().unwrap();
        central_repo::set_test_base_dir_override(Some(temp.path().join("center")));

        let db_path = temp.path().join("store.db");
        let store = SkillStore::new(&db_path).unwrap();

        let skills_root = temp.path().join("agent-skills");
        let skill_dir = skills_root.join("local-tool");
        std::fs::create_dir_all(&skill_dir).unwrap();
        std::fs::write(
            skill_dir.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Agent copy\n---\nlocal\n",
        )
        .unwrap();

        // A center skill that was uploaded before targets were registered:
        // source_ref points at the agent dir, content matches, but NO target.
        let existing = installer::install_from_local(&skill_dir, Some("local-tool")).unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        store
            .insert_skill(&SkillRecord {
                id: "stranded".to_string(),
                name: "local-tool".to_string(),
                description: existing.description.clone(),
                source_type: "local".to_string(),
                source_ref: Some(skill_dir.to_string_lossy().to_string()),
                source_ref_resolved: None,
                source_subpath: None,
                source_branch: None,
                source_revision: None,
                remote_revision: None,
                central_path: existing.central_path.to_string_lossy().to_string(),
                content_hash: Some(existing.content_hash.clone()),
                enabled: true,
                created_at: now,
                updated_at: now,
                status: "ok".to_string(),
                update_status: "local_only".to_string(),
                last_checked_at: Some(now),
                last_check_error: None,
            })
            .unwrap();

        store
            .set_setting(
                "custom_tools",
                &serde_json::json!([
                    {
                        "key": "test_agent",
                        "display_name": "Test Agent",
                        "skills_dir": skills_root.to_string_lossy(),
                        "project_relative_skills_dir": ".test-agent/skills"
                    }
                ])
                .to_string(),
            )
            .unwrap();

        // Stranded precondition: no targets at all.
        assert!(store.get_all_targets().unwrap().is_empty());

        let repaired = backfill_stranded_agent_targets(&store);
        assert_eq!(repaired, 1);

        let targets = store.get_all_targets().unwrap();
        assert_eq!(targets.len(), 1);
        assert_eq!(targets[0].skill_id, "stranded");
        assert_eq!(targets[0].tool, "test_agent");
        assert_eq!(targets[0].target_path, skill_dir.to_string_lossy());

        // Idempotent: a second run sees the target and repairs nothing.
        assert_eq!(backfill_stranded_agent_targets(&store), 0);
        assert_eq!(store.get_all_targets().unwrap().len(), 1);

        central_repo::set_test_base_dir_override(None);
    }

    #[test]
    fn pulling_from_center_rejects_newer_local_skill() {
        let _guard = central_repo::test_base_dir_lock();
        let temp = tempfile::tempdir().unwrap();
        central_repo::set_test_base_dir_override(Some(temp.path().join("center")));

        let db_path = temp.path().join("store.db");
        let store = SkillStore::new(&db_path).unwrap();

        let center_source = temp.path().join("center-source");
        std::fs::create_dir_all(&center_source).unwrap();
        std::fs::write(
            center_source.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Center copy\n---\ncenter\n",
        )
        .unwrap();
        let existing = installer::install_from_local(&center_source, Some("local-tool")).unwrap();

        let skills_root = temp.path().join("agent-skills");
        let skill_dir = skills_root.join("local-tool");
        std::fs::create_dir_all(&skill_dir).unwrap();
        std::fs::write(
            skill_dir.join("SKILL.md"),
            "---\nname: local-tool\ndescription: Agent copy\n---\nagent newer\n",
        )
        .unwrap();

        store
            .set_setting(
                "custom_tools",
                &serde_json::json!([
                    {
                        "key": "test_agent",
                        "display_name": "Test Agent",
                        "skills_dir": skills_root.to_string_lossy(),
                        "project_relative_skills_dir": ".test-agent/skills"
                    }
                ])
                .to_string(),
            )
            .unwrap();

        store
            .insert_skill(&SkillRecord {
                id: "existing-center".to_string(),
                name: "local-tool".to_string(),
                description: existing.description.clone(),
                source_type: "local".to_string(),
                source_ref: Some(skill_dir.to_string_lossy().to_string()),
                source_ref_resolved: None,
                source_subpath: None,
                source_branch: None,
                source_revision: None,
                remote_revision: None,
                central_path: existing.central_path.to_string_lossy().to_string(),
                content_hash: Some(content_hash::hash_directory(&existing.central_path).unwrap()),
                enabled: true,
                created_at: 0,
                updated_at: 0,
                status: "ok".to_string(),
                update_status: "local_only".to_string(),
                last_checked_at: Some(0),
                last_check_error: None,
            })
            .unwrap();

        let result = update_agent_local_skill_from_center(&store, "test_agent", "local-tool");
        assert!(result.is_err());
        let local_content = std::fs::read_to_string(skill_dir.join("SKILL.md")).unwrap();
        assert!(local_content.contains("agent newer"));

        central_repo::set_test_base_dir_override(None);
    }
}
