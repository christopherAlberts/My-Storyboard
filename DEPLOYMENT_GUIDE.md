# Deploying Storyboard for Multiple Users

## How It Works

1. **You (Developer)** - Set up the Client ID ONCE
2. **Your Users** - Just sign in with their Google accounts (no setup needed!)

## Deploying Your App

### Step 1: Update Google Cloud Console

1. Go to your Google Cloud Console project
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add your production domain:
   - `https://your-domain.com`
   - `https://www.your-domain.com` (if using www)
5. Under **Authorized redirect URIs**, add:
   - `https://your-domain.com`
6. Save changes

### Step 2: Update Environment Variables

In your production hosting platform (Vercel, Netlify, etc.), add:

```env
VITE_GOOGLE_CLIENT_ID=your_production_client_id_here
```

### Step 3: Deploy

Deploy your app to your hosting platform.

### Step 4: Users Just Sign In!

Your users will:
1. Open your app
2. Click "Sign in with Google"
3. Use their own Google account
4. Their data saves to THEIR Google Drive
5. No setup or configuration needed!

## What Each User Gets

- ✅ Access to their own Google Drive
- ✅ Secure data storage
- ✅ Works on any device they're signed into Google on
- ✅ Automatic cloud backup
- ✅ No risk of data loss

## Example Workflow

**Sarah (User 1):**
1. Opens your storyboard app
2. Clicks "Sign in with Google"
3. Signs in as sarah@gmail.com
4. Her story "The Mystery Novel" is saved to HER Google Drive

**Mike (User 2):**
1. Opens your storyboard app
2. Clicks "Sign in with Google"
3. Signs in as mike@company.com
4. His story "Sci-Fi Adventure" is saved to HIS Google Drive

**Both see different data** because they're signed into different Google accounts!

## Testing Before Production

1. Use localhost for development
2. Test with your Google account
3. Test with a test user account
4. Deploy to production
5. Test with real users

## Important Notes

- **You never see user data** - it all goes to their own Google Drives
- **Each user's data is private** - they only see their own projects
- **No backend needed** - Everything runs client-side with Google Drive API
- **Completely secure** - Google handles all authentication
