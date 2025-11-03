/**
 * Shopify Admin GraphQL API - 商品取得クライアント
 *
 * セキュリティ機能:
 * - 環境変数による認証情報管理
 * - レート制限対応（指数バックオフ）
 * - 包括的なエラーハンドリング
 * - リクエストタイムアウト
 */

import { config } from 'dotenv';

config();

// 環境変数の型定義
interface ShopifyConfig {
  shop: string;
  accessToken: string;
  apiVersion: string;
}

// APIレスポンスの型定義
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: string;
        sku: string;
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        id: string;
        url: string;
        altText: string | null;
      };
    }>;
  };
}

interface ProductsResponse {
  data: {
    products: {
      edges: Array<{
        node: ShopifyProduct;
        cursor: string;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

// カスタムエラークラス
class ShopifyAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ShopifyAPIError';
  }
}

class ShopifyProductsClient {
  private config: ShopifyConfig;
  private maxRetries = 3;
  private baseDelay = 1000; // 1秒
  private timeout = 30000; // 30秒

  constructor(config?: Partial<ShopifyConfig>) {
    // 環境変数から設定を読み込み
    const shop = config?.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = config?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
    const apiVersion = config?.apiVersion || process.env.SHOPIFY_API_VERSION || '2024-01';

    if (!shop || !accessToken) {
      throw new Error(
        'Shopify credentials are required. Please set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN environment variables.'
      );
    }

    this.config = {
      shop: shop.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      accessToken,
      apiVersion,
    };
  }

  /**
   * GraphQLクエリを実行
   */
  private async executeQuery<T>(
    query: string,
    variables?: Record<string, any>,
    retryCount = 0
  ): Promise<T> {
    const url = `https://${this.config.shop}/admin/api/${this.config.apiVersion}/graphql.json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.config.accessToken,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レート制限チェック
      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, retryCount);
          console.warn(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
          await this.sleep(delay);
          return this.executeQuery<T>(query, variables, retryCount + 1);
        }
        throw new ShopifyAPIError('Rate limit exceeded after multiple retries', 429);
      }

      // その他のHTTPエラー
      if (!response.ok) {
        const errorText = await response.text();
        throw new ShopifyAPIError(
          `HTTP ${response.status}: ${errorText}`,
          response.status
        );
      }

      const result = await response.json();

      // GraphQLエラーチェック
      if (result.errors && result.errors.length > 0) {
        throw new ShopifyAPIError(
          `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`,
          undefined,
          result.errors
        );
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      // ネットワークエラーでリトライ
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ShopifyAPIError('Request timeout', 408);
      }

      if (
        error instanceof TypeError &&
        error.message.includes('fetch') &&
        retryCount < this.maxRetries
      ) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.warn(`Network error. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return this.executeQuery<T>(query, variables, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 商品を取得（ページネーション対応）
   */
  async getProducts(options?: {
    first?: number;
    after?: string;
    query?: string;
  }): Promise<{
    products: ShopifyProduct[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const { first = 50, after, query } = options || {};

    const graphqlQuery = `
      query GetProducts($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          edges {
            node {
              id
              title
              handle
              status
              createdAt
              updatedAt
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                  }
                }
              }
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const result = await this.executeQuery<ProductsResponse>(graphqlQuery, {
      first,
      after,
      query,
    });

    return {
      products: result.data.products.edges.map((edge) => edge.node),
      pageInfo: result.data.products.pageInfo,
    };
  }

  /**
   * すべての商品を取得（自動ページネーション）
   */
  async getAllProducts(options?: {
    query?: string;
    onProgress?: (count: number) => void;
  }): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let after: string | undefined;

    while (hasNextPage) {
      const { products, pageInfo } = await this.getProducts({
        first: 50,
        after,
        query: options?.query,
      });

      allProducts.push(...products);
      hasNextPage = pageInfo.hasNextPage;
      after = pageInfo.endCursor || undefined;

      if (options?.onProgress) {
        options.onProgress(allProducts.length);
      }

      // レート制限を避けるための待機
      if (hasNextPage) {
        await this.sleep(500);
      }
    }

    return allProducts;
  }

  /**
   * 特定の商品をIDで取得
   */
  async getProductById(id: string): Promise<ShopifyProduct | null> {
    const query = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          createdAt
          updatedAt
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                sku
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
    `;

    const result = await this.executeQuery<{
      data: { product: ShopifyProduct | null };
    }>(query, { id });

    return result.data.product;
  }

  /**
   * スリープユーティリティ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 使用例
async function example() {
  try {
    const client = new ShopifyProductsClient();

    // 1. 基本的な商品取得
    console.log('Fetching first page of products...');
    const { products, pageInfo } = await client.getProducts({ first: 10 });
    console.log(`Found ${products.length} products`);
    console.log('First product:', products[0]);

    // 2. フィルタリング（アクティブな商品のみ）
    console.log('\nFetching active products...');
    const activeProducts = await client.getProducts({
      first: 10,
      query: 'status:active',
    });
    console.log(`Found ${activeProducts.products.length} active products`);

    // 3. すべての商品を取得（進捗表示付き）
    console.log('\nFetching all products...');
    const allProducts = await client.getAllProducts({
      onProgress: (count) => {
        console.log(`Progress: ${count} products fetched...`);
      },
    });
    console.log(`Total products: ${allProducts.length}`);

    // 4. 特定の商品を取得
    if (products.length > 0) {
      const productId = products[0].id;
      console.log(`\nFetching product by ID: ${productId}`);
      const product = await client.getProductById(productId);
      console.log('Product details:', product);
    }
  } catch (error) {
    if (error instanceof ShopifyAPIError) {
      console.error('Shopify API Error:', {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
      });
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

// 直接実行された場合の処理
if (require.main === module) {
  example();
}

export { ShopifyProductsClient, ShopifyAPIError, ShopifyProduct };
