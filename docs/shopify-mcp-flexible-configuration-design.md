# Shopify MCP サーバー柔軟な設定設計レポート

**作成日**: 2025-11-03
**担当**: Mina (API Integration Specialist)
**プロジェクト**: Orchestra Plugin

---

## 📋 Executive Summary

Orchestra には 3 つの Shopify MCP サーバーがあり、それぞれ異なる環境変数要件を持っています。現在の実装では、必須環境変数がない場合に起動に失敗し、利用可能なサーバーも使用できなくなっています。

この設計レポートでは、各サーバーの要件を分析し、環境変数の有無に応じて利用可能なサーバーのみを起動する柔軟な設定戦略を提案します。

---

## 🔍 1. 各 Shopify MCP サーバーの詳細仕様

### 1.1 Shopify Dev MCP (`@shopify/dev-mcp`)

**パス**: NPX パッケージ (外部)
**ドキュメント**: `/Users/tstomtimes/Documents/GitHub/orchestra/docs/mcp-shopify-dev-setup.md`

#### 機能
- Shopify API ドキュメント検索 (Admin GraphQL, Storefront, Functions API)
- GraphQL スキーマイントロスペクション
- GraphQL クエリ構文検証
- Liquid テーマ検証
- Polaris コンポーネントドキュメント

#### 環境変数要件
- **必須**: なし
- **オプション**: `OPT_OUT_INSTRUMENTATION` (テレメトリオプトアウト)

#### 起動可能性
- ✅ **常に起動可能** (認証不要)
- Node.js と npm/npx が必要

#### 起動コマンド
```json
{
  "command": "npx",
  "args": ["-y", "@shopify/dev-mcp@latest"]
}
```

---

### 1.2 Shopify Theme Server (`shopify-server.py`)

**パス**: `/Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers/shopify-server.py`

#### 機能
テーマ開発と管理:
- テーマ一覧取得・詳細取得
- テーマアセット管理 (取得・更新・削除)
- テーマの公開・複製
- テーマ構造の検証
- ショップ情報の取得

#### 環境変数要件
- **必須**:
  - `SHOPIFY_ADMIN_TOKEN` - Shopify Admin API アクセストークン
  - `SHOP_DOMAIN` - Shopify ストアドメイン (例: mystore)
- **オプション**: なし

#### 起動可能性
```python
# Line 19-25: 必須環境変数チェック
self.token = os.getenv("SHOPIFY_ADMIN_TOKEN")
self.shop_domain = os.getenv("SHOP_DOMAIN")

if not self.token:
    raise ValueError("SHOPIFY_ADMIN_TOKEN environment variable is required")
if not self.shop_domain:
    raise ValueError("SHOP_DOMAIN environment variable is required")
```
- ❌ **両方の環境変数が必須** - 片方でも欠けている場合は起動失敗
- Python 3.8+ と `requests` ライブラリが必要

#### 起動コマンド
```json
{
  "command": "python3",
  "args": ["/path/to/shopify-server.py"],
  "env": {
    "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
    "SHOP_DOMAIN": "${SHOP_DOMAIN}"
  }
}
```

---

### 1.3 Shopify App Server (`shopify-app-server.py`)

**パス**: `/Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers/shopify-app-server.py`

#### 機能
Shopify アプリ開発:
- 商品管理 (取得・作成・更新)
- 注文管理 (取得・詳細)
- 顧客管理 (取得・詳細)
- 在庫管理 (在庫レベル取得・更新)
- コレクション管理 (取得)
- Webhook 管理 (取得・作成・削除)
- GraphQL クエリ実行
- ショップメタフィールド取得
- アプリインストール情報取得
- ショップ分析 (売上・注文統計)

#### 環境変数要件
- **必須**:
  - `SHOPIFY_ADMIN_TOKEN` - Shopify Admin API アクセストークン
  - `SHOP_DOMAIN` - Shopify ストアドメイン (例: mystore)
- **オプション**: なし

#### 起動可能性
```python
# Line 20-26: 必須環境変数チェック
self.token = os.getenv("SHOPIFY_ADMIN_TOKEN")
self.shop_domain = os.getenv("SHOP_DOMAIN")

if not self.token:
    raise ValueError("SHOPIFY_ADMIN_TOKEN environment variable is required")
if not self.shop_domain:
    raise ValueError("SHOP_DOMAIN environment variable is required")
```
- ❌ **両方の環境変数が必須** - 片方でも欠けている場合は起動失敗
- Python 3.8+ と `requests` ライブラリが必要

#### 起動コマンド
```json
{
  "command": "python3",
  "args": ["/path/to/shopify-app-server.py"],
  "env": {
    "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
    "SHOP_DOMAIN": "${SHOP_DOMAIN}"
  }
}
```

---

## 📊 2. サーバー起動可能性マトリックス

| 環境変数の状態 | Shopify Dev MCP | Shopify Theme Server | Shopify App Server |
|---------------|-----------------|----------------------|--------------------|
| 環境変数なし | ✅ 起動可能 | ❌ 起動不可 | ❌ 起動不可 |
| SHOPIFY_ADMIN_TOKEN のみ | ✅ 起動可能 | ❌ 起動不可 | ❌ 起動不可 |
| SHOP_DOMAIN のみ | ✅ 起動可能 | ❌ 起動不可 | ❌ 起動不可 |
| 両方あり | ✅ 起動可能 | ✅ 起動可能 | ✅ 起動可能 |

---

## 🎯 3. 推奨される設定戦略

### 3.1 条件付き MCP サーバー起動

**設計原則**:
1. **Graceful Degradation**: 利用可能な機能のみを提供
2. **明示的なエラーメッセージ**: 起動しないサーバーとその理由をユーザーに通知
3. **Zero Configuration for Dev MCP**: 開発ドキュメント参照は常に利用可能

### 3.2 実装アプローチ

#### Option A: Dynamic MCP Configuration Generation (推奨)

`setup.sh` で `.claude.json` の `mcpServers` セクションを動的に生成:

```bash
# setup.sh の新しいセクション
generate_mcp_config() {
    local config_file="$PROJECT_ROOT/.claude.json"
    local mcp_servers='[]'

    # Always add Shopify Dev MCP (no auth required)
    mcp_servers=$(echo "$mcp_servers" | jq '. += [{
        "name": "shopify-dev",
        "command": "npx",
        "args": ["-y", "@shopify/dev-mcp@latest"]
    }]')

    # Check if Shopify credentials are available
    if [[ -n "$SHOPIFY_ADMIN_TOKEN" && -n "$SHOP_DOMAIN" ]]; then
        echo -e "${GREEN}✓ Shopify credentials found - enabling Theme and App servers${NC}"

        # Add Shopify Theme Server
        mcp_servers=$(echo "$mcp_servers" | jq --arg path "$PROJECT_ROOT/mcp-servers/shopify-server.py" '. += [{
            "name": "shopify-theme",
            "command": "python3",
            "args": [$path],
            "env": {
                "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
                "SHOP_DOMAIN": "${SHOP_DOMAIN}"
            }
        }]')

        # Add Shopify App Server
        mcp_servers=$(echo "$mcp_servers" | jq --arg path "$PROJECT_ROOT/mcp-servers/shopify-app-server.py" '. += [{
            "name": "shopify-app",
            "command": "python3",
            "args": [$path],
            "env": {
                "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
                "SHOP_DOMAIN": "${SHOP_DOMAIN}"
            }
        }]')
    else
        echo -e "${YELLOW}⚠️  Shopify credentials not found - only Dev MCP will be available${NC}"
        echo -e "${BLUE}   To enable Theme/App servers, add to .env:${NC}"
        echo -e "${BLUE}   - SHOPIFY_ADMIN_TOKEN=${NC}"
        echo -e "${BLUE}   - SHOP_DOMAIN=${NC}"
    fi

    # Update .claude.json with generated MCP config
    jq --argjson servers "$mcp_servers" '.mcpServers = $servers' "$config_file" > "$config_file.tmp"
    mv "$config_file.tmp" "$config_file"
}
```

**メリット**:
- ✅ 環境に応じて最適な設定を自動生成
- ✅ ユーザーへの明確なフィードバック
- ✅ エラーなし (起動できないサーバーは設定に含めない)

**デメリット**:
- ❌ `.claude.json` の動的生成が必要
- ❌ 環境変数変更時に setup.sh を再実行する必要がある

---

#### Option B: Environment Variable Validation in Python Servers

Python サーバーを修正して、環境変数がない場合にエラーではなく警告を出し、限定的な機能で起動:

```python
class ShopifyMCPServer:
    def __init__(self):
        self.token = os.getenv("SHOPIFY_ADMIN_TOKEN")
        self.shop_domain = os.getenv("SHOP_DOMAIN")
        self.is_configured = bool(self.token and self.shop_domain)

        if not self.is_configured:
            # ログに警告を出すが、起動は継続
            print(json.dumps({
                "warning": "SHOPIFY_ADMIN_TOKEN or SHOP_DOMAIN not configured",
                "message": "Server will run with limited functionality",
                "available_commands": ["help", "config_check"]
            }), file=sys.stderr)

    def _require_auth(self):
        """デコレーターまたはチェック関数として使用"""
        if not self.is_configured:
            return {
                "success": False,
                "error": "This command requires SHOPIFY_ADMIN_TOKEN and SHOP_DOMAIN to be configured",
                "help": "Please set environment variables and restart the server"
            }
        return None
```

**メリット**:
- ✅ 設定ファイルの変更不要
- ✅ サーバーは常に起動可能
- ✅ 設定チェックコマンドでデバッグ可能

**デメリット**:
- ❌ Python サーバーコードの大幅な修正が必要
- ❌ 未設定状態でのエラーメッセージが各コマンドで発生
- ❌ Claude Code がエラーを頻繁に表示する可能性

---

#### Option C: Pre-Flight Validation Script (最もシンプル)

`setup.sh` と別に、Claude Desktop 起動前に環境変数をチェックする軽量スクリプト:

```bash
#!/usr/bin/env bash
# mcp-servers/validate-shopify-env.sh

check_shopify_env() {
    local has_token=false
    local has_domain=false

    # Load .env if it exists
    if [ -f ".env" ]; then
        source .env
    fi

    [[ -n "$SHOPIFY_ADMIN_TOKEN" ]] && has_token=true
    [[ -n "$SHOP_DOMAIN" ]] && has_domain=true

    if [[ "$has_token" == true && "$has_domain" == true ]]; then
        echo "SHOPIFY_FULL"
    elif [[ "$has_token" == true || "$has_domain" == true ]]; then
        echo "SHOPIFY_PARTIAL"
    else
        echo "SHOPIFY_NONE"
    fi
}

check_shopify_env
```

**使用方法**:
```bash
# setup.sh 内で実行
SHOPIFY_STATUS=$(bash mcp-servers/validate-shopify-env.sh)

if [[ "$SHOPIFY_STATUS" == "SHOPIFY_FULL" ]]; then
    echo "✓ All Shopify MCP servers will be available"
elif [[ "$SHOPIFY_STATUS" == "SHOPIFY_PARTIAL" ]]; then
    echo "⚠️  Incomplete Shopify configuration - only Dev MCP available"
elif [[ "$SHOPIFY_STATUS" == "SHOPIFY_NONE" ]]; then
    echo "ℹ️  No Shopify credentials - only Dev MCP (docs/validation) available"
fi
```

**メリット**:
- ✅ シンプルで理解しやすい
- ✅ 既存コードの変更が最小限
- ✅ ユーザーへのフィードバックが明確

**デメリット**:
- ❌ 環境変数不足時にサーバーが起動失敗する問題は解決しない

---

### 3.3 推奨実装: Hybrid Approach (Option A + C)

**ステップ 1**: Pre-flight validation で環境変数を確認
**ステップ 2**: Dynamic configuration generation で利用可能なサーバーのみ設定
**ステップ 3**: ユーザーに明確なフィードバックを提供

---

## 🛠️ 4. 修正ファイル一覧と具体的な変更内容

### 4.1 新規作成ファイル

#### `/Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers/validate-shopify-env.sh`

```bash
#!/usr/bin/env bash
# Shopify Environment Variable Validation Script
# Returns: FULL, PARTIAL, or NONE

set -euo pipefail

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load .env if exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    # Export variables from .env
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Check environment variables
has_token=false
has_domain=false

[[ -n "${SHOPIFY_ADMIN_TOKEN:-}" ]] && has_token=true
[[ -n "${SHOP_DOMAIN:-}" ]] && has_domain=true

# Return status
if [[ "$has_token" == true && "$has_domain" == true ]]; then
    echo "FULL"
elif [[ "$has_token" == true || "$has_domain" == true ]]; then
    echo "PARTIAL"
else
    echo "NONE"
fi
```

---

### 4.2 修正ファイル

#### `/Users/tstomtimes/Documents/GitHub/orchestra/setup.sh`

**修正箇所**: Step 3 (MCP server dependencies installation) の後に新しいセクションを追加

```bash
# Step 3.5: Validate Shopify configuration
echo -e "${YELLOW}[3.5/7] Validating Shopify MCP configuration...${NC}"

cd "$PROJECT_ROOT"

# Load .env for validation
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Check Shopify environment variables
SHOPIFY_STATUS="NONE"
if [[ -n "${SHOPIFY_ADMIN_TOKEN:-}" && -n "${SHOP_DOMAIN:-}" ]]; then
    SHOPIFY_STATUS="FULL"
    echo -e "${GREEN}✓ Shopify credentials configured (SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN)${NC}"
    echo -e "${BLUE}  Available servers:${NC}"
    echo -e "${BLUE}    - Shopify Dev MCP (docs, GraphQL validation, Liquid validation)${NC}"
    echo -e "${BLUE}    - Shopify Theme Server (theme management)${NC}"
    echo -e "${BLUE}    - Shopify App Server (products, orders, webhooks, GraphQL)${NC}"
elif [[ -n "${SHOPIFY_ADMIN_TOKEN:-}" || -n "${SHOP_DOMAIN:-}" ]]; then
    SHOPIFY_STATUS="PARTIAL"
    echo -e "${YELLOW}⚠️  Incomplete Shopify configuration${NC}"
    [[ -z "${SHOPIFY_ADMIN_TOKEN:-}" ]] && echo -e "${YELLOW}   Missing: SHOPIFY_ADMIN_TOKEN${NC}"
    [[ -z "${SHOP_DOMAIN:-}" ]] && echo -e "${YELLOW}   Missing: SHOP_DOMAIN${NC}"
    echo -e "${BLUE}  Available servers:${NC}"
    echo -e "${BLUE}    - Shopify Dev MCP only (docs, validation - no auth required)${NC}"
else
    SHOPIFY_STATUS="NONE"
    echo -e "${BLUE}ℹ️  No Shopify credentials configured${NC}"
    echo -e "${BLUE}  Available servers:${NC}"
    echo -e "${BLUE}    - Shopify Dev MCP only (docs, validation - no auth required)${NC}"
    echo -e "${YELLOW}  To enable Theme/App servers, add to .env:${NC}"
    echo -e "${YELLOW}    SHOPIFY_ADMIN_TOKEN=your_token${NC}"
    echo -e "${YELLOW}    SHOP_DOMAIN=your-store${NC}"
fi

echo ""
```

---

#### `/Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers/install.sh`

**修正箇所**: テストセクション (Line 79-103) を条件付きテストに変更

```bash
# Test MCP servers with environment validation
echo ""
echo "🧪 Testing MCP servers..."

test_server() {
    local server_name=$1
    local server_script=$2
    local requires_env=$3

    if [ -f "$SCRIPT_DIR/$server_script" ]; then
        if [[ "$requires_env" == "true" ]]; then
            # Check if required environment variables are set
            if [[ -n "${SHOPIFY_ADMIN_TOKEN:-}" && -n "${SHOP_DOMAIN:-}" ]]; then
                echo "  ✅ $server_name: Ready (credentials configured)"
            else
                echo "  ⚠️  $server_name: Available but needs credentials"
                echo "     Missing: SHOPIFY_ADMIN_TOKEN and/or SHOP_DOMAIN"
            fi
        else
            # No environment variables required
            echo "  ✅ $server_name: Ready"
        fi
    else
        echo "  ❌ $server_name: Script not found"
    fi
}

# Load .env for validation
if [ -f "$SCRIPT_DIR/../.env" ]; then
    set -a
    source "$SCRIPT_DIR/../.env"
    set +a
fi

test_server "GitHub MCP Server" "github-server.py" "false"
test_server "Shopify Theme MCP Server" "shopify-server.py" "true"
test_server "Shopify App MCP Server" "shopify-app-server.py" "true"
test_server "Vercel MCP Server" "vercel-server.py" "false"
test_server "Slack MCP Server" "slack-server.py" "false"
test_server "ElevenLabs TTS MCP Server" "elevenlabs-server.py" "false"

echo ""
echo "ℹ️  Shopify Dev MCP (@shopify/dev-mcp) is always available via npx"
echo "   No credentials required for documentation and validation features"
```

---

#### `/Users/tstomtimes/Documents/GitHub/orchestra/.env.example`

**修正箇所**: Shopify セクション (Line 14-18) を拡張してより詳しい説明を追加

```bash
# Shopify (Optional)
# Three MCP servers available with different requirements:
#
# 1. Shopify Dev MCP (@shopify/dev-mcp)
#    - Always available via npx (no credentials needed)
#    - Features: API docs, GraphQL validation, Liquid validation
#    - No configuration required
#
# 2. Shopify Theme Server (shopify-server.py)
#    - Requires: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN
#    - Features: Theme management, asset CRUD, theme validation
#    - Scopes needed: themes:read, themes:write
#
# 3. Shopify App Server (shopify-app-server.py)
#    - Requires: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN
#    - Features: Products, orders, customers, inventory, webhooks, GraphQL queries
#    - Scopes needed: products:read, products:write, orders:read, customers:read, etc.
#
# To enable Theme and App servers, set both variables below:
SHOPIFY_ADMIN_TOKEN=your_shopify_admin_token_here
SHOP_DOMAIN=your-store-name

# Note: SHOP_DOMAIN should be the store name only, not the full URL
# Example: If your store is https://mystore.myshopify.com, use: SHOP_DOMAIN=mystore
```

---

#### `/Users/tstomtimes/Documents/GitHub/orchestra/docs/mcp-shopify-dev-setup.md`

**追加セクション**: サーバー比較表を追加

```markdown
## Shopify MCP サーバー比較

Orchestra では 3 つの Shopify MCP サーバーを提供しています:

| サーバー名 | 認証要件 | 主な用途 | 利用可能条件 |
|-----------|---------|---------|------------|
| **Shopify Dev MCP** | なし | ドキュメント検索、GraphQL/Liquid 検証 | 常に利用可能 (npx 経由) |
| **Shopify Theme Server** | SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN | テーマ管理・開発 | 環境変数設定時のみ |
| **Shopify App Server** | SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN | アプリ開発 (商品・注文・顧客管理) | 環境変数設定時のみ |

### 推奨される使い方

1. **開発ドキュメント参照のみ**: Shopify Dev MCP を使用 (認証不要)
2. **テーマ開発**: Shopify Dev MCP + Shopify Theme Server
3. **アプリ開発**: Shopify Dev MCP + Shopify App Server
4. **フルスタック開発**: 3 つすべてを使用

### 設定確認

現在どのサーバーが利用可能か確認するには:

```bash
cd /path/to/orchestra
bash mcp-servers/validate-shopify-env.sh
```

出力:
- `FULL` - すべてのサーバーが利用可能
- `PARTIAL` - Dev MCP のみ利用可能 (credentials 不完全)
- `NONE` - Dev MCP のみ利用可能 (credentials 未設定)
```

---

## 🧪 5. テスト計画

### 5.1 環境変数テストケース

| テストケース | SHOPIFY_ADMIN_TOKEN | SHOP_DOMAIN | 期待される動作 |
|------------|---------------------|-------------|---------------|
| TC-1 | ❌ なし | ❌ なし | Dev MCP のみ起動可能 |
| TC-2 | ✅ あり | ❌ なし | Dev MCP のみ起動可能 + 警告表示 |
| TC-3 | ❌ なし | ✅ あり | Dev MCP のみ起動可能 + 警告表示 |
| TC-4 | ✅ あり | ✅ あり | すべてのサーバー起動可能 |

### 5.2 テスト手順

#### Test 1: 環境変数なし

```bash
# .env から Shopify 設定を削除
cd /Users/tstomtimes/Documents/GitHub/orchestra
cp .env .env.backup
sed -i '' '/SHOPIFY/d' .env

# setup.sh を実行
bash setup.sh

# 期待される出力
# ℹ️  No Shopify credentials configured
# Available servers:
#   - Shopify Dev MCP only (docs, validation - no auth required)

# Shopify Dev MCP が起動するか確認
npx -y @shopify/dev-mcp@latest --help
# 期待: 正常に起動してヘルプメッセージを表示
```

#### Test 2: 部分的な設定 (TOKEN のみ)

```bash
# .env に TOKEN のみ追加
echo "SHOPIFY_ADMIN_TOKEN=test_token" >> .env

# setup.sh を実行
bash setup.sh

# 期待される出力
# ⚠️  Incomplete Shopify configuration
# Missing: SHOP_DOMAIN
# Available servers:
#   - Shopify Dev MCP only
```

#### Test 3: 完全な設定

```bash
# .env に両方追加
echo "SHOPIFY_ADMIN_TOKEN=shpat_xxxxx" >> .env
echo "SHOP_DOMAIN=mystore" >> .env

# setup.sh を実行
bash setup.sh

# 期待される出力
# ✓ Shopify credentials configured (SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN)
# Available servers:
#   - Shopify Dev MCP (docs, GraphQL validation, Liquid validation)
#   - Shopify Theme Server (theme management)
#   - Shopify App Server (products, orders, webhooks, GraphQL)
```

#### Test 4: サーバー起動テスト

```bash
# Shopify Theme Server を手動起動
cd /Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers
source venv/bin/activate

# 環境変数を設定
export SHOPIFY_ADMIN_TOKEN="shpat_xxxxx"
export SHOP_DOMAIN="mystore"

# サーバーに test コマンドを送信
echo '{"command":"get_shop_info","params":{}}' | python3 shopify-server.py

# 期待: JSON レスポンスまたは認証エラー (本物の credentials でない場合)
```

#### Test 5: Claude Desktop 統合テスト

```bash
# Claude Desktop の設定ファイルを確認
cat "/Users/$USER/Library/Application Support/Claude/claude_desktop_config.json"

# 期待: Shopify Dev MCP エントリが存在
# 期待 (環境変数あり): Shopify Theme/App Server エントリも存在
# 期待 (環境変数なし): Shopify Dev MCP のみ
```

---

## 📈 6. 実装優先順位

### Phase 1: Immediate (緊急度: 高)
1. ✅ **環境変数検証スクリプト作成** (`validate-shopify-env.sh`)
2. ✅ **setup.sh に検証セクション追加**
3. ✅ **ユーザーへのフィードバック改善**

### Phase 2: Short-term (1-2 週間)
4. ⏳ **install.sh の条件付きテスト実装**
5. ⏳ **.env.example の詳細説明追加**
6. ⏳ **ドキュメント更新 (mcp-shopify-dev-setup.md)**

### Phase 3: Long-term (将来的な改善)
7. 🔮 **Python サーバーの Graceful Degradation 実装**
8. 🔮 **動的 MCP 設定生成 (Option A) の実装**
9. 🔮 **設定チェック用の専用コマンド追加** (`/shopify-status`)

---

## 🔒 7. セキュリティ考慮事項

### 7.1 環境変数の取り扱い

✅ **Good Practices**:
- 環境変数は `.env` ファイルに保存 (`.gitignore` に含まれている)
- `.env.example` にはダミー値のみ
- setup.sh は `.env` の内容をログに出力しない

⚠️ **Warnings**:
- 検証スクリプトは環境変数の存在のみをチェック (値は検証しない)
- 無効なトークンでもサーバーは起動するが、API リクエスト時に失敗

### 7.2 Least Privilege

各サーバーの推奨スコープ:

**Shopify Theme Server**:
- `themes:read`
- `themes:write`
- `assets:read`
- `assets:write`

**Shopify App Server**:
- `products:read`
- `products:write`
- `orders:read`
- `customers:read`
- `inventory:read`
- `inventory:write`

**Shopify Dev MCP**:
- スコープ不要 (認証なし)

---

## 📚 8. 参考リンク

- **Shopify Admin API**: https://shopify.dev/docs/api/admin-rest
- **Shopify GraphQL API**: https://shopify.dev/docs/api/admin-graphql
- **@shopify/dev-mcp**: https://www.npmjs.com/package/@shopify/dev-mcp
- **Orchestra Plugin Setup**: `/Users/tstomtimes/Documents/GitHub/orchestra/setup.sh`
- **Environment Variables**: `/Users/tstomtimes/Documents/GitHub/orchestra/.env.example`

---

## ✅ 9. まとめ

### 現在の問題
- 環境変数がない場合に Python MCP サーバーが起動失敗
- ユーザーが利用可能なサーバーを事前に知ることができない
- セットアップ時のエラーメッセージが不親切

### 提案される解決策
- **環境変数検証スクリプト** で事前チェック
- **setup.sh でのフィードバック改善** で利用可能なサーバーを明示
- **条件付きテスト** で正確な状態を報告
- **ドキュメント拡充** でサーバー比較と推奨使用方法を提供

### 期待される効果
- ✅ Dev MCP は常に利用可能 (ゼロコンフィグ)
- ✅ 認証が必要なサーバーは環境変数がある場合のみ起動
- ✅ ユーザーへの明確なフィードバック
- ✅ エラーなしのスムーズなセットアップ体験

---

**次のアクション**: Phase 1 の実装を開始しますか?
