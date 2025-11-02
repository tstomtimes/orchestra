# hooks/before_merge.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_merge] Running integration/E2E/Lighthouse..."
# TODO: playwright, lighthouse-ci