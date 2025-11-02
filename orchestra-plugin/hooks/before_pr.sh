# hooks/before_pr.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_pr] Running lint/type/tests/secret/sbom..."
# TODO: eslint/tsc/pytest/trufflehog/syft+grype