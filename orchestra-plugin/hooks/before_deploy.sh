# hooks/before_deploy.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_deploy] Checking env vars, migrations dry-run, health..."

DEPLOY_ENV="${DEPLOY_ENV:-production}"
echo "→ Deployment target: $DEPLOY_ENV"

# Environment variable validation
echo "→ Validating required environment variables..."
REQUIRED_VARS=(
  "DATABASE_URL"
  "API_KEY"
  # Add your required env vars here
)

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '   - %s\n' "${missing_vars[@]}"
  exit 1
fi
echo "✅ All required environment variables are set"

# Database migration dry-run
if [ -f "package.json" ] && grep -q "prisma" package.json; then
  echo "→ Running Prisma migration dry-run..."
  npx prisma migrate deploy --dry-run || {
    echo "❌ Database migration dry-run failed. Please review migrations before deploying."
    exit 1
  }
  echo "✅ Prisma migrations validated"
elif [ -f "manage.py" ]; then
  echo "→ Running Django migration check..."
  python manage.py migrate --check || {
    echo "❌ Django migrations are not applied. Please review migrations before deploying."
    exit 1
  }
  echo "✅ Django migrations validated"
elif command -v alembic &> /dev/null && [ -f "alembic.ini" ]; then
  echo "→ Running Alembic migration check..."
  alembic check || {
    echo "❌ Alembic migrations are not up to date. Please review migrations before deploying."
    exit 1
  }
  echo "✅ Alembic migrations validated"
else
  echo "ℹ️  No database migration system detected. Skipping migration check."
fi

# Health check for staging/production services
if [ "$DEPLOY_ENV" != "development" ]; then
  echo "→ Performing pre-deployment health check..."

  # Check if staging/production API is accessible
  HEALTH_URL="${HEALTH_CHECK_URL:-https://api.example.com/health}"

  if command -v curl &> /dev/null; then
    if curl -f -s --max-time 10 "$HEALTH_URL" > /dev/null; then
      echo "✅ Current deployment is healthy: $HEALTH_URL"
    else
      echo "⚠️  Warning: Health check failed for current deployment"
      echo "   URL: $HEALTH_URL"
      echo "   Continue? (y/N)"
      read -r response
      if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  else
    echo "⚠️  curl not available. Skipping health check."
  fi
fi

# Build validation
if [ -f "package.json" ]; then
  echo "→ Validating production build..."
  npm run build || {
    echo "❌ Production build failed."
    exit 1
  }
  echo "✅ Production build successful"
fi

# Container image security scan (if using Docker)
if [ -f "Dockerfile" ] && command -v trivy &> /dev/null; then
  echo "→ Scanning Docker image for vulnerabilities..."
  docker build -t pre-deploy-check:latest . > /dev/null
  trivy image --severity HIGH,CRITICAL --exit-code 1 pre-deploy-check:latest || {
    echo "❌ Critical vulnerabilities found in Docker image."
    exit 1
  }
  echo "✅ Docker image security scan passed"
fi

# Voice notification (Iris announces security checks completion)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  "$VOICE_SCRIPT" "iris" "deployment validation" 2>/dev/null || true
fi

echo "✅ All pre-deployment checks passed! Ready to deploy to $DEPLOY_ENV"

# Auto-commit deployment validation results (Iris)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "chore" \
    "to validate deployment security" \
    "Pass pre-deployment checks (env, migrations, health, build, security scan)" \
    "Iris" 2>/dev/null || true
fi