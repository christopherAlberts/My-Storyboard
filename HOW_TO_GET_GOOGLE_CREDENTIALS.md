# How to Get Google OAuth Credentials

Follow these steps to get your `VITE_GOOGLE_CLIENT_ID` for Google Drive sync.

**Time:** 5 minutes  
**Good news:** You only need ONE credential (the OAuth Client ID). No API key needed!

## Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

## Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click **New Project**
3. Give it a name like "Storyboard App"
4. Click **Create**

## Step 3: Enable Google Drive API
1. In the left menu, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it
4. Click **Enable**

## Step 4: Create OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (for testing) and click **Create**
3. Fill in the required fields:
   - App name: "Storyboard App"
   - User support email: your email
   - Developer contact information: your email
   - App logo: optional
4. Click **Save and Continue**
5. On "Scopes": Click **Add or Remove Scopes**
6. Search for "drive.file" and select it (this is `.../auth/drive.file`)
7. Click **Update**, then **Save and Continue**
8. On "Test users" (if shown): Click **Add Users** and add your email
9. Click **Save and Continue**, then **Back to Dashboard**

## Step 5: Create OAuth Client ID
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: "Storyboard App"
5. Authorized JavaScript origins:
   - Add: `http://localhost:5173`
   - Add: `http://localhost:5174` (if you use different ports)
   - For production, add your domain: `https://your-domain.com`
6. Authorized redirect URIs:
   - Add: `http://localhost:5173`
   - Add: `http://localhost:5174`
   - For production: `https://your-domain.com`
7. Click **Create**
8. **COPY YOUR CLIENT ID** (it looks like `123456789-abc.apps.googleusercontent.com`)
   - This is your `VITE_GOOGLE_CLIENT_ID`

## Step 6: Add to Your Project
Create a file called `.env` in your project root (same folder as `package.json`):

```env
VITE_GOOGLE_CLIENT_ID=paste_your_client_id_here
```

**That's it!** You don't need an API key anymore.

## Step 7: Restart Your Dev Server
```bash
npm run dev
```

## Quick Checklist
- [ ] Created Google Cloud project
- [ ] Enabled Google Drive API
- [ ] Set up OAuth consent screen with `drive.file` scope
- [ ] Created OAuth Client ID
- [ ] Added localhost origins and redirect URIs
- [ ] Added client ID to `.env` file
- [ ] Restarted dev server

## How to Use

1. In your app, go to Project Files view
2. Click **"Sign in with Google"**
3. Authorize the app when prompted
4. You're ready to sync! 🎉

## What Changed?

Previously, you needed **two** credentials:
- ❌ API Key (no longer needed)
- ✅ Client ID (still needed)

Now you only need the OAuth Client ID. The OAuth flow handles authentication securely without exposing API keys.

## Troubleshooting

**"Google Drive OAuth client not initialized" error:**
- Make sure `.env` file is in the project root
- Check that the variable is named `VITE_GOOGLE_CLIENT_ID` (starts with `VITE_`)
- Restart dev server after adding `.env`
- Verify the client ID is correct (no extra spaces or quotes around it)

**"Failed to sign in" error:**
- Check that authorized origins in Google Cloud Console include your current port
  - Look at your terminal to see what port the dev server is using
  - Example: `http://localhost:5173` or `http://localhost:5174`
- Make sure you added your email as a test user in the OAuth consent screen
- Verify the client ID is correct
- Check browser console for detailed error messages

**"Sign-in timeout" error:**
- Check your browser console for popup blockers
- Make sure JavaScript is enabled
- Try a different browser
- Clear browser cache and cookies

**Still stuck?**
1. Check browser console for errors (F12 → Console tab)
2. Make sure Google Cloud Console project is selected
3. Verify Drive API is enabled in the library
4. Check that you copied the full client ID (no extra spaces at start/end)
5. Make sure the redirect URI exactly matches your current URL (including port)

