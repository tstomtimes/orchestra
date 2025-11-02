# hooks/after_deploy.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[after_deploy] Smoke tests & rollback readiness..."
# TODO: smoke tests, generate rollout-status.md