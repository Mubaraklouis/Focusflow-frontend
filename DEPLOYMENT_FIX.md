# Deployment Fix Guide

## Problem
Registration works locally but fails on Vercel with 404 errors for `/sanctum/csrf-cookie` and `/api/user/register`.

## Root Cause
The `NUXT_USERS_API_URL` environment variable is not configured in Vercel, causing the app to make requests to itself instead of the Laravel backend.

## Solution

### 1. Configure Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `focusflow-frontend`
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variable:
   - **Name**: `NUXT_USERS_API_URL`
   - **Value**: `http://ec2-56-228-36-165.eu-north-1.compute.amazonaws.com`
   - **Environments**: Check all (Production, Preview, Development)
5. Click **Save**

### 2. Configure Laravel CORS (Backend)

Your Laravel backend needs to allow requests from your Vercel domain. Update your Laravel `config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => [
        'http://localhost:3000',
        'https://focusfllow.vercel.app',  // Add your Vercel domain
        'https://*.vercel.app',            // Allow all preview deployments
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,  // IMPORTANT: Must be true for Sanctum
];
```

### 3. Configure Laravel Session (Backend)

Update your Laravel `.env` file:

```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=.vercel.app  # Allow cookies across subdomains
SESSION_SECURE_COOKIE=true  # Required for HTTPS
SANCTUM_STATEFUL_DOMAINS=focusfllow.vercel.app,localhost:3000
```

### 4. Redeploy

After making these changes:
1. **Redeploy your Nuxt app** on Vercel (it will pick up the new environment variable)
2. **Restart your Laravel backend** to apply the CORS and session changes

### 5. Verify

Test the registration flow on your deployed Vercel app:
1. Open browser DevTools → Network tab
2. Try to register
3. Check that requests go to `http://ec2-56-228-36-165.eu-north-1.compute.amazonaws.com` (not `focusfllow.vercel.app`)

## Additional Notes

### HTTPS Consideration
Your Laravel backend is using HTTP (`http://ec2-...`), but Vercel uses HTTPS. Some browsers may block mixed content (HTTPS → HTTP). Consider:
- Setting up HTTPS on your Laravel backend (recommended)
- Or use a reverse proxy

### Alternative: Use HTTPS for Laravel
If you want to use HTTPS for your Laravel backend:
1. Set up SSL certificate on your EC2 instance
2. Update `NUXT_USERS_API_URL` to use `https://`

## Troubleshooting

If it still doesn't work:

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment → View Function Logs
   - Look for errors in the server-side API routes

2. **Check Browser Console**:
   - Look for CORS errors
   - Verify the request URL is correct

3. **Test the Laravel Backend Directly**:
   ```bash
   curl -X POST http://ec2-56-228-36-165.eu-north-1.compute.amazonaws.com/sanctum/csrf-cookie
   ```

4. **Verify Environment Variable**:
   - In Vercel, check that the variable is actually set
   - You can add a temporary console.log in your server API to verify
