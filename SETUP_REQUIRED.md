# Why You Need to Configure a Google Client ID

## The Short Answer

**You need to do a ONE-TIME, 5-minute setup to get your Google Client ID.** After that, you never have to configure anything again.

## Why Can't I Just Sign In?

Google's OAuth system requires every application to have a **Client ID** - this is how Google identifies your app and handles security. It's similar to how you need an app to have a package name or a website needs a domain name.

**This is not something we built into the app - it's a requirement from Google.**

## What You Need to Do (5 minutes)

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Create a project** (if you don't have one)
3. **Enable Google Drive API** (click a button)
4. **Get a Client ID** (copy/paste)
5. **Add it to your `.env` file**

## Full Instructions

See **HOW_TO_GET_GOOGLE_CREDENTIALS.md** for step-by-step screenshots.

## After Setup

Once you've added your Client ID to `.env`:
- ✅ You can sign in with Google
- ✅ Your data syncs to Google Drive
- ✅ You'll never have to configure anything again
- ✅ Your stories are safe even if you clear browser cache
- ✅ You can access your work from any device

## Production Deployment

If you're building this for other users to use, you'll need to:
1. Create a Client ID for your domain
2. Add that domain to the authorized origins
3. Users will then be able to sign in with their own Google accounts

## Why Not Bake It Into the Code?

Each developer/domain needs their own Client ID because:
- Client IDs are tied to authorized domains (security)
- For localhost dev: tied to your specific ports
- For production: tied to your domain
- Sharing one Client ID across domains isn't secure or practical

**Bottom line:** Google requires this for security. It's a 5-minute one-time setup that saves your data forever.

