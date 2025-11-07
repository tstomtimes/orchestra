# Version Bump Summary - v2.0.0 Release

**Prepared By:** Blake (Release Manager)
**Date:** 2025-11-04
**Current Version:** 1.1.0
**Target Version:** 2.0.0

---

## Overview

This document summarizes all package.json files that require version updates for the v2.0.0 release of Orchestra Plugin.

---

## Package Version Updates

### Root Package

**File:** `/Users/tstomtimes/Documents/GitHub/orchestra/package.json`

**Current Version:** 1.1.0
**Target Version:** 2.0.0

**Changes Required:**
```json
{
  "name": "tdd.ai",
  "version": "2.0.0"
}
```

**Update Command:**
```bash
jq '.version = "2.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json
```

---

### MCP Servers Package

**File:** `/Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers/package.json`

**Current Version:** Unknown (needs verification)
**Target Version:** 2.0.0

**Changes Required:**
```json
{
  "name": "orchestra-mcp-servers",
  "version": "2.0.0"
}
```

**Update Command:**
```bash
cd mcp-servers
jq '.version = "2.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json
cd ..
```

---

## Version Bump Strategy

### Semantic Versioning Justification

**Why Major Version (2.0.0)?**

This release includes breaking changes that justify a major version bump:

1. **Hook File Locations Changed**
   - Old: `.claude/hooks/`
   - New: `hooks/`
   - Impact: Custom hook integrations need updating

2. **Command File Locations Changed**
   - Old: `.claude/commands/`
   - New: `commands/`
   - Impact: Custom command references need updating

3. **Configuration Structure Changed**
   - Removed: `.claude/settings.json`
   - New: `.orchestra/config.json`
   - Impact: Configuration migration required

4. **MCP Server Configuration Changed**
   - Old: Separate config files per server
   - New: Unified `.claude.json`
   - Impact: MCP server setup needs updating

5. **Progress Tracking Schema Updated**
   - Old: v1.0 schema
   - New: v2.0 schema
   - Impact: Automatic migration provided, but schema incompatible

---

## Dependencies Requiring Updates

### Development Dependencies

All development dependencies in root `package.json` are current:

```json
{
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "jest": "^30.2.0",
    "prettier": "^3.2.5",
    "ts-jest": "^29.4.5",
    "typescript": "^5.6.0",
    "vitest": "^2.1.2"
  }
}
```

**No updates required** - all dependencies are at latest stable versions.

---

### MCP Server Dependencies

Dependencies in `mcp-servers/package.json` need verification:

**Expected Dependencies:**
- express (web server)
- playwright (browser automation)
- typescript (compilation)
- ts-node (execution)

**Update Strategy:**
```bash
cd mcp-servers
npm outdated
npm update
cd ..
```

**Note:** Only update if security vulnerabilities found or critical bug fixes available.

---

## Git Tag Strategy

### Tag Format

**Tag Name:** `v2.0.0`
**Tag Type:** Annotated (includes message)
**Tag Message:** See release notes summary

### Previous Tags

```
v1.1.0 - 2025-11-03 (Previous release)
v1.0.0 - 2025-10-28 (Initial release)
```

### Tag Creation Command

```bash
git tag -a v2.0.0 -m "Orchestra Plugin v2.0.0 - Agent Progress Tracking & Memory Bank Integration"
git push origin v2.0.0
```

---

## GitHub Release Strategy

### Release Configuration

**Release Title:** Orchestra Plugin v2.0.0
**Release Tag:** v2.0.0
**Release Notes:** Contents of `RELEASE-NOTES-v2.0.0.md`
**Pre-release:** No (this is a stable release)
**Latest Release:** Yes (mark as latest)

### Release Assets

No binary assets to upload (source-only release).

**Installation Method:**
```bash
git clone https://github.com/tstomtimes/orchestra.git
cd orchestra
git checkout v2.0.0
./setup.sh
```

---

## Version Verification Commands

### Before Release

```bash
# Check current versions
echo "Root package version:"
jq -r '.version' package.json

echo "MCP servers version:"
jq -r '.version' mcp-servers/package.json

# Expected output:
# Root package version: 1.1.0
# MCP servers version: [current version]
```

### After Version Bump

```bash
# Verify version updates
echo "Root package version:"
jq -r '.version' package.json

echo "MCP servers version:"
jq -r '.version' mcp-servers/package.json

# Expected output:
# Root package version: 2.0.0
# MCP servers version: 2.0.0

# Verify no other package.json files need updating
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/venv/*" -exec echo "File: {}" \; -exec jq -r '.version' {} \;
```

---

## Package Publication Strategy

### NPM Publication

**Status:** NOT APPLICABLE

Orchestra Plugin is not currently published to npm. It is distributed via GitHub releases only.

**Future Consideration:**
If npm publication is desired in future:
1. Create npm account for orchestra-plugin
2. Configure package.json with npm metadata
3. Set up CI/CD for automated publishing
4. Add `npm publish` to release checklist

---

## Dependency Version Constraints

### Version Pinning Strategy

**Current Strategy:** Use caret (^) for non-breaking updates

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "playwright": "^1.40.0"
  }
}
```

**Recommendation:** Continue using caret (^) for flexibility while avoiding breaking changes.

**Alternative Strategies:**
- Exact pinning (`4.18.0`) - Most restrictive, maximum stability
- Tilde (`~4.18.0`) - Patch updates only
- Caret (`^4.18.0`) - Minor updates allowed (current)

---

## Breaking Changes Impact Analysis

### User-Facing Breaking Changes

1. **Hook Locations**
   - Impact: Medium
   - Affected Users: Users with custom hooks
   - Migration: Update hook paths in documentation
   - Mitigation: Automatic migration via setup.sh

2. **Configuration Files**
   - Impact: High
   - Affected Users: All users
   - Migration: Run setup.sh to regenerate configs
   - Mitigation: Setup script handles migration

3. **MCP Server Config**
   - Impact: Medium
   - Affected Users: Users with custom MCP servers
   - Migration: Update .claude.json
   - Mitigation: Example configs provided

### Developer-Facing Breaking Changes

1. **Progress Schema v2.0**
   - Impact: Low
   - Affected Developers: Custom progress tracking integrations
   - Migration: Automatic schema migration on first run
   - Mitigation: Backup created before migration

---

## Rollback Considerations

### Version Rollback Process

If critical issues found after release:

```bash
# Revert version bump
git revert <commit-hash-of-version-bump>

# Or restore from backup
git checkout v1.1.0 -- package.json
git checkout v1.1.0 -- mcp-servers/package.json

# Commit rollback
git commit -m "rollback: Revert to v1.1.0 due to critical issue"

# Update tag (if already pushed)
git tag -d v2.0.0
git push origin :refs/tags/v2.0.0
```

### Version Recovery

Users can always revert to previous version:

```bash
git checkout v1.1.0
./setup.sh
```

---

## Post-Release Version Management

### Version Branches

**Strategy:** Main branch only (no version branches)

**Rationale:**
- Simplifies development workflow
- Encourages forward-only progress
- Hotfixes applied to main and cherry-picked if needed

### Hotfix Version Strategy

If hotfix needed:

**Next Version:** 2.0.1 (patch)
**Branch:** `hotfix/v2.0.1` (temporary)
**Process:**
1. Create hotfix branch from v2.0.0 tag
2. Apply fix
3. Test thoroughly
4. Tag as v2.0.1
5. Merge to main
6. Delete hotfix branch

---

## Version Bump Execution Plan

### Step-by-Step Execution

**Time Estimate:** 15 minutes

```bash
# Step 1: Verify current versions (2 min)
echo "=== Current Versions ==="
jq -r '.version' package.json
jq -r '.version' mcp-servers/package.json

# Step 2: Update root package.json (2 min)
jq '.version = "2.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json

# Step 3: Update mcp-servers/package.json (2 min)
cd mcp-servers
jq '.version = "2.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json
cd ..

# Step 4: Verify updates (2 min)
echo "=== Updated Versions ==="
jq -r '.version' package.json
jq -r '.version' mcp-servers/package.json

# Step 5: Stage changes (1 min)
git add package.json mcp-servers/package.json

# Step 6: Verify staged changes (2 min)
git diff --staged

# Step 7: Ready for commit (see RELEASE-EXECUTION-CHECKLIST.md Step 3)
echo "✅ Version bump complete. Ready for release commit."
```

---

## Files Requiring Version Updates

### Summary Table

| File Path | Current Version | Target Version | Priority | Notes |
|-----------|----------------|----------------|----------|-------|
| `/package.json` | 1.1.0 | 2.0.0 | P0 | Root package |
| `/mcp-servers/package.json` | TBD | 2.0.0 | P0 | MCP servers |

**Priority Legend:**
- P0: Critical (must update)
- P1: Important (should update)
- P2: Optional (can update)

---

## Version Bump Verification Checklist

- [ ] Root package.json version updated to 2.0.0
- [ ] MCP servers package.json version updated to 2.0.0
- [ ] No other package.json files need updating (verified)
- [ ] Git diff shows only version changes
- [ ] No unintended changes in package.json files
- [ ] All package.json files valid JSON (jq validates)
- [ ] Ready to stage changes for commit

---

## Coordination with Release Manager

### Blake's Responsibilities

1. Execute version bump commands
2. Verify version updates
3. Stage changes for release commit
4. Create git tag with release notes
5. Push tag to GitHub
6. Create GitHub release
7. Verify release publication

### Handoff Points

**To Finn (QA):**
- After version bump, before commit
- Verify no unintended changes in package.json

**To Eden (Documentation):**
- After GitHub release published
- Update documentation with new version references

**To Theo (DevOps):**
- After release complete
- Monitor deployment and version adoption

---

## Success Criteria

### Version Bump Successful If:

1. All package.json files show version 2.0.0
2. Git diff shows only version changes (no other modifications)
3. All package.json files are valid JSON
4. No build errors after version bump
5. Git commit created successfully
6. Git tag v2.0.0 created successfully
7. GitHub release shows v2.0.0

---

**Everything's lined up. Let's ship!**

Blake - Release Manager
Orchestra Plugin Team
2025-11-04
