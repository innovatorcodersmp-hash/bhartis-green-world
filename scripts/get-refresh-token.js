/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file scripts/get-refresh-token.js
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built a standalone Node.js utility script to acquire a persistent Google OAuth2 refresh token.
 *    - Reads `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` from the project `.env`.
 *    - Generates offline consent URL with scope `https://www.googleapis.com/auth/drive` and `prompt=consent`.
 *    - Runs a temporary local HTTP server on port 3001 (`http://localhost:3001/oauth2callback`).
 *    - Exchanges authorization code for credentials, safely updates ONLY `GOOGLE_OAUTH_REFRESH_TOKEN` in `.env`,
 *      and shuts down automatically.
 *    - Zero secret leakage: Never prints tokens, codes, or credentials to the console.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills user request: "Create scripts/get-refresh-token.js (plain Node, no new dependencies if possible)...".
 *    - Enables nursery owner (`bhartisgreenworld@gmail.com`) to authenticate their personal Google account
 *      and utilize their own Google Drive storage quota for automated and manual database backups.
 * 
 * 3. WHAT WAS USED:
 *    - Node.js core modules (`http`, `url`, `fs`, `path`).
 *    - `googleapis` (`google.auth.OAuth2`).
 * 
 * 4. HOW IT WORKS:
 *    - Run `node scripts/get-refresh-token.js`.
 *    - Open the printed consent URL in the browser and complete the Google login.
 *    - The local callback server intercepts the response, updates `.env`, prints "Refresh token saved to .env",
 *      and closes gracefully.
 * 
 * ----------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { google } = require('googleapis');

// 1. Locate .env file safely
const candidatePaths = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'bhartis-green-world-erp', '.env'),
  path.resolve(__dirname, '..', 'bhartis-green-world-erp', '.env'),
];
const envPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];

if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found at ' + envPath);
  process.exit(1);
}

// 2. Read Client ID and Secret without echoing
const envContent = fs.readFileSync(envPath, 'utf8');

const clientIdMatch = envContent.match(/^GOOGLE_OAUTH_CLIENT_ID\s*=\s*["']?([^"'\r\n]+)["']?/m);
const clientSecretMatch = envContent.match(/^GOOGLE_OAUTH_CLIENT_SECRET\s*=\s*["']?([^"'\r\n]+)["']?/m);

const clientId = clientIdMatch ? clientIdMatch[1].trim() : '';
const clientSecret = clientSecretMatch ? clientSecretMatch[1].trim() : '';

if (!clientId || !clientSecret) {
  console.error('Error: GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be configured in .env before running this script.');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

// 3. Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

// 4. Generate Authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
});

console.log('\n================================================================================');
console.log("BHARTI'S GREEN WORLD ERP - GOOGLE DRIVE OAUTH2 AUTHORIZATION");
console.log('================================================================================\n');
console.log('Please open the following authorization URL in your web browser:\n');
console.log(authUrl);
console.log('\nWaiting for callback on http://localhost:3001/oauth2callback ...');
console.log('================================================================================\n');

// 5. Start temporary local server to capture callback code
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/oauth2callback') {
    const code = parsedUrl.query.code;
    const error = parsedUrl.query.error;

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FEF2F2;">
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #FECACA;">
          <h2 style="color: #991B1B;">Authorization Error</h2>
          <p>Google OAuth returned error: ${error}</p>
        </div>
      </body></html>`);
      console.error('Authorization failed with error:', error);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<html><body><h2>Missing authorization code</h2></body></html>');
      console.error('Error: No authorization code received in callback.');
      server.close();
      process.exit(1);
    }

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FFFBEB;">
          <div style="background: white; padding: 30px; border-radius: 8px; max-width: 540px; margin: 0 auto; border: 1px solid #FDE68A; border-top: 4px solid #D97706;">
            <h2 style="color: #B45309;">No Refresh Token Returned</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.5;">
              Google did not return a refresh token because this application was previously authorized.
            </p>
            <p style="color: #374151; font-size: 14px; line-height: 1.5;">
              Please visit <a href="https://myaccount.google.com/permissions" target="_blank" style="color: #1B4D3E; font-weight: bold;">myaccount.google.com/permissions</a>,
              remove access for this app, and run <code>node scripts/get-refresh-token.js</code> again.
            </p>
          </div>
        </body></html>`);

        console.error('No refresh token returned by Google. Please remove this app\'s access at https://myaccount.google.com/permissions and run the script again.');
        server.close();
        process.exit(1);
      }

      // Update ONLY GOOGLE_OAUTH_REFRESH_TOKEN in .env
      let currentEnv = fs.readFileSync(envPath, 'utf8');
      const tokenLine = `GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`;

      if (/^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m.test(currentEnv)) {
        currentEnv = currentEnv.replace(/^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m, tokenLine);
      } else {
        currentEnv += (currentEnv.endsWith('\n') ? '' : '\n') + `${tokenLine}\n`;
      }

      fs.writeFileSync(envPath, currentEnv, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #F4F7F5;">
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 520px; margin: 0 auto; border: 1px solid #E5E7EB; border-top: 4px solid #1B4D3E;">
          <h2 style="color: #1B4D3E; margin-bottom: 8px;">✓ Authorization Successful!</h2>
          <p style="color: #374151; font-size: 15px; margin-bottom: 12px;">Your Google Drive OAuth2 refresh token has been securely saved to .env.</p>
          <p style="color: #6B7280; font-size: 13px;">You can now safely close this browser tab.</p>
        </div>
      </body></html>`);

      console.log('Refresh token saved to .env');
      server.close();
      process.exit(0);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<html><body><h2>Token Exchange Error</h2><p>${err.message}</p></body></html>`);
      console.error('Token exchange error:', err.message);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: Port 3001 is already in use. Please free port 3001 and run this script again.');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(3001);
