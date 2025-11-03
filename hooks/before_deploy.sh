# hooks/before_deploy.sh
#!/usr/bin/env bash
set -euo pipefail

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

if [ "$LANG" = "ja" ]; then
  echo "[before_deploy] 環境変数チェック、マイグレーションドライラン、ヘルスチェック実行中..."
else
  echo "[before_deploy] Checking env vars, migrations dry-run, health..."
fi

DEPLOY_ENV="${DEPLOY_ENV:-production}"

if [ "$LANG" = "ja" ]; then
  echo "→ デプロイ対象環境：$DEPLOY_ENV"
else
  echo "→ Deployment target: $DEPLOY_ENV"
fi

# Environment variable validation
if [ "$LANG" = "ja" ]; then
  echo "→ 必須環境変数の検証中..."
else
  echo "→ Validating required environment variables..."
fi

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
  if [ "$LANG" = "ja" ]; then
    echo "❌ 必須環境変数が不足しています："
  else
    echo "❌ Missing required environment variables:"
  fi
  printf '   - %s\n' "${missing_vars[@]}"
  exit 1
fi

if [ "$LANG" = "ja" ]; then
  echo "✅ 全ての必須環境変数が設定されています"
else
  echo "✅ All required environment variables are set"
fi

# Database migration dry-run
if [ -f "package.json" ] && grep -q "prisma" package.json; then
  if [ "$LANG" = "ja" ]; then
    echo "→ Prismaマイグレーションドライラン実行中..."
  else
    echo "→ Running Prisma migration dry-run..."
  fi

  npx prisma migrate deploy --dry-run || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ データベースマイグレーションドライランが失敗しました。デプロイ前にマイグレーションを確認してください。"
    else
      echo "❌ Database migration dry-run failed. Please review migrations before deploying."
    fi
    exit 1
  }

  if [ "$LANG" = "ja" ]; then
    echo "✅ Prismaマイグレーションが検証されました"
  else
    echo "✅ Prisma migrations validated"
  fi
elif [ -f "manage.py" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ Djangoマイグレーションチェック実行中..."
  else
    echo "→ Running Django migration check..."
  fi

  python manage.py migrate --check || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ Djangoマイグレーションが適用されていません。デプロイ前にマイグレーションを確認してください。"
    else
      echo "❌ Django migrations are not applied. Please review migrations before deploying."
    fi
    exit 1
  }

  if [ "$LANG" = "ja" ]; then
    echo "✅ Djangoマイグレーションが検証されました"
  else
    echo "✅ Django migrations validated"
  fi
elif command -v alembic &> /dev/null && [ -f "alembic.ini" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ Alembicマイグレーションチェック実行中..."
  else
    echo "→ Running Alembic migration check..."
  fi

  alembic check || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ Alembicマイグレーションが最新ではありません。デプロイ前にマイグレーションを確認してください。"
    else
      echo "❌ Alembic migrations are not up to date. Please review migrations before deploying."
    fi
    exit 1
  }

  if [ "$LANG" = "ja" ]; then
    echo "✅ Alembicマイグレーションが検証されました"
  else
    echo "✅ Alembic migrations validated"
  fi
else
  if [ "$LANG" = "ja" ]; then
    echo "ℹ️  データベースマイグレーションシステムが検出されませんでした。マイグレーションチェックをスキップします。"
  else
    echo "ℹ️  No database migration system detected. Skipping migration check."
  fi
fi

# Health check for staging/production services
if [ "$DEPLOY_ENV" != "development" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ デプロイ前ヘルスチェック実行中..."
  else
    echo "→ Performing pre-deployment health check..."
  fi

  # Check if staging/production API is accessible
  HEALTH_URL="${HEALTH_CHECK_URL:-https://api.example.com/health}"

  if command -v curl &> /dev/null; then
    if curl -f -s --max-time 10 "$HEALTH_URL" > /dev/null; then
      if [ "$LANG" = "ja" ]; then
        echo "✅ 現在のデプロイは正常です：$HEALTH_URL"
      else
        echo "✅ Current deployment is healthy: $HEALTH_URL"
      fi
    else
      if [ "$LANG" = "ja" ]; then
        echo "⚠️  警告：現在のデプロイのヘルスチェックが失敗しました"
        echo "   URL：$HEALTH_URL"
        echo "   続行しますか？ (y/N)"
      else
        echo "⚠️  Warning: Health check failed for current deployment"
        echo "   URL: $HEALTH_URL"
        echo "   Continue? (y/N)"
      fi
      read -r response
      if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  else
    if [ "$LANG" = "ja" ]; then
      echo "⚠️  curlが利用できません。ヘルスチェックをスキップします。"
    else
      echo "⚠️  curl not available. Skipping health check."
    fi
  fi
fi

# Build validation
if [ -f "package.json" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ 本番ビルドの検証中..."
  else
    echo "→ Validating production build..."
  fi

  npm run build || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ 本番ビルドが失敗しました。"
    else
      echo "❌ Production build failed."
    fi
    exit 1
  }

  if [ "$LANG" = "ja" ]; then
    echo "✅ 本番ビルドが成功しました"
  else
    echo "✅ Production build successful"
  fi
fi

# Container image security scan (if using Docker)
if [ -f "Dockerfile" ] && command -v trivy &> /dev/null; then
  if [ "$LANG" = "ja" ]; then
    echo "→ Dockerイメージの脆弱性スキャン中..."
  else
    echo "→ Scanning Docker image for vulnerabilities..."
  fi

  docker build -t pre-deploy-check:latest . > /dev/null
  trivy image --severity HIGH,CRITICAL --exit-code 1 pre-deploy-check:latest || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ Dockerイメージに重大な脆弱性が見つかりました。"
    else
      echo "❌ Critical vulnerabilities found in Docker image."
    fi
    exit 1
  }

  if [ "$LANG" = "ja" ]; then
    echo "✅ Dockerイメージセキュリティスキャンが通過しました"
  else
    echo "✅ Docker image security scan passed"
  fi
fi

# Voice notification (Iris announces security checks completion)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  "$VOICE_SCRIPT" "iris" "deployment validation" 2>/dev/null || true
fi

if [ "$LANG" = "ja" ]; then
  echo "✅ 全てのデプロイ前チェックが通過しました！$DEPLOY_ENV へのデプロイ準備完了"
else
  echo "✅ All pre-deployment checks passed! Ready to deploy to $DEPLOY_ENV"
fi

# Auto-commit deployment validation results (Iris)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "chore" \
    "to validate deployment security" \
    "Pass pre-deployment checks (env, migrations, health, build, security scan)" \
    "Iris" 2>/dev/null || true
fi
