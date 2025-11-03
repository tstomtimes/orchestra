#!/bin/bash

# Shopify Admin GraphQL API - cURL実装例
#
# 使用方法:
# 1. 環境変数を設定: export SHOPIFY_SHOP_DOMAIN="your-store.myshopify.com"
#                    export SHOPIFY_ACCESS_TOKEN="shpat_xxxxx"
# 2. このスクリプトを実行: bash shopify-curl-examples.sh

set -euo pipefail

# 環境変数チェック
if [ -z "${SHOPIFY_SHOP_DOMAIN:-}" ] || [ -z "${SHOPIFY_ACCESS_TOKEN:-}" ]; then
    echo "Error: SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN must be set"
    echo "Example:"
    echo "  export SHOPIFY_SHOP_DOMAIN='your-store.myshopify.com'"
    echo "  export SHOPIFY_ACCESS_TOKEN='shpat_xxxxx'"
    exit 1
fi

API_VERSION="${SHOPIFY_API_VERSION:-2024-01}"
API_URL="https://${SHOPIFY_SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json"

echo "=== Shopify GraphQL API Examples ==="
echo "Shop: ${SHOPIFY_SHOP_DOMAIN}"
echo "API Version: ${API_VERSION}"
echo ""

# 例1: 基本的な商品取得
echo "1. Basic Products Query"
echo "----------------------"
curl -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
  -d '{
    "query": "query { products(first: 5) { edges { node { id title handle status } cursor } pageInfo { hasNextPage endCursor } } }"
  }' | jq '.'

echo -e "\n"

# 例2: 詳細な商品情報取得
echo "2. Detailed Products Query with Variants"
echo "----------------------------------------"
curl -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
  -d '{
    "query": "query { products(first: 3) { edges { node { id title handle variants(first: 10) { edges { node { id title price sku } } } images(first: 5) { edges { node { url altText } } } } } } }"
  }' | jq '.'

echo -e "\n"

# 例3: フィルタリング（アクティブな商品のみ）
echo "3. Filtered Query (Active Products Only)"
echo "----------------------------------------"
curl -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
  -d '{
    "query": "query($query: String!) { products(first: 10, query: $query) { edges { node { id title status updatedAt } } } }",
    "variables": {
      "query": "status:active"
    }
  }' | jq '.'

echo -e "\n"

# 例4: ページネーション（カーソルを使用）
echo "4. Pagination Example"
echo "--------------------"
echo "First page:"
RESPONSE=$(curl -s -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
  -d '{
    "query": "query { products(first: 2) { edges { node { id title } cursor } pageInfo { hasNextPage endCursor } } }"
  }')

echo "$RESPONSE" | jq '.'

# endCursorを抽出して次のページを取得
END_CURSOR=$(echo "$RESPONSE" | jq -r '.data.products.pageInfo.endCursor')
HAS_NEXT=$(echo "$RESPONSE" | jq -r '.data.products.pageInfo.hasNextPage')

if [ "$HAS_NEXT" = "true" ] && [ "$END_CURSOR" != "null" ]; then
    echo -e "\nNext page (using cursor: ${END_CURSOR}):"
    curl -X POST "${API_URL}" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
      -d "{
        \"query\": \"query(\$after: String!) { products(first: 2, after: \$after) { edges { node { id title } cursor } pageInfo { hasNextPage endCursor } } }\",
        \"variables\": {
          \"after\": \"${END_CURSOR}\"
        }
      }" | jq '.'
fi

echo -e "\n"

# 例5: 特定の商品をIDで取得
echo "5. Get Product by ID"
echo "-------------------"
# まず最初の商品IDを取得
PRODUCT_ID=$(curl -s -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
  -d '{
    "query": "query { products(first: 1) { edges { node { id } } } }"
  }' | jq -r '.data.products.edges[0].node.id')

if [ "$PRODUCT_ID" != "null" ] && [ -n "$PRODUCT_ID" ]; then
    echo "Fetching product: ${PRODUCT_ID}"
    curl -X POST "${API_URL}" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
      -d "{
        \"query\": \"query(\$id: ID!) { product(id: \$id) { id title handle description variants(first: 10) { edges { node { id title price } } } } }\",
        \"variables\": {
          \"id\": \"${PRODUCT_ID}\"
        }
      }" | jq '.'
else
    echo "No products found in the store."
fi

echo -e "\n=== Examples Complete ==="
