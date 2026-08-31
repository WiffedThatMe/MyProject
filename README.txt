Coupon Game Plan — Kroger Connect

Upload index.html, styles.css, app.js and the full api folder to the GitHub repository root.

ONE-TIME KROGER SETUP
1. Create/sign in to a Kroger Developer account at https://developer.kroger.com
2. Register a Production application and enable the Public API products you need.
3. Add this exact redirect URL to the Kroger application:
   https://my-project-tan-gamma-89.vercel.app/api/kroger/callback
4. In Vercel Project Settings > Environment Variables add:
   KROGER_CLIENT_ID = your Kroger app client ID
   KROGER_CLIENT_SECRET = your Kroger app client secret
   KROGER_SESSION_SECRET = a long random secret (32+ random characters)
5. Apply those variables to Production and redeploy.
6. Open Coupon Game Plan and press Connect Kroger.

SECURITY
Your Kroger password is entered only on Kroger's authorization page. Coupon Game Plan stores the OAuth session in an encrypted HttpOnly cookie; the Kroger client secret stays server-side in Vercel environment variables.
