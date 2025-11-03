# Shopify MCP Server Configuration Flow

## Configuration Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestra Setup Start                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Load .env file        │
            │  (if exists)           │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────────────────┐
            │  Check Environment Variables:      │
            │  - SHOPIFY_ADMIN_TOKEN             │
            │  - SHOP_DOMAIN                     │
            └────────────┬───────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐      ┌────────┐
    │  NONE  │     │PARTIAL │      │  FULL  │
    └────┬───┘     └────┬───┘      └────┬───┘
         │              │               │
         │              │               │
         ▼              ▼               ▼
```

## Server Availability Matrix

### Case 1: NONE (No Credentials)

```
Environment:
  SHOPIFY_ADMIN_TOKEN: ❌
  SHOP_DOMAIN:         ❌

Available Servers:
  ✅ Shopify Dev MCP (npx @shopify/dev-mcp@latest)
     └─ API Documentation Search
     └─ GraphQL Schema Introspection
     └─ GraphQL Query Validation
     └─ Liquid Theme Validation
     └─ Polaris Component Docs

  ❌ Shopify Theme Server (shopify-server.py)
     └─ Requires: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN

  ❌ Shopify App Server (shopify-app-server.py)
     └─ Requires: SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN

User Message:
  ℹ️  No Shopify credentials configured
  📖 Available: Documentation and validation features only
  💡 To enable Theme/App servers, add to .env:
     - SHOPIFY_ADMIN_TOKEN
     - SHOP_DOMAIN
```

### Case 2: PARTIAL (Incomplete Credentials)

```
Environment (Example 1):
  SHOPIFY_ADMIN_TOKEN: ✅
  SHOP_DOMAIN:         ❌

Environment (Example 2):
  SHOPIFY_ADMIN_TOKEN: ❌
  SHOP_DOMAIN:         ✅

Available Servers:
  ✅ Shopify Dev MCP (npx @shopify/dev-mcp@latest)
     └─ Same features as NONE case

  ❌ Shopify Theme Server (shopify-server.py)
     └─ Missing required variable(s)

  ❌ Shopify App Server (shopify-app-server.py)
     └─ Missing required variable(s)

User Message:
  ⚠️  Incomplete Shopify configuration detected
  📖 Available: Documentation and validation features only
  ❌ Missing:
     - SHOPIFY_ADMIN_TOKEN (if not set)
     - SHOP_DOMAIN (if not set)
  💡 Both variables are required for Theme/App servers
```

### Case 3: FULL (Complete Credentials)

```
Environment:
  SHOPIFY_ADMIN_TOKEN: ✅ shpat_xxxxx
  SHOP_DOMAIN:         ✅ mystore

Available Servers:
  ✅ Shopify Dev MCP (npx @shopify/dev-mcp@latest)
     └─ API Documentation Search
     └─ GraphQL Schema Introspection
     └─ GraphQL Query Validation
     └─ Liquid Theme Validation
     └─ Polaris Component Docs

  ✅ Shopify Theme Server (shopify-server.py)
     └─ List/Get Themes
     └─ Theme Asset Management (CRUD)
     └─ Publish/Duplicate Themes
     └─ Theme Structure Validation
     └─ Shop Information

  ✅ Shopify App Server (shopify-app-server.py)
     └─ Product Management (CRUD)
     └─ Order Management (Read)
     └─ Customer Management (Read)
     └─ Inventory Management (Read/Update)
     └─ Collection Management (Read)
     └─ Webhook Management (CRUD)
     └─ GraphQL Query Execution
     └─ Shop Metafields
     └─ App Installations
     └─ Shop Analytics

User Message:
  ✅ All Shopify credentials configured
  🎉 Available: All Shopify MCP servers
  📖 Servers:
     1. Shopify Dev MCP (docs, validation)
     2. Shopify Theme Server (theme management)
     3. Shopify App Server (app development)
```

---

## Setup.sh Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    setup.sh execution                        │
└────────────────────────┬────────────────────────────────────┘
                         │
          [Step 1-2]     │
          Prerequisites  │
          and .env setup ▼
                         │
          [Step 3]       │
          Install MCP    │
          dependencies   ▼
                         │
          [Step 3.5]   ┌─┴────────────────────────────────────┐
          NEW STEP!    │  bash mcp-servers/validate-shopify-  │
                       │  env.sh                               │
                       └─┬────────────────────────────────────┘
                         │
                         ├── Returns: "FULL"
                         │   ▼
                         │   Display: ✅ All servers available
                         │
                         ├── Returns: "PARTIAL"
                         │   ▼
                         │   Display: ⚠️  Incomplete config
                         │            List missing variables
                         │
                         └── Returns: "NONE"
                             ▼
                             Display: ℹ️  No credentials
                                     Show setup instructions
                         │
          [Step 4]       │
          Permissions    ▼
                         │
          [Step 5-6]     │
          Artifacts &    │
          Testing        ▼
                         │
                    ┌────┴─────┐
                    │ Complete │
                    └──────────┘
```

---

## Claude Desktop MCP Configuration

### Configuration Strategy

Based on environment variable validation results, the MCP configuration should be adjusted:

#### Always Include (No Dependencies)

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

#### Conditionally Include (Requires Full Credentials)

```json
{
  "mcpServers": {
    "shopify-theme": {
      "command": "python3",
      "args": ["/path/to/shopify-server.py"],
      "env": {
        "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
        "SHOP_DOMAIN": "${SHOP_DOMAIN}"
      }
    },
    "shopify-app": {
      "command": "python3",
      "args": ["/path/to/shopify-app-server.py"],
      "env": {
        "SHOPIFY_ADMIN_TOKEN": "${SHOPIFY_ADMIN_TOKEN}",
        "SHOP_DOMAIN": "${SHOP_DOMAIN}"
      }
    }
  }
}
```

---

## Error Handling Flow

### Python Server Initialization

Current behavior (problematic):

```python
def __init__(self):
    self.token = os.getenv("SHOPIFY_ADMIN_TOKEN")
    self.shop_domain = os.getenv("SHOP_DOMAIN")

    if not self.token:
        raise ValueError("SHOPIFY_ADMIN_TOKEN environment variable is required")
    if not self.shop_domain:
        raise ValueError("SHOP_DOMAIN environment variable is required")
    # ❌ Server fails to start if variables are missing
```

Proposed behavior (Phase 3 - future improvement):

```python
def __init__(self):
    self.token = os.getenv("SHOPIFY_ADMIN_TOKEN")
    self.shop_domain = os.getenv("SHOP_DOMAIN")
    self.is_configured = bool(self.token and self.shop_domain)

    if not self.is_configured:
        # ⚠️  Log warning but continue startup
        print(json.dumps({
            "warning": "Shopify credentials not configured",
            "message": "Server running in limited mode",
            "available_commands": ["help", "config_check"]
        }), file=sys.stderr)
    # ✅ Server starts successfully in "limited mode"
```

---

## Validation Script Output Examples

### Test 1: No credentials

```bash
$ bash mcp-servers/validate-shopify-env.sh
NONE
```

### Test 2: Only TOKEN

```bash
$ export SHOPIFY_ADMIN_TOKEN="shpat_test"
$ bash mcp-servers/validate-shopify-env.sh
PARTIAL
```

### Test 3: Only DOMAIN

```bash
$ export SHOP_DOMAIN="mystore"
$ bash mcp-servers/validate-shopify-env.sh
PARTIAL
```

### Test 4: Both configured

```bash
$ export SHOPIFY_ADMIN_TOKEN="shpat_test"
$ export SHOP_DOMAIN="mystore"
$ bash mcp-servers/validate-shopify-env.sh
FULL
```

---

## User Experience Comparison

### Before (Current Implementation)

```bash
$ bash setup.sh
...
[3/6] Installing MCP server dependencies...
✅ Python packages installed

$ python3 mcp-servers/shopify-server.py
ValueError: SHOPIFY_ADMIN_TOKEN environment variable is required
❌ Setup failed
```

**Problems**:
- Unclear error message
- Setup appears to fail even though Dev MCP would work
- User doesn't know what to do next

### After (Proposed Implementation)

```bash
$ bash setup.sh
...
[3/6] Installing MCP server dependencies...
✅ Python packages installed

[3.5/6] Validating Shopify MCP configuration...
ℹ️  No Shopify credentials configured
📖 Available servers:
   - Shopify Dev MCP only (docs, validation - no auth required)
💡 To enable Theme/App servers, add to .env:
   - SHOPIFY_ADMIN_TOKEN
   - SHOP_DOMAIN

✅ Setup complete!
```

**Improvements**:
- Clear information about what's available
- Explicit instructions for enabling more features
- No unexpected errors
- User understands the current state

---

## Summary

This flexible configuration design ensures:

1. ✅ **Graceful Degradation**: Dev MCP always works (zero-config)
2. ✅ **Clear Feedback**: Users know exactly what's available
3. ✅ **No Surprise Errors**: Setup never fails due to missing Shopify credentials
4. ✅ **Progressive Enhancement**: Users can add credentials later to unlock more features
5. ✅ **Security**: Credentials are validated but never logged or exposed

---

## Next Steps

1. Implement setup.sh modifications (Step 3.5)
2. Update install.sh with conditional testing
3. Enhance .env.example documentation
4. Test all configuration scenarios
5. Update user-facing documentation

For detailed implementation instructions, see:
- [shopify-mcp-flexible-configuration-design.md](./shopify-mcp-flexible-configuration-design.md)
- [shopify-mcp-configuration-summary-ja.md](./shopify-mcp-configuration-summary-ja.md)
