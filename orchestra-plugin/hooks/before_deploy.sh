# hooks/before_deploy.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_deploy] Checking env vars, migrations dry-run, health..."
# TODO: db migrate dry-run, env check, health