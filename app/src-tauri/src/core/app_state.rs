use std::sync::Arc;
use std::time::Instant;

use anyhow::{Context, Result};

use super::{central_repo, content_hash, scenario_service, skill_metadata, skill_store::SkillStore, sync_engine, sync_metadata, tool_service};

/// Per-stage timings collected during `initialize_store`. The struct is
/// returned to the caller so the log lines can be emitted once
/// `tauri_plugin_log` is registered — anything logged from inside this
/// function would otherwise be dropped because the logger isn't installed
/// until later in `tauri::Builder::setup`. See issue #153.
#[derive(Debug, Clone)]
pub struct StartupTimings {
    pub ensure_central_repo_ms: u128,
    pub open_store_ms: u128,
    pub migrate_legacy_tool_keys_ms: u128,
    pub skill_count: usize,
    pub orphan_discovery_count: usize,
    pub missing_cleanup_count: usize,
    pub reindex_from_metadata_ms: Option<u128>,
    pub restore_sync_included_ms: u128,
    pub restore_sync_included_changed: bool,
    pub write_all_from_db_ms: Option<u128>,
    pub apply_scenario_ms: u128,
    /// "default_startup" (Tauri app) or "cli" (CLI bin). Defaults to
    /// `"unknown"` so a struct that escapes `initialize_store_inner`
    /// without being fully populated still produces an obvious value in
    /// the log instead of an empty string.
    pub apply_scenario_kind: &'static str,
    pub total_ms: u128,
}

impl Default for StartupTimings {
    fn default() -> Self {
        Self {
            ensure_central_repo_ms: 0,
            open_store_ms: 0,
            migrate_legacy_tool_keys_ms: 0,
            skill_count: 0,
            orphan_discovery_count: 0,
            missing_cleanup_count: 0,
            reindex_from_metadata_ms: None,
            restore_sync_included_ms: 0,
            restore_sync_included_changed: false,
            write_all_from_db_ms: None,
            apply_scenario_ms: 0,
            apply_scenario_kind: "unknown",
            total_ms: 0,
        }
    }
}

pub fn initialize_store() -> Result<(Arc<SkillStore>, StartupTimings)> {
    initialize_store_inner(true)
}

pub fn initialize_cli_store() -> Result<Arc<SkillStore>> {
    initialize_store_inner(false).map(|(store, _)| store)
}

fn initialize_store_inner(
    apply_startup_default: bool,
) -> Result<(Arc<SkillStore>, StartupTimings)> {
    let total_start = Instant::now();
    let mut timings = StartupTimings::default();

    let step = Instant::now();
    central_repo::ensure_central_repo().context("Failed to create central repo")?;
    timings.ensure_central_repo_ms = step.elapsed().as_millis();

    let db_path = central_repo::db_path();
    let step = Instant::now();
    let store = Arc::new(SkillStore::new(&db_path).context("Failed to initialize database")?);
    timings.open_store_ms = step.elapsed().as_millis();

    let step = Instant::now();
    tool_service::migrate_legacy_tool_keys(&store)
        .map_err(|e| anyhow::anyhow!(e.to_string()))
        .context("Failed to migrate legacy tool keys")?;
    timings.migrate_legacy_tool_keys_ms = step.elapsed().as_millis();

    if sync_metadata::metadata_exists() {
        let step = Instant::now();
        sync_metadata::reindex_from_metadata(&store)
            .context("Failed to reindex from sync metadata")?;
        timings.reindex_from_metadata_ms = Some(step.elapsed().as_millis());
    }

    let step = Instant::now();
    timings.missing_cleanup_count = cleanup_missing_skills(&store)
        .context("Failed to clean up missing skill records")?;
    let _ = step.elapsed();

    let step = Instant::now();
    timings.orphan_discovery_count = discover_orphan_skills(&store)
        .context("Failed to discover orphan skill directories")?;
    let _ = step.elapsed();

    timings.skill_count = store.get_all_skills().map(|s| s.len()).unwrap_or(0);

    let step = Instant::now();
    let changed = scenario_service::restore_all_skills_sync_included(&store)
        .map_err(|e| anyhow::anyhow!(e.to_string()))
        .context("Failed to restore skill sync inclusion")?;
    timings.restore_sync_included_ms = step.elapsed().as_millis();
    timings.restore_sync_included_changed = changed;
    if changed {
        let step = Instant::now();
        sync_metadata::write_all_from_db(&store)
            .context("Failed to persist restored skill sync inclusion")?;
        timings.write_all_from_db_ms = Some(step.elapsed().as_millis());
    }

    let step = Instant::now();
    if apply_startup_default {
        scenario_service::ensure_default_startup_scenario(&store)
            .map_err(|e| anyhow::anyhow!(e.to_string()))
            .context("Failed to initialize startup scenario")?;
        timings.apply_scenario_kind = "default_startup";
    } else {
        scenario_service::ensure_cli_scenario_state(&store)
            .map_err(|e| anyhow::anyhow!(e.to_string()))
            .context("Failed to initialize CLI scenario state")?;
        timings.apply_scenario_kind = "cli";
    }
    timings.apply_scenario_ms = step.elapsed().as_millis();

    timings.total_ms = total_start.elapsed().as_millis();
    Ok((store, timings))
}

/// Scan the central skills directory for skill folders that exist on disk but
/// have no corresponding row in the SQLite database (e.g. manually placed or
/// left over from a prior version). Register them as "local"-sourced skills
/// so they appear in the skill center. Returns the number of newly registered
/// skills.
pub(crate) fn discover_orphan_skills(store: &SkillStore) -> Result<usize> {
    let skills_dir = central_repo::skills_dir();
    if !skills_dir.is_dir() {
        return Ok(0);
    }

    let existing = store.get_all_skills()?;
    let known_paths: std::collections::HashSet<String> = existing
        .iter()
        .map(|s| s.central_path.clone())
        .collect();

    let mut discovered = 0usize;
    let entries = match std::fs::read_dir(&skills_dir) {
        Ok(e) => e,
        Err(_) => return Ok(0),
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip the metadata directory and hidden dot-dirs.
        if name.starts_with('.') {
            continue;
        }
        let path_str = path.to_string_lossy().to_string();
        if known_paths.contains(&path_str) {
            continue;
        }
        // Must contain SKILL.md or skill.md to be considered a skill.
        if !skill_metadata::is_valid_skill_dir(&path) {
            continue;
        }

        let meta = skill_metadata::parse_skill_md(&path);
        let display_name = meta.name.unwrap_or_else(|| skill_metadata::infer_skill_name(&path));
        let description = meta.description;
        let content_hash = content_hash::hash_directory(&path).ok();
        let now = chrono::Utc::now().timestamp_millis();

        let record = super::skill_store::SkillRecord {
            id: uuid::Uuid::new_v4().to_string(),
            name: display_name.clone(),
            description,
            source_type: "local".to_string(),
            source_ref: None,
            source_ref_resolved: None,
            source_subpath: None,
            source_branch: None,
            source_revision: None,
            remote_revision: None,
            central_path: path_str,
            content_hash,
            enabled: true,
            created_at: now,
            updated_at: now,
            status: "ok".to_string(),
            update_status: "local_only".to_string(),
            last_checked_at: Some(now),
            last_check_error: None,
        };
        store.insert_skill(&record)?;
        discovered += 1;
        log::info!("discovered orphan skill: {} ({})", display_name, name);
    }

    if discovered > 0 {
        sync_metadata::write_all_from_db(store)?;
    }
    Ok(discovered)
}

/// Remove database records for skills whose central directory no longer exists
/// on disk (e.g. the user manually deleted the skill folder). Also cleans up
/// any deployed target symlinks pointing to the missing skill. Returns the
/// number of records removed.
pub(crate) fn cleanup_missing_skills(store: &SkillStore) -> Result<usize> {
    let existing = store.get_all_skills()?;
    let mut removed = 0usize;

    for skill in &existing {
        let path = std::path::Path::new(&skill.central_path);
        if path.exists() {
            continue;
        }
        if let Ok(targets) = store.get_targets_for_skill(&skill.id) {
            for target in &targets {
                let target_path = std::path::PathBuf::from(&target.target_path);
                let _ = sync_engine::remove_target(&target_path);
            }
        }
        store.delete_skill(&skill.id)?;
        removed += 1;
        log::info!("auto-removing missing skill: {} ({})", skill.name, skill.central_path);
    }

    if removed > 0 {
        sync_metadata::write_all_from_db(store)?;
    }
    Ok(removed)
}

impl StartupTimings {
    /// Emit a single human-readable log block from the captured timings.
    /// Called from `tauri::Builder::setup` once `tauri_plugin_log` is
    /// installed; calling it before that point would lose the output to
    /// the no-op default logger.
    pub fn log(&self) {
        log::info!(
            "startup: initialize_store total {} ms (skills={})",
            self.total_ms,
            self.skill_count
        );
        log::info!(
            "startup: ensure_central_repo {} ms, open_store {} ms, migrate_legacy_tool_keys {} ms",
            self.ensure_central_repo_ms,
            self.open_store_ms,
            self.migrate_legacy_tool_keys_ms
        );
        if let Some(ms) = self.reindex_from_metadata_ms {
            log::info!(
                "startup: reindex_from_metadata {} ms (skills={})",
                ms,
                self.skill_count
            );
        }
        if self.restore_sync_included_changed {
            log::info!(
                "startup: restore_sync_included changed in {} ms, write_all_from_db {} ms",
                self.restore_sync_included_ms,
                self.write_all_from_db_ms.unwrap_or(0)
            );
        } else {
            log::info!(
                "startup: restore_sync_included no-op in {} ms",
                self.restore_sync_included_ms
            );
        }
        log::info!(
            "startup: apply_scenario ({}) {} ms (skills={})",
            self.apply_scenario_kind,
            self.apply_scenario_ms,
            self.skill_count
        );
        if self.missing_cleanup_count > 0 {
            log::info!(
                "startup: cleanup_missing_skills removed {} skills",
                self.missing_cleanup_count
            );
        }
        if self.orphan_discovery_count > 0 {
            log::info!(
                "startup: discover_orphan_skills registered {} skills",
                self.orphan_discovery_count
            );
        }
    }
}
