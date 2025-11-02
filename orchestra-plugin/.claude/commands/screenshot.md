# Take Screenshot

Capture a screenshot of a web page using the Browser MCP server.

## Task
Navigate to a specified URL and take a full-page screenshot, saving it to the artifacts directory.

## Steps

1. Ask the user for the URL if not provided in the command arguments

2. Check if Browser MCP server is running:
   ```bash
   curl -s http://localhost:3030/health
   ```
   If not running, tell the user to run `/browser` first

3. Generate a unique filename based on the URL (e.g., `example-com-{timestamp}.png`)

4. Execute the screenshot workflow:
   ```bash
   cd orchestra-plugin/mcp-servers

   # Initialize browser
   ./browser-helper.sh init

   # Navigate to URL
   ./browser-helper.sh navigate {URL}

   # Wait for page load
   sleep 2

   # Take full-page screenshot
   ./browser-helper.sh screenshot {filename}.png true

   # Close browser
   ./browser-helper.sh close
   ```

5. Show the screenshot path to the user and offer to open it

## Example Usage
```
User: /screenshot https://example.com
Assistant: Taking screenshot of https://example.com...
✅ Screenshot saved to: artifacts/browser/{sessionId}/example-com-1234567890.png
```

## Notes
- Requires Browser MCP server to be running (use `/browser` to start)
- Screenshots are saved to artifacts/browser/{sessionId}/
- Full-page screenshots capture the entire page, not just the viewport
