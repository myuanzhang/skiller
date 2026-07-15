---
title: Install Marketplace Card V1 Design
type: design
tags: [skiller, ui, install-skills, marketplace-card]
created: 2026-07-09
---

# Install Marketplace Card V1 Design

## Context

After the Install Skills IA v1 update, the page has a clearer top-level intake structure. The marketplace card itself remains dense: source identity, skill name, skill id, external link, install state, install count, and contributor filter all compete in a small area.

## Goal

Redesign only the marketplace skill card presentation so scan hierarchy is clearer and the primary install action is easier to identify. Preserve all marketplace data, handlers, search/filter behavior, pagination, and install/cancel behavior.

## Non-Goals

- Do not change marketplace search, filtering, pagination, loading, or caching logic.
- Do not change local install or Git install sections.
- Do not change install/cancel handlers.
- Do not add new i18n keys.
- Do not add dependencies.
- Do not create a new extracted component in this slice.

## Scope

Modify only:

- the JSX/classes inside `paginatedMarketSkills.map(...)` in `app/src/views/InstallSkills.tsx`.

Keep unchanged:

- `displayName`, `showSkillId`, `owner`, `avatarUrl`, `sourceRef`, `isInstalled` derivations;
- `openUrl(...)`;
- `handleInstallSkillssh(skill)`;
- `handleCancelInstall(...)`;
- `setMarketSourceFilter(skill.source)`;
- install count formatting.

## Design

The card should read top-to-bottom:

1. Skill identity
   - avatar;
   - display name;
   - skill id if different.

2. Source and popularity metadata
   - contributor source chip;
   - install count when available;
   - installed badge when installed.

3. Actions
   - external link remains secondary;
   - install/cancel/installed state remains in the top-right action cluster.

Use existing tokens and shapes:

- `app-panel`
- `rounded-control`
- `border-border-subtle`
- `bg-background`
- `bg-accent-bg`
- `text-accent-light`

No marketing copy or decorative media.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Marketplace cards still render for all tabs/search results.
- External link still opens `skills.sh`.
- Install button still calls one-click install.
- Cancel button still appears during install.
- Installed state still shows the installed indicator.
- Contributor source chip still filters by source.

## Success Criteria

- Only marketplace card presentation changes.
- No local/Git sections are modified.
- No new i18n keys are added.
- Build and lint pass.
