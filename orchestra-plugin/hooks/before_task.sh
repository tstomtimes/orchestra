# hooks/before_task.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_task] Checking clarity & acceptance criteria..."
# TODO: run clarity checks / block if missing