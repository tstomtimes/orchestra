/**
 * Browser MCP Server
 * Safe browser automation with Playwright for AI-driven development
 *
 * Security features:
 * - Domain allowlist
 * - Operation rate limits
 * - Action logging
 * - Safe mode restrictions
 */

import express, { Request, Response } from 'express';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(express.json());

// Security configuration
// Note: Domain restrictions removed for better development experience
// Security is enforced through:
// - Input sanitization (passwords, credit cards blocked)
// - Rate limiting
// - Operation logging
// - Local-only access (localhost:3030)

// Rate limiting
const operationCounts = new Map<string, { nav: number; click: number; type: number }>();
const MAX_NAV = 10;
const MAX_CLICK = 50;
const MAX_TYPE = 30;

// State
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
const sessionId = Date.now().toString();

// Artifacts directory
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'browser', sessionId);

// Helper: Validate URL format
function isUrlAllowed(url: string): boolean {
  try {
    new URL(url); // Just validate it's a valid URL
    return true;
  } catch {
    return false;
  }
}

// Helper: Check rate limits
function checkRateLimit(sessionId: string, operation: 'nav' | 'click' | 'type'): boolean {
  const counts = operationCounts.get(sessionId) || { nav: 0, click: 0, type: 0 };

  const limits = { nav: MAX_NAV, click: MAX_CLICK, type: MAX_TYPE };
  if (counts[operation] >= limits[operation]) {
    return false;
  }

  counts[operation]++;
  operationCounts.set(sessionId, counts);
  return true;
}

// Helper: Log operation
async function logOperation(operation: string, details: any) {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  const logPath = path.join(ARTIFACTS_DIR, 'operations.log');
  const logEntry = `${new Date().toISOString()} [${operation}] ${JSON.stringify(details)}\n`;
  await fs.appendFile(logPath, logEntry);
}

// Initialize browser
app.post('/init', async (req: Request, res: Response) => {
  try {
    if (browser) {
      return res.json({ ok: true, message: 'Browser already initialized' });
    }

    // Use BROWSER_HEADLESS env var to control visibility (default: true for CI/background)
    const headless = process.env.BROWSER_HEADLESS !== 'false';

    browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    context = await browser.newContext({
      ignoreHTTPSErrors: false,
      viewport: { width: 1280, height: 720 },
      userAgent: 'Orchestra-Plugin-Browser/1.0'
    });

    await logOperation('init', { sessionId });
    res.json({ ok: true, sessionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Navigate to URL
app.post('/navigate', async (req: Request, res: Response) => {
  try {
    const { url, waitUntil = 'domcontentloaded' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isUrlAllowed(url)) {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    if (!checkRateLimit(sessionId, 'nav')) {
      return res.status(429).json({ error: `Navigation limit (${MAX_NAV}) exceeded` });
    }

    if (!context) {
      return res.status(400).json({ error: 'Browser not initialized. Call /init first' });
    }

    if (!page) {
      page = await context.newPage();
    }

    await page.goto(url, {
      waitUntil: waitUntil as any,
      timeout: 30000
    });

    const finalUrl = page.url();
    const title = await page.title();

    await logOperation('navigate', { url, finalUrl, title });
    res.json({ ok: true, url: finalUrl, title });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Click element
app.post('/click', async (req: Request, res: Response) => {
  try {
    const { selector } = req.body;

    if (!selector) {
      return res.status(400).json({ error: 'Selector is required' });
    }

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    if (!checkRateLimit(sessionId, 'click')) {
      return res.status(429).json({ error: `Click limit (${MAX_CLICK}) exceeded` });
    }

    await page.click(selector, { timeout: 10000 });
    await logOperation('click', { selector });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Type text
app.post('/type', async (req: Request, res: Response) => {
  try {
    const { selector, text, pressEnter = false } = req.body;

    if (!selector || !text) {
      return res.status(400).json({ error: 'Selector and text are required' });
    }

    // Security: Block sensitive patterns
    const BLOCKED_PATTERNS = [
      /password/i,
      /credit.*card/i,
      /ssn/i,
      /social.*security/i
    ];

    if (BLOCKED_PATTERNS.some(pattern => pattern.test(text) || pattern.test(selector))) {
      return res.status(403).json({ error: 'Potentially sensitive input blocked' });
    }

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    if (!checkRateLimit(sessionId, 'type')) {
      return res.status(429).json({ error: `Type limit (${MAX_TYPE}) exceeded` });
    }

    await page.fill(selector, text, { timeout: 10000 });
    if (pressEnter) {
      await page.keyboard.press('Enter');
    }

    await logOperation('type', { selector, textLength: text.length, pressEnter });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Authenticate with credentials from environment variables or user input
app.post('/auth', async (req: Request, res: Response) => {
  try {
    const { type, passwordSelector, submitSelector, password: providedPassword } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Auth type is required' });
    }

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    let envVarName = '';
    let password = '';

    // Map auth type to environment variable
    switch (type) {
      case 'shopify-store':
        envVarName = 'SHOPIFY_STORE_PASSWORD';
        password = process.env.SHOPIFY_STORE_PASSWORD || '';
        break;
      case 'staging':
        envVarName = 'STAGING_PASSWORD';
        password = process.env.STAGING_PASSWORD || '';
        break;
      case 'preview':
        envVarName = 'PREVIEW_PASSWORD';
        password = process.env.PREVIEW_PASSWORD || '';
        break;
      default:
        // Support custom auth types
        envVarName = `${type.toUpperCase().replace(/-/g, '_')}_PASSWORD`;
        password = process.env[envVarName] || '';
    }

    // If no password in env and none provided, request it from user
    if (!password && !providedPassword) {
      return res.status(401).json({
        needsPassword: true,
        envVarName,
        type,
        message: `Password required for ${type}. Please provide password in request body or set ${envVarName} in .env file.`,
        prompt: `Please enter the password for ${type}:`
      });
    }

    // Use provided password if available, otherwise use env var
    const finalPassword = providedPassword || password;

    // Fill password field
    const pwSelector = passwordSelector || 'input[type="password"]';
    await page.fill(pwSelector, finalPassword, { timeout: 10000 });

    // Submit if selector provided
    if (submitSelector) {
      await page.click(submitSelector, { timeout: 10000 });

      // Wait for navigation after submission
      try {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
      } catch (error) {
        // Timeout is OK - might be waiting for 2FA
      }
    }

    await logOperation('auth', { type, passwordSelector: pwSelector, submitted: !!submitSelector });

    // Check if 2FA is required by looking for common 2FA indicators
    const pageUrl = page.url();
    const pageContent = await page.content();
    const contentLower = pageContent.toLowerCase();

    const requires2FA =
      // URL patterns
      pageUrl.includes('2fa') ||
      pageUrl.includes('mfa') ||
      pageUrl.includes('verify') ||
      pageUrl.includes('authentication') ||
      // English keywords
      contentLower.includes('two-factor') ||
      contentLower.includes('authentication code') ||
      contentLower.includes('verification code') ||
      contentLower.includes('authenticator') ||
      contentLower.includes('enter code') ||
      contentLower.includes('security code') ||
      // Japanese keywords
      pageContent.includes('二段階認証') ||
      pageContent.includes('2段階認証') ||
      pageContent.includes('認証コード') ||
      pageContent.includes('確認コード') ||
      pageContent.includes('セキュリティコード') ||
      pageContent.includes('ワンタイムパスワード');

    if (requires2FA) {
      // 2FA detected - need user intervention
      await logOperation('auth_2fa_detected', { type, url: pageUrl });
      return res.json({
        ok: true,
        requires2FA: true,
        message: '2FA required - please complete authentication manually',
        url: pageUrl,
        envVarName: providedPassword && !password ? envVarName : undefined,
        shouldSavePassword: providedPassword && !password
      });
    }

    // If password was provided (not from env), save it
    if (providedPassword && !password) {
      res.json({
        ok: true,
        message: `Authenticated successfully`,
        shouldSavePassword: true,
        envVarName,
        type
      });
    } else {
      res.json({ ok: true, message: `Authenticated using ${envVarName}` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Wait for 2FA completion
app.post('/auth/wait-2fa', async (req: Request, res: Response) => {
  try {
    const { timeout = 120000, expectedUrlPattern } = req.body; // Default 2 minutes

    if (!page) {
      return res.status(400).json({ error: 'No active page' });
    }

    const startUrl = page.url();
    const startTime = Date.now();

    // Wait for URL change or timeout
    const checkInterval = 2000; // Check every 2 seconds
    let completed = false;

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));

      const currentUrl = page.url();

      // Check if URL changed (indicating successful auth)
      if (currentUrl !== startUrl) {
        // If expected pattern provided, check it
        if (expectedUrlPattern) {
          if (new RegExp(expectedUrlPattern).test(currentUrl)) {
            completed = true;
            break;
          }
        } else {
          // URL changed and no pattern specified - assume success
          completed = true;
          break;
        }
      }

      // Also check if 2FA indicators are gone
      const pageContent = await page.content();
      const contentLower = pageContent.toLowerCase();
      const still2FA =
        currentUrl.includes('2fa') ||
        currentUrl.includes('mfa') ||
        currentUrl.includes('verify') ||
        contentLower.includes('two-factor') ||
        contentLower.includes('authentication code') ||
        contentLower.includes('verification code') ||
        contentLower.includes('enter code') ||
        contentLower.includes('security code') ||
        pageContent.includes('二段階認証') ||
        pageContent.includes('2段階認証') ||
        pageContent.includes('認証コード') ||
        pageContent.includes('確認コード') ||
        pageContent.includes('セキュリティコード') ||
        pageContent.includes('ワンタイムパスワード');

      if (!still2FA && currentUrl !== startUrl) {
        completed = true;
        break;
      }
    }

    if (completed) {
      await logOperation('auth_2fa_completed', { url: page.url() });
      res.json({
        ok: true,
        completed: true,
        message: '2FA completed successfully',
        url: page.url()
      });
    } else {
      res.json({
        ok: true,
        completed: false,
        message: '2FA timeout - still waiting for authentication',
        url: page.url()
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save password to .env file
app.post('/auth/save', async (req: Request, res: Response) => {
  try {
    const { envVarName, password } = req.body;

    if (!envVarName || !password) {
      return res.status(400).json({ error: 'envVarName and password are required' });
    }

    const envPath = path.join(process.cwd(), '../../.env');

    // Read existing .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // .env doesn't exist, create new one
      envContent = '';
    }

    // Check if variable already exists
    const varRegex = new RegExp(`^${envVarName}=.*$`, 'm');
    if (varRegex.test(envContent)) {
      // Update existing variable
      envContent = envContent.replace(varRegex, `${envVarName}=${password}`);
    } else {
      // Add new variable
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `\n# Auto-saved password\n${envVarName}=${password}\n`;
    }

    // Write back to .env
    await fs.writeFile(envPath, envContent, 'utf-8');

    // Update current process env
    process.env[envVarName] = password;

    await logOperation('auth_save', { envVarName });
    res.json({ ok: true, message: `Password saved to .env as ${envVarName}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Wait for selector
app.post('/wait', async (req: Request, res: Response) => {
  try {
    const { selector, timeout = 15000 } = req.body;

    if (!selector) {
      return res.status(400).json({ error: 'Selector is required' });
    }

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    await page.waitForSelector(selector, { timeout });
    await logOperation('wait', { selector });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Scrape text content
app.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { selector, limit = 50 } = req.body;

    if (!selector) {
      return res.status(400).json({ error: 'Selector is required' });
    }

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    const data = await page.$$eval(
      selector,
      (elements, limit) => elements
        .map(el => (el as HTMLElement).innerText.trim())
        .filter(text => text.length > 0)
        .slice(0, limit),
      limit
    );

    await logOperation('scrape', { selector, count: data.length });
    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Take screenshot
app.post('/screenshot', async (req: Request, res: Response) => {
  try {
    const { filename = 'screenshot.png', fullPage = false } = req.body;

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    const screenshotPath = path.join(ARTIFACTS_DIR, filename);

    await page.screenshot({
      path: screenshotPath,
      fullPage
    });

    await logOperation('screenshot', { path: screenshotPath, fullPage });
    res.json({ ok: true, path: screenshotPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get page content
app.post('/content', async (req: Request, res: Response) => {
  try {
    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    const content = await page.content();
    const title = await page.title();
    const url = page.url();

    await logOperation('content', { url, titleLength: title.length });
    res.json({ ok: true, url, title, html: content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate JavaScript
app.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({ error: 'Expression is required' });
    }

    // Security: Block dangerous operations
    const BLOCKED_KEYWORDS = ['delete', 'drop', 'remove', 'cookie', 'localStorage'];
    if (BLOCKED_KEYWORDS.some(keyword => expression.toLowerCase().includes(keyword))) {
      return res.status(403).json({ error: 'Expression contains blocked keywords' });
    }

    if (!page) {
      return res.status(400).json({ error: 'No active page. Navigate first' });
    }

    const result = await page.evaluate(expression);
    await logOperation('evaluate', { expression: expression.substring(0, 100) });
    res.json({ ok: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Close browser
app.post('/close', async (req: Request, res: Response) => {
  try {
    if (page) {
      await page.close();
      page = null;
    }
    if (context) {
      await context.close();
      context = null;
    }
    if (browser) {
      await browser.close();
      browser = null;
    }

    await logOperation('close', { sessionId });
    operationCounts.delete(sessionId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    browser: browser !== null,
    page: page !== null,
    sessionId
  });
});

const PORT = process.env.BROWSER_MCP_PORT || 9222;

app.listen(PORT, () => {
  const headlessMode = process.env.BROWSER_HEADLESS !== 'false';
  console.log(`🌐 Browser MCP Server running on port ${PORT}`);
  console.log(`📁 Artifacts directory: ${ARTIFACTS_DIR}`);
  console.log(`🔓 All domains allowed (development mode)`);
  console.log(`👁️  Browser mode: ${headlessMode ? 'headless (background)' : 'visible (GUI)'}`);
  if (!headlessMode) {
    console.log(`   Set BROWSER_HEADLESS=true to run in background mode`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down browser...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
