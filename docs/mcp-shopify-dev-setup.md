# Shopify Dev MCP セットアップガイド

このガイドでは、Claude Code / Claude Desktop で Shopify Dev MCP サーバーを設定する手順を説明します。

## 概要

**Shopify Dev MCP** は、Shopify の開発ドキュメント、GraphQL スキーマ、Liquid テーマ検証などを AI アシスタントから直接利用できる Model Context Protocol (MCP) サーバーです。

### 提供機能

- **APIドキュメント検索**: Admin GraphQL API、Storefront API、Functions API のドキュメント検索
- **GraphQL スキーマイントロスペクション**: Shopify GraphQL スキーマの探索
- **GraphQL クエリ検証**: GraphQL コードブロックの構文検証
- **Liquid テーマ検証**: Liquid コードの検証とベストプラクティスチェック
- **Polaris コンポーネント検証**: Shopify Polaris Web コンポーネントのドキュメント

### 特徴

- **認証不要**: トークンや API キーは不要
- **NPX 経由で実行**: ローカルインストール不要
- **最新版を自動取得**: `@latest` タグで常に最新版を利用

## Shopify MCP Servers Comparison

Orchestra provides three Shopify MCP servers with different requirements:

| Server Name | Authentication Required | Primary Use Case | Available When |
|-------------|-------------------------|------------------|----------------|
| **Shopify Dev MCP** | No | Documentation search, GraphQL/Liquid validation | Always (via npx) |
| **Shopify Theme Server** | SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN | Theme management and development | When credentials set |
| **Shopify App Server** | SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN | App development (products, orders, customers) | When credentials set |

### How to Choose

1. **Documentation reference only**: Use Shopify Dev MCP (no authentication needed)
2. **Theme development**: Shopify Dev MCP + Shopify Theme Server
3. **App development**: Shopify Dev MCP + Shopify App Server
4. **Full-stack development**: All three servers

### Check Available Servers

To verify which servers are currently available in your setup:

```bash
cd /path/to/orchestra
bash mcp-servers/validate-shopify-env.sh
```

Output meanings:
- `FULL` - All servers available (credentials fully configured)
- `PARTIAL` - Dev MCP only (credentials incomplete)
- `NONE` - Dev MCP only (credentials not set)

---

## 前提条件

- **Node.js** と **npm** がインストール済み
- **Claude Desktop** がインストール済み
- **npx** コマンドが利用可能

確認コマンド：
```bash
npx --version
# 出力例: 11.4.2
```

---

## セットアップ手順

### 1. Claude Desktop の設定ファイルを開く

Claude Desktop の設定ファイルの場所：
```
/Users/<username>/Library/Application Support/Claude/claude_desktop_config.json
```

ターミナルから開く：
```bash
open "/Users/$USER/Library/Application Support/Claude/claude_desktop_config.json"
```

または、テキストエディタで開く：
```bash
vim "/Users/$USER/Library/Application Support/Claude/claude_desktop_config.json"
```

### 2. Shopify Dev MCP の設定を追加

設定ファイルに以下を追加します：

```json
{
  "mcpServers": {
    "shopify-dev": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"]
    }
  }
}
```

**既に他の MCP サーバーが設定されている場合**は、`mcpServers` オブジェクト内に追加します：

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "some-command"
    },
    "shopify-dev": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"]
    }
  }
}
```

### 3. Claude Desktop を再起動

設定を反映させるため、Claude Desktop を完全に終了して再起動します。

**macOS の場合**：
1. `Cmd + Q` で Claude Desktop を終了
2. Claude Desktop を再度起動

---

## 動作確認

### 1. コマンドラインでの動作確認

ターミナルで以下を実行してパッケージが正常に動作するか確認：

```bash
npx -y @shopify/dev-mcp@latest --help
```

**期待される出力**：
```
Shopify Dev MCP Server v1.4.1 running on stdio
```

### 2. Claude Desktop での動作確認

Claude Desktop を再起動後、以下のような質問をして動作を確認：

**テスト 1: API ドキュメント検索**
```
Shopify の Admin GraphQL API で顧客情報を取得する方法を教えてください。
```

**テスト 2: GraphQL スキーマ確認**
```
Shopify Admin GraphQL API の Product オブジェクトにはどんなフィールドがありますか？
```

**テスト 3: Liquid テーマ検証**
```
以下の Liquid コードは正しいですか？
{% for product in collection.products %}
  {{ product.title }}
{% endfor %}
```

Claude が Shopify Dev MCP サーバーからのツール（`learn_shopify_api`、`search_docs_chunks` など）を使用していれば、正常に動作しています。

---

## 利用可能なツール

Shopify Dev MCP サーバーは以下のツールを提供します：

### 1. `learn_shopify_api`
サポートされている Shopify API の一覧と概要を取得

### 2. `search_docs_chunks`
Shopify.dev ドキュメントを検索（キーワードベース）

### 3. `fetch_full_docs`
完全なドキュメントページを取得

### 4. `introspect_graphql_schema`
Shopify GraphQL スキーマを探索（型、フィールド、引数など）

### 5. `validate_graphql_codeblocks`
GraphQL コードブロックの構文を検証

### 6. `validate_theme`
Liquid コードを検証（構文チェック、ベストプラクティス）

---

## オプション設定

### インストルメンテーションをオプトアウト

Shopify Dev MCP はデフォルトで使用状況のテレメトリを送信します。これを無効化する場合：

```json
{
  "mcpServers": {
    "shopify-dev": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"],
      "env": {
        "OPT_OUT_INSTRUMENTATION": "true"
      }
    }
  }
}
```

---

## トラブルシューティング

### 問題 1: MCP サーバーが起動しない

**原因**: npx が正しく動作していない

**解決策**:
```bash
# npx のバージョン確認
npx --version

# Node.js を最新版に更新
brew upgrade node
```

### 問題 2: パッケージが見つからない

**原因**: パッケージ名が間違っている

**解決策**: 正しいパッケージ名 `@shopify/dev-mcp` を使用していることを確認
```json
"args": ["-y", "@shopify/dev-mcp@latest"]
```

❌ 間違い: `"args": ["@shopify/mcp"]`
✅ 正しい: `"args": ["-y", "@shopify/dev-mcp@latest"]`

### 問題 3: Claude Desktop で MCP ツールが表示されない

**原因**: 設定ファイルの JSON 構文エラー、または Claude Desktop が再起動されていない

**解決策**:
1. JSON 構文を確認（カンマ、括弧のバランスなど）
2. Claude Desktop を完全に終了して再起動
3. 設定ファイルのパスが正しいか確認

### 問題 4: 古いバージョンが実行されている

**原因**: npx のキャッシュ

**解決策**:
```bash
# npx キャッシュをクリア
npx clear-npx-cache

# または、特定のパッケージを削除
rm -rf ~/.npm/_npx/@shopify/dev-mcp
```

---

## 設定例（複数の MCP サーバー）

Orchestra プロジェクトで使用している完全な設定例：

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    },
    "shopify-dev": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"]
    },
    "shopify-theme": {
      "command": "python3",
      "args": ["/Users/username/path/to/shopify-server.py"],
      "env": {
        "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
        "SHOP_DOMAIN": "${SHOP_DOMAIN}"
      }
    },
    "shopify-app": {
      "command": "python3",
      "args": ["/Users/username/path/to/shopify-app-server.py"],
      "env": {
        "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
        "SHOP_DOMAIN": "${SHOP_DOMAIN}"
      }
    }
  }
}
```

---

## プロジェクトへの統合（オプション）

Orchestra プロジェクトで MCP サーバーを管理する場合、`package.json` にスクリプトを追加できます：

```json
{
  "scripts": {
    "mcp:shopify-dev": "npx -y @shopify/dev-mcp@latest",
    "mcp:test": "npm run mcp:shopify-dev -- --help"
  }
}
```

実行：
```bash
npm run mcp:test
```

---

## 参考リンク

- **公式ドキュメント**: https://shopify.dev/docs/apps/build/devmcp
- **npm パッケージ**: https://www.npmjs.com/package/@shopify/dev-mcp
- **GitHub リポジトリ**: https://github.com/Shopify/dev-mcp
- **Model Context Protocol (MCP)**: https://modelcontextprotocol.io/

---

## まとめ

以上で Shopify Dev MCP のセットアップが完了しました。Claude Code / Claude Desktop から Shopify の開発ドキュメントや GraphQL スキーマに直接アクセスできるようになりました。

**次のステップ**:
- Shopify アプリ開発で GraphQL クエリを検証
- Liquid テーマのコード品質をチェック
- Admin API や Storefront API のドキュメントを Claude に質問

Happy coding!
