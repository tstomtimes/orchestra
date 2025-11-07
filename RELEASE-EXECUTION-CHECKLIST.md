# Release Execution Checklist - v2.0.0

**Release Manager:** Blake
**Target Release Date:** 2025-11-04
**Current Version:** 1.1.0
**Target Version:** 2.0.0

---

## Pre-Release Checklist (Day 13 - CURRENT)

### Code Quality & Testing

- [x] **TypeScript Strict Mode** - Enabled in tsconfig.json
- [x] **ESLint** - 0 errors (reduced from 42)
- [x] **Code Quality** - All `any` types removed, all unused variables removed
- [x] **Build Status** - Clean with zero warnings
- [x] **Core Tests** - 361 passing (packages/core)
- [x] **Total Tests** - 457 passing (all packages)
- [x] **Hook Tests** - 34/34 passing (100%)
- [x] **Memory Bank Tests** - 21/21 passing (100%)

### Documentation

- [x] **CHANGELOG.md** - Updated with v2.0.0 release notes
- [x] **RELEASE-NOTES-v2.0.0.md** - Comprehensive release notes created
- [x] **README.md** - Current and accurate
- [x] **ORCHESTRA_SETUP.md** - Setup guide complete
- [x] **Memory Bank Guide** - Documentation complete
- [x] **ADR Documentation** - Architecture decisions documented

### Version Management

- [ ] **package.json** - Bump version to 2.0.0
- [ ] **mcp-servers/package.json** - Update if needed
- [ ] **Git Tag** - Create v2.0.0 tag
- [ ] **GitHub Release** - Draft release on GitHub

---

## Release Execution Steps (Day 14)

### Step 1: Final Quality Gate (Blake + Finn)

**Time Estimate:** 30 minutes

```bash
# 1. Run full test suite
pnpm test

# Expected: All 457 tests passing

# 2. Run lint check
pnpm lint

# Expected: 0 errors, 0 warnings

# 3. Run build
pnpm build

# Expected: Clean build with no warnings

# 4. Verify TypeScript strict mode
grep -A5 '"strict"' tsconfig.json

# Expected: "strict": true

# 5. Check Memory Bank initialization
bash .orchestra/scripts/test-memory-bank-init.sh

# Expected: All tests pass

# 6. Check document sync
bash .orchestra/scripts/test-sync-to-memory-bank.sh

# Expected: All tests pass

# 7. Verify hook system
bash hooks/session-start.sh

# Expected: No errors, session initialized
```

**Handoff to Finn:** If any tests fail, STOP and investigate. Do not proceed until all tests pass.

---

### Step 2: Version Bump (Blake)

**Time Estimate:** 10 minutes

```bash
# 1. Update root package.json
jq '.version = "2.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json

# 2. Update mcp-servers/package.json (if applicable)
cd mcp-servers
jq '.version = "2.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json
cd ..

# 3. Verify version updates
grep '"version"' package.json
grep '"version"' mcp-servers/package.json

# Expected: Both show "version": "2.0.0"

# 4. Stage version changes
git add package.json mcp-servers/package.json
```

---

### Step 3: Create Release Commit (Blake)

**Time Estimate:** 5 minutes

```bash
# Create release commit
git commit -m "$(cat <<'EOF'
release: Orchestra Plugin v2.0.0

Major release introducing:
- Agent Progress Tracking System (v2.0)
- Memory Bank Integration
- MCP Server Ecosystem
- Comprehensive Hook System
- Documentation-Driven Development

Test Status: 457/457 passing
Build Status: Clean (0 warnings)
ESLint Status: 0 errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Verify commit created
git log -1 --oneline
```

---

### Step 4: Create Git Tag (Blake)

**Time Estimate:** 5 minutes

```bash
# Create annotated tag with release notes
git tag -a v2.0.0 -m "$(cat <<'EOF'
Orchestra Plugin v2.0.0

Major Features:
- Agent Progress Tracking System with real-time visualization
- Memory Bank integration for persistent project knowledge
- MCP server ecosystem (Browser, GitHub, Vercel, Shopify, Slack)
- Comprehensive hook system with lenient/strict modes
- Documentation-driven development workflow

Quality Metrics:
- Tests: 457/457 passing (100%)
- Build: 0 warnings
- ESLint: 0 errors
- TypeScript: Strict mode enabled

Release Manager: Blake
Release Date: 2025-11-04
EOF
)"

# Verify tag created
git tag -l -n10 v2.0.0

# Push tag to remote
git push origin v2.0.0
```

---

### Step 5: Create GitHub Release (Blake)

**Time Estimate:** 15 minutes

**Option A: Using GitHub CLI (gh)**

```bash
# Create GitHub release with release notes
gh release create v2.0.0 \
  --title "Orchestra Plugin v2.0.0" \
  --notes-file RELEASE-NOTES-v2.0.0.md \
  --latest

# Verify release created
gh release view v2.0.0
```

**Option B: Using GitHub Web Interface**

1. Navigate to https://github.com/tstomtimes/orchestra/releases/new
2. Select tag: `v2.0.0`
3. Release title: `Orchestra Plugin v2.0.0`
4. Copy contents from `RELEASE-NOTES-v2.0.0.md` into description
5. Check "Set as latest release"
6. Click "Publish release"

---

### Step 6: Post-Release Verification (Blake + Finn)

**Time Estimate:** 30 minutes

#### Critical Path Smoke Tests

```bash
# Test 1: Clean Install
rm -rf node_modules mcp-servers/node_modules
./setup.sh
# Expected: All steps complete successfully

# Test 2: Memory Bank Initialization
rm -rf ~/memory-bank/orchestra
bash .orchestra/scripts/init-memory-bank.sh
ls -la ~/memory-bank/orchestra/
# Expected: 5 template files created

# Test 3: Progress Tracking Schema
jq '.version' .orchestra/cache/progress.json
# Expected: "2.0.0"

# Test 4: Hook Execution
bash hooks/session-start.sh
# Expected: No errors

# Test 5: Document Sync
bash .orchestra/scripts/sync-to-memory-bank.sh --dry-run
# Expected: Lists files to sync without errors

# Test 6: Sync Validation
npx ts-node .orchestra/scripts/sync-validator.ts
# Expected: Sync score calculated, no errors

# Test 7: Milestone Recording
bash .orchestra/scripts/record-milestone.sh "v2.0.0 Release" "Production release" "release" "Blake"
# Expected: Milestone recorded in progress.md
```

#### Non-Critical Tests

```bash
# Test 8: MCP Server Connectivity (requires GITHUB_TOKEN)
node mcp-servers/github-server.js &
sleep 5
kill %1
# Expected: Server starts and stops without errors

# Test 9: Progress Display
bash hooks/progress-tracker-display.sh
# Expected: Formatted progress output

# Test 10: Progress Export
bash hooks/progress-tracker-export.sh
cat progress-status.txt
# Expected: Plain text progress summary
```

**Handoff to Finn:** Execute smoke tests and report results. If any critical test fails, proceed to rollback plan.

---

### Step 7: Update Documentation (Blake + Eden)

**Time Estimate:** 15 minutes

```bash
# 1. Update README.md with release badge (if applicable)
# 2. Verify all documentation links work
# 3. Update any version-specific references

# 4. Create announcement content
cat > RELEASE-ANNOUNCEMENT.md << 'EOF'
# Orchestra Plugin v2.0.0 Released!

We're excited to announce Orchestra Plugin v2.0.0, a major release that transforms Claude Code into a semi-autonomous development team.

## Highlights

- Real-time agent progress tracking
- Persistent project knowledge (Memory Bank)
- MCP server ecosystem integration
- 457 tests passing (100% coverage)

## Get Started

```bash
git pull origin main
./setup.sh
```

Read the full release notes: [RELEASE-NOTES-v2.0.0.md](RELEASE-NOTES-v2.0.0.md)
EOF

# 5. Commit documentation updates
git add .
git commit -m "docs: Update documentation for v2.0.0 release"
git push origin main
```

---

### Step 8: Deployment Notification (Blake + Theo)

**Time Estimate:** 10 minutes

```bash
# 1. Notify Slack (if configured)
# Use Slack MCP server or webhook

# 2. Post to GitHub Discussions
# Announce release with highlights

# 3. Update project status
# Update .orchestra/sync-state.json if needed
```

---

## Post-Release Activities (Week 1)

### Monitoring (Blake + Theo)

- [ ] **Day 1-2:** Monitor GitHub issues for critical bugs
- [ ] **Day 3-5:** Track Memory Bank sync success rate
- [ ] **Day 6-7:** Validate progress tracking accuracy in real-world usage

### Metrics to Track

1. **Installation Success Rate**
   - Track successful `./setup.sh` executions
   - Monitor reported installation errors

2. **Memory Bank Adoption**
   - Number of projects using Memory Bank
   - Sync success rate

3. **Progress Tracking Accuracy**
   - Agent detection accuracy
   - User feedback on UX

4. **GitHub Activity**
   - Issue count (target: <5 critical issues)
   - Star count / fork count
   - Release download count

---

## Rollback Plan (If Critical Issues Found)

### Severity Assessment

**P0 (Critical):** Immediate rollback required
- Security vulnerability
- Data loss or corruption
- Complete system failure
- Setup script fails consistently

**P1 (High):** Patch release needed (v2.0.1)
- Major feature not working
- Performance degradation >50%
- Documentation errors causing confusion

**P2 (Medium):** Can wait for v2.1.0
- Minor bugs
- UX improvements
- Non-critical documentation updates

### Rollback Procedure (P0 Only)

```bash
# 1. Tag current state for forensics
git tag v2.0.0-rollback
git push origin v2.0.0-rollback

# 2. Revert to v1.1.0
git checkout v1.1.0
./setup.sh

# 3. Create GitHub issue
gh issue create \
  --title "[P0] Critical issue requiring v2.0.0 rollback" \
  --body "Description of issue..."

# 4. Update GitHub release
gh release edit v2.0.0 \
  --draft \
  --notes "⚠️ WARNING: This release has been temporarily rolled back due to critical issues. Please use v1.1.0 instead."

# 5. Post announcement
# Notify users via Slack/GitHub Discussions

# 6. Root cause analysis
# Investigate issue in isolated environment
# Create hotfix branch: hotfix/v2.0.1
```

---

## Hotfix Release Process (v2.0.1)

If P0 or P1 issues are discovered post-release:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/v2.0.1 v2.0.0

# 2. Apply fix
# Make necessary code changes

# 3. Test fix
pnpm test
# All tests must pass

# 4. Update version
jq '.version = "2.0.1"' package.json > package.json.tmp && mv package.json.tmp package.json

# 5. Commit fix
git commit -m "fix: [Description of fix]"

# 6. Tag and release
git tag v2.0.1
git push origin hotfix/v2.0.1 v2.0.1

# 7. Merge to main
git checkout main
git merge hotfix/v2.0.1
git push origin main
```

---

## Success Criteria

### Release is Successful If:

1. All 457 tests pass
2. Setup script completes without errors
3. Memory Bank initializes successfully
4. Progress tracking displays correctly
5. No P0 issues reported within 72 hours
6. <5 P1 issues reported within Week 1
7. Positive community feedback

### Release Requires Hotfix If:

1. Any P0 issue discovered
2. >5 P1 issues reported within 48 hours
3. Setup script fails >20% of the time
4. Critical documentation errors

---

## Communication Plan

### Internal (Team)

- **Day 13 (Today):** Release preparation complete
- **Day 14 (Tomorrow):** Execute release steps 1-8
- **Day 14 EOD:** Post-release verification complete
- **Week 1:** Monitoring and stabilization

### External (Users)

- **Day 14:** GitHub release published
- **Day 14:** Release announcement on GitHub Discussions
- **Day 15:** Community Q&A session (if needed)
- **Week 2-3:** Blog post and tutorials

---

## Handoff Instructions

### For Finn (QA Engineer)

**When:** After Step 1 (Final Quality Gate)

**Tasks:**
1. Execute full test suite
2. Verify all 457 tests pass
3. Run smoke tests after release (Step 6)
4. Report any test failures immediately

**Decision Authority:**
- STOP release if any critical tests fail
- GREEN LIGHT release if all tests pass

### For Eden (Documentation)

**When:** After Step 7 (Update Documentation)

**Tasks:**
1. Review all documentation for accuracy
2. Verify all links work
3. Update any version-specific references
4. Create social media announcement content

### For Theo (DevOps)

**When:** After Step 8 (Deployment Notification)

**Tasks:**
1. Monitor GitHub Actions (if applicable)
2. Set up monitoring dashboards
3. Track deployment metrics
4. Configure alerts for critical errors

---

## Checklist Summary

### Day 13 (COMPLETE)

- [x] Code quality verified
- [x] Tests passing (457/457)
- [x] Documentation updated
- [x] CHANGELOG.md created
- [x] RELEASE-NOTES-v2.0.0.md created
- [x] RELEASE-EXECUTION-CHECKLIST.md created

### Day 14 (PENDING)

- [ ] Step 1: Final quality gate (Finn)
- [ ] Step 2: Version bump (Blake)
- [ ] Step 3: Release commit (Blake)
- [ ] Step 4: Git tag (Blake)
- [ ] Step 5: GitHub release (Blake)
- [ ] Step 6: Post-release verification (Finn + Blake)
- [ ] Step 7: Documentation update (Eden + Blake)
- [ ] Step 8: Deployment notification (Theo + Blake)

### Week 1 (MONITORING)

- [ ] Monitor GitHub issues
- [ ] Track Memory Bank adoption
- [ ] Validate progress tracking
- [ ] Gather community feedback

---

**Everything's lined up. Let's ship!**

Blake - Release Manager
Orchestra Plugin Team
