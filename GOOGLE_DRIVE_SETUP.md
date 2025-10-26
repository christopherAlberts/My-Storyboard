# Google Drive Sync Setup Guide

This guide will help you set up Google Drive synchronization for your Storyboard project.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Enter a project name (e.g., "Storyboard App")
4. Click "Create"

### 2. Enable Google Drive API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required information (app name, support email, etc.)
   - Add your email to test users
   - Save and continue through the scopes (keep defaults)
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Storyboard Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (if using different port)
     - Add your production domain when ready
   - Authorized redirect URIs:
     - `http://localhost:5173` (or your dev URL)
   - Click **Create**
5. Copy your **Client ID** (you'll need this later)

### 4. Create API Key

1. Still in **Credentials**, click **Create Credentials** > **API Key**
2. Copy your **API Key**
3. (Optional) Restrict the API key for security:
   - Click on the API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Drive API"
   - Save

### 5. Configure Environment Variables

Create or update your `.env` file in the project root:

```env
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

Replace:
- `your_api_key_here` with the API Key from step 4
- `your_client_id_here` with the Client ID from step 3

### 6. Restart Development Server

After adding the environment variables:

```bash
npm run dev
```

The app should now be able to connect to Google Drive!

## How to Use

1. **Connect to Google Drive**: In the Project Files view, click "Connect to Google Drive"
2. **Sign In**: You'll be prompted to sign in and authorize the app
3. **Sync Your Project**: Click "Sync to Google Drive" to upload your project
4. **Access Your Data**: Your project will be stored in a folder on your Google Drive
5. **Download**: Click "Download" to retrieve your project from Google Drive

## Project Structure on Google Drive

When you sync a project, the app creates:

```
My Storyboard Project/
├── My Storyboard Project_data.json  (Complete project database)
├── document_title_1.html           (Individual documents)
├── document_title_2.html
└── ...
```

## Security Notes

- The OAuth flow ensures only you can access your data
- All data is stored in your personal Google Drive
- You can revoke access anytime from Google Account settings
- API keys are restricted to Google Drive API only

## Troubleshooting

### "API not configured" error
- Make sure you've added the environment variables to `.env`
- Restart your development server after adding variables

### "Failed to sign in" error
- Check that your Client ID is correct
- Verify authorized origins in Google Cloud Console
- Make sure you're using the correct redirect URI

### "Not authenticated" error
- Click "Connect to Google Drive" first
- Make sure you've completed the OAuth consent screen setup

## Production Deployment

For production:

1. Update authorized origins in Google Cloud Console to include your production domain
2. Update redirect URIs to your production domain
3. Consider setting up additional API key restrictions
4. Use environment variables in your hosting platform

## Revoking Access

To revoke access to your Google Drive:

1. Go to your [Google Account security settings](https://myaccount.google.com/permissions)
2. Find "Storyboard" in your connected apps
3. Click "Revoke access"

