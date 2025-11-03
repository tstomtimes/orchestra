# Changelog

All notable changes to the Orchestra Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-11-04

### Added

#### Agent Progress Tracking System
- Real-time agent activity monitoring with automatic detection
- Visual progress bars with ANSI color-coded status indicators
- Multi-agent concurrent execution tracking
- Agent-specific emoji identifiers for quick recognition
- Elapsed time tracking per task (mm:ss format)
- Overall completion percentage calculation
- External monitoring capability via `progress-status.txt` export
- File locking mechanism to prevent race conditions
- Automatic schema migration from v1.0 to v2.0

#### Core Components
- `hooks/progress-tracker-update.sh` - Atomic JSON update engine with file locking
- `hooks/progress-tracker-display.sh` - Enhanced ANSI-formatted display system
- `hooks/progress-tracker-export.sh` - External monitoring export functionality
- `hooks/lib/progress-migrate.sh` - Schema migration system with backup creation
- Enhanced `hooks/lib/progress-utils.sh` - Cross-platform utility functions

#### Documentation
- `docs/AGENT-PROGRESS-TRACKING-USER-GUIDE.md` - Comprehensive user guide
- `docs/AGENT-PROGRESS-TRACKING-OPERATIONS.md` - Operations and troubleshooting guide
- `docs/architecture/ADR-001-enhanced-progress-tracking-system.md` - Architecture decision record
- `docs/architecture/PROGRESS-TRACKING-EXECUTIVE-SUMMARY.md` - Executive summary
- `docs/architecture/PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md` - Implementation guide
- `docs/architecture/progress-tracking-architecture-diagram.md` - System architecture diagram

### Improved

#### Performance
- Optimized JSON parsing with jq for sub-100ms updates
- Efficient file locking with automatic cleanup
- Reduced I/O operations through atomic updates
- Performance target: <100ms per update (3-5 tasks typical)

#### Cross-platform Compatibility
- macOS (BSD date) and Linux (GNU date) support
- Portable shell scripts with bash compatibility
- Consistent timestamp generation across platforms
- Universal file locking mechanism

#### Error Handling
- Robust file locking with graceful cleanup on errors
- Fallback mechanisms for missing utilities
- Detailed error messages for debugging
- Input validation on all TodoWrite parameters

#### Visual Design
- ANSI color-coded progress bars
- Agent emoji indicators (mood-based on progress)
- Structured terminal output with clear sections
- Compact progress summary format

### Fixed

#### Critical (P0)
- macOS timestamp generation bug (BSD date compatibility)
- Race condition in concurrent JSON updates
- JSON schema validation errors during migration
- PROJECT_ROOT path resolution in hook scripts

#### High Priority (P1)
- Agent detection accuracy improvements (80-90% success rate)
- File locking timeout handling
- Progress percentage calculation edge cases
- Display formatting for long task names

### Changed

#### Schema Updates
- `progress.json` schema upgraded from v1.0 to v2.0
- Added `activeAgents` array for multi-agent tracking
- Added `stats` object for aggregated metrics
- Enhanced task structure with `agent`, `duration`, and `progress` fields

#### Hook Integration
- `post_code_write.sh` now calls progress tracking after TodoWrite
- `session-start.sh` initializes schema and runs migrations
- Maintained backward compatibility with existing hooks

### Security

- File locking mechanism prevents concurrent write corruption
- Input validation on all TodoWrite parameters
- Secure file permissions on `.orchestra/cache/` directory
- No sensitive data stored in progress tracking files

### Known Limitations

1. **Agent Detection**
   - 80-90% accuracy with heuristic-based detection
   - May require explicit agent context in complex scenarios
   - Future improvement: Machine learning-based detection

2. **TodoWrite Dependency**
   - Progress tracking requires agents to use TodoWrite tool
   - No tracking for agents that don't report progress via TodoWrite

3. **Performance Constraints**
   - Optimized for typical workloads (3-5 concurrent tasks)
   - May degrade with extremely large task lists (>50 tasks)
   - P1 optimization opportunities identified for future releases

### Migration Notes

#### Automatic Migration
- v1.0 to v2.0 schema migration runs automatically on session start
- Backup file created at `.orchestra/cache/progress.json.backup`
- Zero downtime migration process
- Rollback available via backup restoration

#### Manual Migration
```bash
# Run migration manually
./hooks/lib/progress-migrate.sh

# Verify migration
jq '.version' .orchestra/cache/progress.json
# Should output: "2.0.0"
```

### Testing

- **Total Tests:** 34/34 passed (100%)
- **Core Functionality:** 12/12 passed
- **Agent Detection:** 8/8 passed
- **Race Conditions:** 6/6 passed
- **Performance:** 5/5 passed
- **Migration:** 3/3 passed

### Credits

This release was developed by the Orchestra team:
- **Kai** - System architecture and design
- **Skye** - Core implementation and optimization
- **Finn** - Testing and quality assurance
- **Eden** - Documentation and user guides
- **Blake** - Release management and coordination

---

## [1.0.0] - 2025-11-03

### Added
- Initial TodoWrite hook integration for progress tracking
- Basic progress.json schema (v1.0)
- Simple progress display in chat
- Task status tracking (pending, in_progress, completed)

### Changed
- Integrated with existing Claude Code hooks
- Basic progress percentage calculation

---

## Release Management

### Version Numbering
This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Tags
- Format: `vX.Y.Z` (e.g., `v2.0.0`)
- Tags are created on the main branch for each release
- Pre-release versions use suffixes: `v2.0.0-beta.1`, `v2.0.0-rc.1`

### Support Policy
- **Latest Release:** Full support with bug fixes and security updates
- **Previous Major Version:** Security updates only (6 months)
- **Older Versions:** Community support via GitHub issues

---

## Links

- [GitHub Repository](https://github.com/tstomtimes/orchestra)
- [Issue Tracker](https://github.com/tstomtimes/orchestra/issues)
- [Documentation](docs/)
- [Release Notes](RELEASE-NOTES-v2.0.0.md)
