# Shopify MCP 設定設計 - サマリー

**作成日**: 2025-11-03
**詳細レポート**: [shopify-mcp-flexible-configuration-design.md](./shopify-mcp-flexible-configuration-design.md)

---

## 📊 3つの Shopify MCP サーバー

| サーバー | 機能 | 必須環境変数 | 起動可能性 |
|---------|------|------------|----------|
| **Shopify Dev MCP** (NPX) | ドキュメント検索<br>GraphQL/Liquid検証 | なし | ✅ 常に起動可能 |
| **Shopify Theme Server** (Python) | テーマ管理<br>アセットCRUD | `SHOPIFY_ADMIN_TOKEN`<br>`SHOP_DOMAIN` | ❌ 両方必須 |
| **Shopify App Server** (Python) | 商品・注文・顧客管理<br>Webhook・GraphQL | `SHOPIFY_ADMIN_TOKEN`<br>`SHOP_DOMAIN` | ❌ 両方必須 |

---

## 🎯 設計原則

1. **Graceful Degradation**: 利用可能な機能のみを提供
2. **明示的なフィードバック**: 起動しないサーバーとその理由を明示
3. **Zero Configuration**: Dev MCP は常に利用可能

---

## 🛠️ 実装アプローチ (推奨)

### 1. 環境変数検証スクリプト

**新規ファイル**: `/mcp-servers/validate-shopify-env.sh`

```bash
# 戻り値: FULL, PARTIAL, NONE
bash mcp-servers/validate-shopify-env.sh
```

### 2. setup.sh の修正

**追加セクション**: Step 3.5 (Shopify 設定検証)

```bash
# 環境変数の状態を確認
SHOPIFY_STATUS=$(bash mcp-servers/validate-shopify-env.sh)

# ユーザーへのフィードバック
if [[ "$SHOPIFY_STATUS" == "FULL" ]]; then
    echo "✓ すべての Shopify サーバーが利用可能"
elif [[ "$SHOPIFY_STATUS" == "PARTIAL" ]]; then
    echo "⚠️  不完全な設定 - Dev MCP のみ利用可能"
else
    echo "ℹ️  未設定 - Dev MCP のみ利用可能"
fi
```

### 3. install.sh の修正

**テストセクション修正**: 条件付きテストを実装

```bash
test_server() {
    local server_name=$1
    local requires_env=$2

    if [[ "$requires_env" == "true" ]]; then
        if [[ -n "$SHOPIFY_ADMIN_TOKEN" && -n "$SHOP_DOMAIN" ]]; then
            echo "✅ $server_name: Ready"
        else
            echo "⚠️  $server_name: 認証情報が必要"
        fi
    else
        echo "✅ $server_name: Ready"
    fi
}
```

---

## 🧪 テスト計画

| ケース | TOKEN | DOMAIN | 期待結果 |
|-------|-------|--------|---------|
| TC-1 | ❌ | ❌ | Dev MCP のみ起動 |
| TC-2 | ✅ | ❌ | Dev MCP のみ起動 + 警告 |
| TC-3 | ❌ | ✅ | Dev MCP のみ起動 + 警告 |
| TC-4 | ✅ | ✅ | すべてのサーバー起動 |

---

## 📈 実装優先順位

### Phase 1: Immediate (今すぐ)
- [x] 環境変数検証スクリプト作成
- [x] setup.sh に検証セクション追加
- [x] ユーザーフィードバック改善
- [x] 設計ドキュメント作成

### Phase 2: Short-term (1-2週間)
- [ ] install.sh の条件付きテスト実装
- [ ] .env.example の詳細説明追加
- [ ] ドキュメント更新

### Phase 3: Long-term (将来)
- [ ] Python サーバーの Graceful Degradation
- [ ] 動的 MCP 設定生成
- [ ] 設定チェックコマンド追加

---

## 🔒 セキュリティ

### 推奨スコープ

**Theme Server**:
- `themes:read`, `themes:write`

**App Server**:
- `products:read`, `products:write`, `orders:read`, `customers:read`

**Dev MCP**:
- スコープ不要 (認証なし)

---

## 📝 修正ファイル一覧

### 新規作成
1. `/mcp-servers/validate-shopify-env.sh` - 環境変数検証スクリプト

### 修正
2. `/setup.sh` - Step 3.5 追加 (Shopify 設定検証)
3. `/mcp-servers/install.sh` - 条件付きテスト実装
4. `/.env.example` - Shopify セクションの詳細説明追加
5. `/docs/mcp-shopify-dev-setup.md` - サーバー比較表追加

---

## 💡 使用例

### ケース 1: ドキュメント参照のみ

```bash
# .env に Shopify 設定なし
# → Dev MCP のみ利用可能
# GraphQL スキーマ検索、Liquid 検証などが使用可能
```

### ケース 2: テーマ開発

```bash
# .env に設定
SHOPIFY_ADMIN_TOKEN=shpat_xxxxx
SHOP_DOMAIN=mystore

# → Dev MCP + Theme Server が利用可能
# テーマアセットの CRUD、テーマ公開、検証が可能
```

### ケース 3: アプリ開発

```bash
# .env に設定
SHOPIFY_ADMIN_TOKEN=shpat_xxxxx
SHOP_DOMAIN=mystore

# → Dev MCP + App Server が利用可能
# 商品・注文・顧客管理、Webhook 設定、GraphQL クエリが可能
```

### ケース 4: フルスタック開発

```bash
# .env に設定
SHOPIFY_ADMIN_TOKEN=shpat_xxxxx
SHOP_DOMAIN=mystore

# → すべてのサーバーが利用可能
# ドキュメント参照からテーマ・アプリ開発まで完全サポート
```

---

## ✅ 期待される効果

- ✅ **Dev MCP は常に利用可能** (ゼロコンフィグ)
- ✅ **認証が必要なサーバーは条件付き起動**
- ✅ **明確なユーザーフィードバック**
- ✅ **エラーなしのスムーズなセットアップ**
- ✅ **段階的な機能有効化**

---

## 🚀 次のステップ

1. Phase 1 の実装を確認・レビュー
2. Phase 2 の実装に着手
3. テスト計画に基づいた動作確認
4. ユーザーからのフィードバック収集

---

**詳細レポート**: [shopify-mcp-flexible-configuration-design.md](./shopify-mcp-flexible-configuration-design.md) を参照してください。
