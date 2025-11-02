# Browser MCP Server Management

Start or restart the Browser MCP server for automated web operations.

## Task
Restart the Browser MCP server on port 9222. If already running, stop it first to ensure new environment settings are loaded.

## Steps

1. Stop any existing Browser MCP server processes:
   ```bash
   pkill -f "ts-node browser-server.ts" || true
   ```

2. Wait for clean shutdown:
   ```bash
   sleep 2
   ```

3. Start the server in the background:
   ```bash
   cd orchestra-plugin/mcp-servers && npm run browser &
   ```

4. Wait for startup and verify:
   ```bash
   sleep 3 && curl -s http://localhost:9222/health | jq
   ```

5. Show usage instructions:
   ```
   ✅ Browser MCP server is running on http://localhost:9222
   👁️  Browser mode: GUI visible (set BROWSER_HEADLESS=true for headless mode)

   Quick test:
   ./orchestra-plugin/mcp-servers/browser-helper.sh init
   ./orchestra-plugin/mcp-servers/browser-helper.sh navigate https://example.com
   ./orchestra-plugin/mcp-servers/browser-helper.sh screenshot example.png true
   ./orchestra-plugin/mcp-servers/browser-helper.sh close

   See: orchestra-plugin/agents/skills/web-browse.md for full documentation
   ```

## Notes
- The server always restarts to pick up new .env settings
- All browser operations are logged to artifacts/browser/{sessionId}/
- Rate limits: 10 navigations, 50 clicks, 30 inputs per session
- Default port: 9222 (Chrome DevTools Protocol standard port)
- Default mode: GUI visible (browser window opens automatically)
- To stop: `pkill -f "ts-node browser-server.ts"`
