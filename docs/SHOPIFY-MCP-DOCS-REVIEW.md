# Shopify MCP Flexible Configuration - Documentation Quality Review

**Review Date**: 2025-11-03
**Reviewer**: Eden (Documentation Lead)
**Review Scope**: .env.example (Shopify section) and docs/mcp-shopify-dev-setup.md (new comparison section)

---

## 1. Overall Assessment

### Quality Score: 8.5/10

**Target Audience Fit**: High
**Improvement Priority**: Medium

The documentation successfully explains the three Shopify MCP server options with clear differentiation. Both documents are well-structured and provide actionable information for users at different skill levels. However, some areas need clarification for optimal user experience.

---

## 2. Strengths

### 2.1 Clear Server Differentiation
The comparison table in `docs/mcp-shopify-dev-setup.md` (lines 23-31) effectively visualizes the three server options, making it immediately clear which server requires authentication and what each provides.

### 2.2 Progressive Disclosure
The .env.example file (lines 14-37) uses an excellent progressive structure:
- Overview of all three servers at the top
- Detailed explanation for each
- Credentials section at the bottom with clear examples

### 2.3 Accurate Technical Information
All technical details align with implementation:
- Server names match actual server filenames
- Environment variable names are correct
- Features listed match the actual tool capabilities
- SHOP_DOMAIN format guidance is accurate (lines 36-37)

### 2.4 Actionable Verification Steps
The "Check Available Servers" section (lines 40-53) provides a concrete command users can run to verify their setup, with clear output interpretation.

### 2.5 Consistent Terminology
Both documents use consistent naming:
- "Shopify Dev MCP" (official npm package)
- "Shopify Theme Server" (custom Python server)
- "Shopify App Server" (custom Python server)

---

## 3. Issues and Improvement Recommendations

### 3.1 Language Inconsistency

**Location**: docs/mcp-shopify-dev-setup.md (lines 23-53)
**Current**: English section in Japanese document
**Issue**: The new "Shopify MCP Servers Comparison" section is in English while the rest of the document is in Japanese
**Impact**: Breaks reading flow for Japanese users, creates confusion about target audience
**Recommendation**: Translate the comparison section to Japanese or add a note explaining why this section is in English
**Priority**: High

**Suggested Japanese Translation**:
```markdown
## Shopify MCP サーバー比較

Orchestra は 3 つの Shopify MCP サーバーを提供しています。それぞれ異なる認証要件があります：

| サーバー名 | 認証の要否 | 主な用途 | 利用可能条件 |
|------------|------------|----------|--------------|
| **Shopify Dev MCP** | 不要 | ドキュメント検索、GraphQL/Liquid 検証 | 常時（npx経由） |
| **Shopify Theme Server** | SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN | テーマ管理・開発 | 認証情報設定時 |
| **Shopify App Server** | SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN | アプリ開発（商品、注文、顧客） | 認証情報設定時 |

### 使用するサーバーの選び方

1. **ドキュメント参照のみ**: Shopify Dev MCP を使用（認証不要）
2. **テーマ開発**: Shopify Dev MCP + Shopify Theme Server
3. **アプリ開発**: Shopify Dev MCP + Shopify App Server
4. **フルスタック開発**: 3 つすべてのサーバーを使用
```

---

### 3.2 Missing Scope Details

**Location**: .env.example (lines 25, 30)
**Current Text**:
```bash
# 2. Shopify Theme Server (shopify-server.py)
#    - Scopes needed: themes:read, themes:write

# 3. Shopify App Server (shopify-app-server.py)
#    - Scopes needed: products:read, products:write, orders:read, customers:read, etc.
```
**Issue**: "etc." is vague and doesn't help users create proper API tokens
**Impact**: Users may create tokens with insufficient permissions, leading to runtime errors
**Recommendation**: Provide complete scope lists or link to documentation with full requirements
**Priority**: High

**Suggested Improvement**:
```bash
# 2. Shopify Theme Server (shopify-server.py)
#    - Requires: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN
#    - Features: Theme management, asset CRUD, theme validation
#    - Required scopes: write_themes, read_themes
#    - See: https://shopify.dev/docs/api/admin-rest/2024-10/resources/theme

# 3. Shopify App Server (shopify-app-server.py)
#    - Requires: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN
#    - Features: Products, orders, customers, inventory, webhooks, GraphQL queries
#    - Required scopes: write_products, read_products, write_orders, read_orders,
#                       read_customers, write_inventory, read_inventory
#    - See: https://shopify.dev/docs/api/admin-rest/2024-10/resources
```

---

### 3.3 Ambiguous "How to Choose" Section

**Location**: docs/mcp-shopify-dev-setup.md (lines 33-38)
**Current Text**:
```markdown
### How to Choose

1. **Documentation reference only**: Use Shopify Dev MCP (no authentication needed)
2. **Theme development**: Shopify Dev MCP + Shopify Theme Server
3. **App development**: Shopify Dev MCP + Shopify App Server
4. **Full-stack development**: All three servers
```
**Issue**: Doesn't explain *why* you need Dev MCP in addition to other servers
**Impact**: Users may wonder if Dev MCP is optional when using Theme/App servers
**Recommendation**: Clarify that Dev MCP provides documentation/validation for all workflows
**Priority**: Medium

**Suggested Improvement**:
```markdown
### How to Choose

The Shopify Dev MCP provides documentation and validation for all workflows and is always available via npx. Combine it with specialized servers based on your needs:

1. **Documentation reference only**: Shopify Dev MCP (no authentication needed)
   - Use when: Looking up API documentation, validating GraphQL queries, checking Liquid syntax
2. **Theme development**: Shopify Dev MCP + Shopify Theme Server
   - Use when: Building or modifying Shopify themes, managing theme assets
3. **App development**: Shopify Dev MCP + Shopify App Server
   - Use when: Creating Shopify apps, managing products/orders/customers
4. **Full-stack development**: All three servers
   - Use when: Working on both theme and app development simultaneously
```

---

### 3.4 Validation Script Output Unclear

**Location**: docs/mcp-shopify-dev-setup.md (lines 49-52)
**Current Text**:
```markdown
Output meanings:
- `FULL` - All servers available (credentials fully configured)
- `PARTIAL` - Dev MCP only (credentials incomplete)
- `NONE` - Dev MCP only (credentials not set)
```
**Issue**: `PARTIAL` and `NONE` both result in "Dev MCP only" - unclear what the difference is
**Impact**: Users won't understand what `PARTIAL` means or how to fix it
**Recommendation**: Explain that `PARTIAL` means one credential is missing
**Priority**: Medium

**Suggested Improvement**:
```markdown
Output meanings:
- `FULL` - All three servers available (both SHOPIFY_ADMIN_TOKEN and SHOP_DOMAIN configured)
- `PARTIAL` - Only Dev MCP available (one credential missing - either SHOPIFY_ADMIN_TOKEN or SHOP_DOMAIN)
- `NONE` - Only Dev MCP available (neither SHOPIFY_ADMIN_TOKEN nor SHOP_DOMAIN configured)

If you see `PARTIAL`, check which credential is missing by running:
```bash
echo "Token set: ${SHOPIFY_ADMIN_TOKEN:+YES}"
echo "Domain set: ${SHOP_DOMAIN:+YES}"
```
```

---

### 3.5 Missing Link to Admin Token Creation

**Location**: .env.example (lines 14-37)
**Issue**: No guidance on how to create a SHOPIFY_ADMIN_TOKEN
**Impact**: New users won't know where to get their admin token
**Recommendation**: Add a link to Shopify's token creation documentation
**Priority**: Medium

**Suggested Addition** (after line 31):
```bash
# How to get your SHOPIFY_ADMIN_TOKEN:
# 1. For custom apps: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens
# 2. For theme development: Create a private app in your Shopify admin panel
#    Admin → Settings → Apps and sales channels → Develop apps → Create an app
```

---

### 3.6 Table Formatting Risk

**Location**: docs/mcp-shopify-dev-setup.md (lines 27-31)
**Current**: Markdown table with variable-width columns
**Issue**: Long text in cells may break rendering on narrow screens
**Impact**: Table may be unreadable on mobile devices or narrow terminal windows
**Recommendation**: Test on multiple platforms (GitHub, VS Code, terminal markdown viewers)
**Priority**: Low

**Verification Needed**:
- GitHub web interface (desktop)
- GitHub mobile app
- VS Code markdown preview
- Terminal markdown viewers (glow, mdcat)

**Alternative Format** (if table breaks):
```markdown
### Shopify MCP サーバー比較

#### 1. Shopify Dev MCP
- **認証**: 不要
- **主な用途**: ドキュメント検索、GraphQL/Liquid 検証
- **利用可能条件**: 常時（npx経由）

#### 2. Shopify Theme Server
- **認証**: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN
- **主な用途**: テーマ管理・開発
- **利用可能条件**: 認証情報設定時

#### 3. Shopify App Server
- **認証**: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN
- **主な用途**: アプリ開発（商品、注文、顧客）
- **利用可能条件**: 認証情報設定時
```

---

### 3.7 Setup.sh Message Consistency

**Location**: Cross-reference between setup.sh output and documentation
**Current**: setup.sh shows messages like "Shopify Dev MCP (docs, GraphQL validation, Liquid validation)"
**Issue**: Feature lists slightly differ between setup.sh and .env.example
**Impact**: Minor inconsistency may confuse users comparing multiple sources
**Recommendation**: Ensure all feature lists match exactly
**Priority**: Low

**setup.sh (line 138)**: "docs, GraphQL validation, Liquid validation"
**.env.example (line 19)**: "API docs, GraphQL validation, Liquid validation"

**Suggested Alignment**: Use "API docs, GraphQL validation, Liquid validation" in both places

---

## 4. Table/List Verification

### 4.1 Markdown Rendering Tests

| Platform | Status | Notes |
|----------|--------|-------|
| GitHub Web | ✅ Expected to render correctly | Standard markdown table |
| VS Code Preview | ✅ Expected to render correctly | Built-in markdown support |
| Terminal (cat) | ⚠️ May not render | Plain text display |
| GitHub Mobile | ⚠️ May overflow | Long text in "Available When" column |

**Recommendation**: Test on GitHub after committing to verify actual rendering.

### 4.2 Code Block Syntax Highlighting

**Location**: docs/mcp-shopify-dev-setup.md
**Status**: ✅ All code blocks properly tagged
- `bash` blocks: Lines 44-46, 63-65, 80-82, etc.
- `json` blocks: Lines 94-101, 107-118, etc.
- `liquid` blocks: Lines 162-164

**Verification**: All code blocks use correct language identifiers for syntax highlighting.

---

## 5. Additional Recommendations

### 5.1 Add Troubleshooting Section

**Suggestion**: Create a troubleshooting section in .env.example

**Location**: After line 37 in .env.example
**Content**:
```bash
# Common Issues:
#
# Q: I set credentials but Theme/App servers don't appear
# A: Run: source .env && bash mcp-servers/validate-shopify-env.sh
#    Ensure output shows "FULL", not "PARTIAL" or "NONE"
#
# Q: Getting "SHOP_DOMAIN environment variable is required" error
# A: Check SHOP_DOMAIN format - use store name only, not full URL
#    ✅ Correct: SHOP_DOMAIN=mystore
#    ❌ Wrong: SHOP_DOMAIN=mystore.myshopify.com
#
# Q: Getting authentication errors with valid token
# A: Verify token has required scopes in Shopify admin panel
#    Admin → Settings → Apps and sales channels → [Your App] → Configuration
```

---

### 5.2 Add Visual Diagram (Optional)

**Priority**: Low
**Suggestion**: Add a simple ASCII diagram showing server relationships

**Location**: docs/mcp-shopify-dev-setup.md after line 38
**Example**:
```markdown
### Server Architecture

```
┌─────────────────────────────────────────────┐
│           Your Development Setup            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────┐                     │
│  │  Shopify Dev MCP   │  ← Always available │
│  │  (Documentation)   │     (via npx)       │
│  └────────────────────┘                     │
│           ↓                                  │
│  ┌─────────────────────────────────────┐    │
│  │   Credential-based Servers          │    │
│  │   (Require SHOPIFY_ADMIN_TOKEN +    │    │
│  │            SHOP_DOMAIN)             │    │
│  ├─────────────────────────────────────┤    │
│  │ Theme Server │  App Server          │    │
│  │ (Themes)     │  (Products/Orders)   │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```
```

---

### 5.3 Add FAQ Section

**Priority**: Medium
**Suggestion**: Add FAQ to docs/mcp-shopify-dev-setup.md

**Location**: Before line 325 (before "参考リンク")
**Content**:
```markdown
## よくある質問（FAQ）

### Q1: 3つすべてのサーバーを使う必要がありますか？

A: いいえ。使用するサーバーは開発内容によって選択できます：
- ドキュメント参照のみ → Dev MCP のみ
- テーマ開発 → Dev MCP + Theme Server
- アプリ開発 → Dev MCP + App Server

### Q2: Dev MCP は Theme/App Server と何が違いますか？

A: Dev MCP はドキュメント検索とコード検証のみ提供します（認証不要）。Theme/App Server は実際の Shopify ストアに接続してデータを読み書きします（認証必要）。

### Q3: SHOP_DOMAIN の形式は？

A: ストア名のみを指定します。`.myshopify.com` は不要です。
- ✅ 正しい: `SHOP_DOMAIN=mystore`
- ❌ 間違い: `SHOP_DOMAIN=mystore.myshopify.com`
- ❌ 間違い: `SHOP_DOMAIN=https://mystore.myshopify.com`

### Q4: Admin Token はどこで取得しますか？

A: Shopify 管理画面でカスタムアプリを作成します：
1. 管理画面 → 設定 → アプリと販売チャネル
2. アプリを開発する → アプリを作成
3. 必要なスコープを選択して Admin API アクセストークンを生成

### Q5: setup.sh で PARTIAL と表示されます

A: SHOPIFY_ADMIN_TOKEN または SHOP_DOMAIN のどちらか一方が未設定です。両方を .env に設定してください。
```

---

### 5.4 Cross-Reference Links

**Priority**: Low
**Suggestion**: Add cross-references between related documentation

**Location**: .env.example line 37
**Current**:
```bash
# Note: SHOP_DOMAIN should be the store name only, not the full URL
# Example: If your store is https://mystore.myshopify.com, use: SHOP_DOMAIN=mystore
```

**Suggested Enhancement**:
```bash
# Note: SHOP_DOMAIN should be the store name only, not the full URL
# Example: If your store is https://mystore.myshopify.com, use: SHOP_DOMAIN=mystore
# For detailed setup instructions, see: docs/mcp-shopify-dev-setup.md
```

---

## 6. Completeness Checklist

### Information Coverage
- [x] All three servers explained
- [x] Authentication requirements clearly stated
- [x] SHOP_DOMAIN format guidance provided
- [x] Verification command included
- [x] Features listed for each server
- [ ] Complete scope lists (missing for App Server - "etc." used)
- [ ] Link to token creation guide (missing)
- [ ] Troubleshooting for common errors (missing)

### Technical Accuracy
- [x] Server names match implementation
- [x] Environment variable names correct
- [x] Features align with actual capabilities
- [x] SHOP_DOMAIN format correct
- [x] Validation script path correct
- [⚠️] Scope lists need completion (App Server uses "etc.")

### Usability
- [x] Clear differentiation between servers
- [x] Actionable verification steps
- [x] Copy-paste ready examples
- [⚠️] Language inconsistency (English section in Japanese doc)
- [ ] FAQ section (missing, would enhance usability)

---

## 7. Final Judgment

### ✅ Approval with Recommended Revisions

**Verdict**: The documentation is **functional and accurate** but would benefit from **medium-priority revisions** before final release.

**Reasoning**:
1. **Core information is complete and accurate** - Users can successfully configure all three servers
2. **Language inconsistency is confusing** - English section in Japanese document should be translated
3. **Scope details need completion** - "etc." is too vague for API token creation
4. **Minor enhancements would improve user experience** - FAQ, troubleshooting, token creation links

**Recommendation Path**:
- **Fix now** (before release):
  - Translate English section to Japanese (Priority: High)
  - Complete scope lists (Priority: High)
  - Add token creation links (Priority: Medium)
- **Fix later** (post-release):
  - Add FAQ section
  - Add troubleshooting section
  - Test table rendering on all platforms
  - Align feature descriptions across all files

---

## 8. Summary for Stakeholders

### For Technical Users
The documentation provides all necessary information to configure Shopify MCP servers. The comparison table effectively differentiates the three options. Some clarifications around scopes and token creation would reduce support burden.

### For Product Managers
Documentation successfully communicates the flexible configuration approach. Users can start with zero authentication (Dev MCP only) and progressively add credentials for advanced features. Clear upgrade path from documentation-only to full-stack development.

### For Support Teams
Anticipate questions about:
1. Language mixing (English section in Japanese doc)
2. PARTIAL vs NONE status meanings
3. How to create admin tokens
4. Complete scope requirements for App Server

Consider creating a supplementary FAQ document to address these proactively.

---

## Review Metadata

**Files Reviewed**:
- `/Users/tstomtimes/Documents/GitHub/orchestra/.env.example` (lines 14-37)
- `/Users/tstomtimes/Documents/GitHub/orchestra/docs/mcp-shopify-dev-setup.md` (lines 23-53)

**Cross-Referenced**:
- `/Users/tstomtimes/Documents/GitHub/orchestra/setup.sh` (lines 132-156)
- `/Users/tstomtimes/Documents/GitHub/orchestra/mcp-servers/validate-shopify-env.sh`
- Implementation verified by Finn (all tests PASS)

**Review Completed**: 2025-11-03
**Next Review Recommended**: After implementing priority fixes
**Document Owner**: Eden (Documentation Lead)

---

## Appendix: Quick Fix Script

For rapid implementation of high-priority fixes, here's a checklist:

```bash
# 1. Translate English section to Japanese
# File: docs/mcp-shopify-dev-setup.md
# Lines: 23-53
# Action: Replace with Japanese translation

# 2. Expand scope details
# File: .env.example
# Lines: 25, 30
# Action: Replace "etc." with complete scope lists + documentation links

# 3. Add token creation link
# File: .env.example
# After line: 31
# Action: Add "How to get your SHOPIFY_ADMIN_TOKEN" section

# 4. Clarify validation output
# File: docs/mcp-shopify-dev-setup.md
# Lines: 49-52
# Action: Expand PARTIAL/NONE explanations with verification command
```

---

**End of Review**
