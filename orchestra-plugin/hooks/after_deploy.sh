# hooks/after_deploy.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[after_deploy] Smoke tests & rollback readiness..."

DEPLOY_ENV="${DEPLOY_ENV:-production}"
DEPLOY_URL="${DEPLOY_URL:-https://app.example.com}"
ROLLOUT_STATUS_FILE="rollout-status.md"

echo "→ Deployment environment: $DEPLOY_ENV"
echo "→ Deployment URL: $DEPLOY_URL"

# Wait for deployment to be ready
echo "→ Waiting for deployment to stabilize..."
sleep 10

# Smoke tests - Critical path validation
echo "→ Running smoke tests..."

smoke_test_failed=false

# Test 1: Health endpoint
echo "  • Testing health endpoint..."
if curl -f -s --max-time 10 "$DEPLOY_URL/health" > /dev/null 2>&1; then
  echo "    ✅ Health endpoint responsive"
else
  echo "    ❌ Health endpoint failed"
  smoke_test_failed=true
fi

# Test 2: API endpoints
echo "  • Testing API endpoints..."
if curl -f -s --max-time 10 "$DEPLOY_URL/api/status" > /dev/null 2>&1; then
  echo "    ✅ API endpoints responsive"
else
  echo "    ❌ API endpoints failed"
  smoke_test_failed=true
fi

# Test 3: Database connectivity
echo "  • Testing database connectivity..."
if curl -f -s --max-time 10 "$DEPLOY_URL/api/db-check" > /dev/null 2>&1; then
  echo "    ✅ Database connectivity verified"
else
  echo "    ❌ Database connectivity failed"
  smoke_test_failed=true
fi

# Test 4: Authentication flow (if applicable)
if [ -n "${AUTH_TEST_TOKEN:-}" ]; then
  echo "  • Testing authentication..."
  if curl -f -s --max-time 10 -H "Authorization: Bearer $AUTH_TEST_TOKEN" "$DEPLOY_URL/api/me" > /dev/null 2>&1; then
    echo "    ✅ Authentication working"
  else
    echo "    ❌ Authentication failed"
    smoke_test_failed=true
  fi
fi

# Generate rollout status report
echo "→ Generating rollout status report..."

cat > "$ROLLOUT_STATUS_FILE" <<EOF
# Deployment Rollout Status

**Environment:** $DEPLOY_ENV
**Deployment URL:** $DEPLOY_URL
**Timestamp:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Deployed By:** ${USER:-unknown}
**Git Commit:** $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
**Git Branch:** $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

## Smoke Test Results

| Test | Status |
|------|--------|
| Health Endpoint | $(curl -f -s --max-time 5 "$DEPLOY_URL/health" > /dev/null 2>&1 && echo "✅ Pass" || echo "❌ Fail") |
| API Endpoints | $(curl -f -s --max-time 5 "$DEPLOY_URL/api/status" > /dev/null 2>&1 && echo "✅ Pass" || echo "❌ Fail") |
| Database Connectivity | $(curl -f -s --max-time 5 "$DEPLOY_URL/api/db-check" > /dev/null 2>&1 && echo "✅ Pass" || echo "❌ Fail") |

## Rollback Procedure

If issues are detected, rollback using:

\`\`\`bash
# Vercel
vercel rollback <deployment-url>

# Kubernetes
kubectl rollout undo deployment/<deployment-name> -n <namespace>

# Docker / Docker Compose
docker-compose down && git checkout <previous-commit> && docker-compose up -d

# Heroku
heroku releases:rollback -a <app-name>
\`\`\`

## Monitoring

- **Logs:** \`kubectl logs -f deployment/<name>\` or check your logging service
- **Metrics:** Check Datadog/Grafana/CloudWatch dashboards
- **Errors:** Monitor Sentry/error tracking service
- **Performance:** Check response times and error rates

## Next Steps

- [ ] Monitor error rates for next 30 minutes
- [ ] Check user-facing features manually
- [ ] Verify analytics/tracking is working
- [ ] Announce deployment in team channel
- [ ] Update release notes

---

**Status:** $(if [ "$smoke_test_failed" = false ]; then echo "✅ Deployment Successful"; else echo "❌ Deployment Failed - Consider Rollback"; fi)
EOF

echo "✅ Rollout status report generated: $ROLLOUT_STATUS_FILE"
cat "$ROLLOUT_STATUS_FILE"

# Send notification (if Slack webhook is configured)
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  echo "→ Sending Slack notification..."

  STATUS_EMOJI=$(if [ "$smoke_test_failed" = false ]; then echo ":white_check_mark:"; else echo ":x:"; fi)
  STATUS_TEXT=$(if [ "$smoke_test_failed" = false ]; then echo "Successful"; else echo "Failed"; fi)

  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"$STATUS_EMOJI Deployment $STATUS_TEXT\",\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"*Deployment $STATUS_TEXT*\n*Environment:* $DEPLOY_ENV\n*URL:* $DEPLOY_URL\n*Commit:* $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')\"}}]}" \
    > /dev/null 2>&1 || echo "⚠️  Failed to send Slack notification"
fi

# Voice notification (Theo announces deployment status)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  if [ "$smoke_test_failed" = false ]; then
    "$VOICE_SCRIPT" "theo" "deployment" 2>/dev/null || true
  fi
fi

# Auto-commit deployment verification results (Theo)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ] && [ "$smoke_test_failed" = false ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "chore" \
    "to track deployment state" \
    "Complete post-deployment verification (smoke tests, rollout status)" \
    "Theo" 2>/dev/null || true
fi

# Exit with error if smoke tests failed
if [ "$smoke_test_failed" = true ]; then
  echo "❌ Smoke tests failed! Consider rolling back the deployment."
  exit 1
fi

echo "✅ All post-deployment checks passed!"