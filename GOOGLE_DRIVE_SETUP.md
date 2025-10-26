# Google Drive Sync - Simplified Setup Guide

Google Drive sync now uses OAuth authentication, allowing you to securely access your own Google Drive account without sharing credentials with others.

## Quick Start (For Users)

If you want to use Google Drive sync, you just need to set up **one credential**: your OAuth Client ID.

### Setup Steps

#### 1. Get Your Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google Drive API:
   - Navigate to **APIs & Services** > **Library**
   - Search for "Google Drive API" and click **Enable**

#### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type and click **Create**
3. Fill in the required information:
   - App name: "Storyboard App"
   - User support email: your email
   - Developer contact information: your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
6. Search for and select `.../auth/drive.file` scope
7. Click **Update**, then **Save and Continue**
8. Add yourself as a test user (or skip for development)
9. Click **Save and Continue**, then **Back to Dashboard**

#### 3. Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Name it "Storyboard App"
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (or your dev server URL)
   - `https://your-domain.com` (for production)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173` (or your dev server URL)
   - `https://your-domain.com` (for production)
7. Click **Create**
8. **Copy your Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

#### 4. Add to Your Project

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

**Note:** You no longer need an API Key! The OAuth flow handles everything.

#### 5. Restart Development Server

```bash
npm run dev
```

### Using Google Drive Sync

Once configured:

1. Click **"Sign in with Google"** button in the Project Files view
2. Authorize the app to access Google Drive
3. Your project will sync to a folder in your Google Drive
4. Click **"Sync"** to upload/download your project data

## How It Works

- **Secure OAuth Flow**: Users authenticate with their own Google account
- **No Shared Credentials**: Each user uses their own credentials
- **Data Privacy**: All data is stored in your personal Google Drive
- **Easy Setup**: Just one environment variable needed

## What Changed?

Previously, you needed both an API Key and Client ID. Now you only need:
- ✅ `VITE_GOOGLE_CLIENT_ID` (required)

The API key is no longer needed because OAuth handles authentication directly.

## Troubleshooting

**"Google Drive OAuth client not initialized"**
- Make sure you've added `VITE_GOOGLE_CLIENT_ID` to your `.env` file
- Restart the development server after adding the variable
- Verify the Client ID is correct (no extra spaces or quotes)

**"Failed to sign in"**
- Check that authorized origins include your current URL (check the port)
- Make sure you added your email as a test user in OAuth consent screen
- Try clearing browser cache and cookies

**"Sign-in timeout"**
- This might happen on first sign-in
- Try again after a few moments
- Check browser console for detailed error messages

## Production Deployment

For production:

1. Update the OAuth client in Google Cloud Console:
   - Add your production domain to **Authorized JavaScript origins**
   - Add your production domain to **Authorized redirect URIs**
2. Update your environment variables in your hosting platform
3. Set `VITE_GOOGLE_CLIENT_ID` to your production credentials
4. Rebuild and deploy your app

## Revoking Access

To stop the app from accessing your Google Drive:

1. Go to [Google Account Security Settings](https://myaccount.google.com/permissions)
2. Find "Storyboard App" in the list
3. Click **Revoke access**

Your data remains in your Google Drive, but the app can no longer access it.
