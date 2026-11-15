This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Google Drive Cloud Backup Configuration (OAuth2)

Automated database replication and on-demand snapshots utilize the nursery owner's Google Drive storage (My Drive).

### Required Environment Variables
The following environment variables (names only) are required in `.env`:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_BACKUP_FOLDER_ID`
- `CRON_SECRET`

### Acquiring / Refreshing the OAuth2 Token
To generate or refresh `GOOGLE_OAUTH_REFRESH_TOKEN`:
1. Ensure `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set in `.env` (with authorized redirect URI `http://localhost:3001/oauth2callback` in your Google Cloud Console).
2. Run the token acquisition script:
   ```bash
   node scripts/get-refresh-token.js
   ```
3. Open the printed authorization URL in your browser, complete authentication with `bhartisgreenworld@gmail.com`, and grant Drive permissions.
4. The script will automatically save the persistent refresh token to `.env` and terminate cleanly.
