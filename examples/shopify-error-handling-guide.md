# Shopify Admin API - エラーハンドリングガイド

## 一般的なエラーと対処法

### 1. レート制限 (429 Too Many Requests)

**症状:**
```json
{
  "errors": "Exceeded 2 calls per second for api client. Reduce request rates to resume uninterrupted service."
}
```

**対処法:**
- **指数バックオフ**: 1秒 → 2秒 → 4秒と待機時間を増やす
- **リクエスト間隔を空ける**: 500ms〜1秒の待機時間を追加
- **バッチ処理**: 複数の操作を1つのGraphQLクエリにまとめる
- **コストベースのレート制限を監視**: `extensions.cost.throttleStatus` をチェック

**実装例:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 429エラーの場合のみリトライ
      if (error instanceof ShopifyAPIError && error.statusCode === 429) {
        const delay = 1000 * Math.pow(2, i); // 指数バックオフ
        console.warn(`Rate limited. Waiting ${delay}ms before retry ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // その他のエラーは即座にスロー
      throw error;
    }
  }

  throw lastError!;
}
```

### 2. 認証エラー (401 Unauthorized)

**症状:**
```json
{
  "errors": "Invalid API key or access token"
}
```

**原因:**
- アクセストークンが無効または期限切れ
- トークンに必要なスコープが不足
- ストアドメインが間違っている

**対処法:**
1. アクセストークンを再生成
2. 必要なスコープが付与されているか確認
3. 環境変数が正しく設定されているか確認

```bash
# トークンの検証
curl -X POST "https://YOUR_STORE.myshopify.com/admin/api/2024-01/graphql.json" \
  -H "X-Shopify-Access-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ shop { name } }"}'
```

### 3. GraphQLエラー

**症状:**
```json
{
  "errors": [
    {
      "message": "Field 'productss' doesn't exist on type 'QueryRoot'",
      "locations": [{"line": 1, "column": 9}],
      "path": ["query", "productss"],
      "extensions": {
        "code": "undefinedField",
        "typeName": "QueryRoot",
        "fieldName": "productss"
      }
    }
  ]
}
```

**対処法:**
- クエリ構文を確認
- フィールド名のタイプミスをチェック
- APIバージョンでサポートされているか確認
- [Shopify GraphiQL Explorer](https://shopify.dev/docs/apps/tools/graphiql-admin-api)でクエリをテスト

### 4. ネットワークエラー

**症状:**
- `ECONNREFUSED`
- `ETIMEDOUT`
- `ENOTFOUND`

**対処法:**
```typescript
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
```

### 5. ページネーションエラー

**症状:**
- カーソルが無効
- `first`引数が大きすぎる（最大250）

**対処法:**
```typescript
async function getAllProductsSafely(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;
  const pageSize = 50; // 安全なページサイズ

  while (hasNextPage) {
    try {
      const result = await client.getProducts({
        first: pageSize,
        after: cursor,
      });

      allProducts.push(...result.products);
      hasNextPage = result.pageInfo.hasNextPage;
      cursor = result.pageInfo.endCursor || undefined;

      // レート制限対策
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error fetching page (cursor: ${cursor}):`, error);
      throw error;
    }
  }

  return allProducts;
}
```

## コストベースのレート制限

Shopify GraphQL APIはクエリの複雑さに基づいてコストを計算します。

### コスト情報の取得

```graphql
query {
  products(first: 50) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

**レスポンスの `extensions` を確認:**
```json
{
  "data": { ... },
  "extensions": {
    "cost": {
      "requestedQueryCost": 52,
      "actualQueryCost": 52,
      "throttleStatus": {
        "maximumAvailable": 1000,
        "currentlyAvailable": 948,
        "restoreRate": 50
      }
    }
  }
}
```

### コスト監視の実装

```typescript
interface QueryCost {
  requestedQueryCost: number;
  actualQueryCost: number;
  throttleStatus: {
    maximumAvailable: number;
    currentlyAvailable: number;
    restoreRate: number;
  };
}

function shouldThrottle(cost: QueryCost): boolean {
  const { currentlyAvailable, maximumAvailable } = cost.throttleStatus;
  const availablePercent = (currentlyAvailable / maximumAvailable) * 100;

  // 利用可能コストが20%未満の場合、スロットリング
  return availablePercent < 20;
}

async function executeWithCostAwareness(query: string): Promise<any> {
  const result = await client.executeQuery(query);

  if (result.extensions?.cost) {
    const cost = result.extensions.cost as QueryCost;

    if (shouldThrottle(cost)) {
      const { currentlyAvailable, restoreRate } = cost.throttleStatus;
      const waitTime = Math.ceil((100 - currentlyAvailable) / restoreRate) * 1000;

      console.warn(`Low cost budget. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return result;
}
```

## ベストプラクティスチェックリスト

### セキュリティ
- [ ] アクセストークンを環境変数で管理
- [ ] `.env`ファイルを`.gitignore`に追加
- [ ] 最小限のスコープのみ付与（read_products のみ等）
- [ ] 本番環境ではシークレット管理サービスを使用
- [ ] アクセストークンを定期的にローテーション

### パフォーマンス
- [ ] ページサイズは50〜100程度に設定
- [ ] 不要なフィールドをクエリに含めない
- [ ] ネストされたリレーションに`first`制限を設定
- [ ] コストベースのレート制限を監視
- [ ] リクエスト間に適切な待機時間を設定

### エラーハンドリング
- [ ] すべてのAPI呼び出しをtry-catchで囲む
- [ ] レート制限エラーに対する指数バックオフを実装
- [ ] ネットワークエラーに対するタイムアウトを設定
- [ ] GraphQLエラーを適切にログ記録
- [ ] ユーザーに分かりやすいエラーメッセージを表示

### ロギング
- [ ] 成功したリクエストを記録（info レベル）
- [ ] エラーを詳細に記録（error レベル）
- [ ] レート制限警告を記録（warn レベル）
- [ ] リクエストIDやカーソルを含める
- [ ] 機密情報（トークン等）をログから除外

### テスト
- [ ] 単体テストでAPI呼び出しをモック
- [ ] 統合テストで実際のShopify APIを使用（開発ストア）
- [ ] レート制限シナリオをテスト
- [ ] ページネーションの境界条件をテスト
- [ ] エラーハンドリングパスをテスト

## トラブルシューティング

### デバッグモードの有効化

```typescript
class ShopifyProductsClient {
  private debug = process.env.SHOPIFY_DEBUG === 'true';

  private async executeQuery<T>(query: string, variables?: any): Promise<T> {
    if (this.debug) {
      console.log('=== GraphQL Request ===');
      console.log('Query:', query);
      console.log('Variables:', JSON.stringify(variables, null, 2));
    }

    const result = await fetch(/* ... */);

    if (this.debug) {
      console.log('=== GraphQL Response ===');
      console.log('Status:', result.status);
      console.log('Body:', await result.text());
    }

    return result;
  }
}
```

### GraphiQL Explorerの使用

開発中は [Shopify GraphiQL Explorer](https://shopify.dev/docs/apps/tools/graphiql-admin-api) を使用してクエリをテストしてください:

1. ストアの管理画面にログイン
2. アプリ設定からGraphiQL Explorerを開く
3. クエリをテストして構文を確認
4. ドキュメントで利用可能なフィールドを確認

### よくある質問

**Q: `first`の最大値は?**
A: 250です。それ以上を指定するとエラーになります。

**Q: カーソルの有効期限は?**
A: 通常24時間有効ですが、推奨は即座に使用することです。

**Q: 並列リクエストは可能?**
A: 可能ですが、レート制限に注意が必要です。順次処理を推奨します。

**Q: Webhookとの違いは?**
A: GraphQL APIはプル型（定期取得）、Webhookはプッシュ型（イベント駆動）です。リアルタイム性が必要な場合はWebhookを検討してください。

## 参考リンク

- [Shopify GraphQL Admin API Reference](https://shopify.dev/docs/api/admin-graphql)
- [Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)
- [GraphQL Best Practices](https://shopify.dev/docs/api/usage/best-practices)
- [Authentication](https://shopify.dev/docs/apps/auth/admin-app-access-tokens)
