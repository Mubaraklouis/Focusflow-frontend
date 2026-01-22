# Email Verification API Documentation

This document describes the email verification process for the FocusFlow User Auth Service. Use this guide to implement email verification in your Nuxt frontend application.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow with Email Verification](#authentication-flow-with-email-verification)
- [API Endpoints](#api-endpoints)
- [Response Formats](#response-formats)
- [Frontend Implementation Guide](#frontend-implementation-guide)
- [Error Handling](#error-handling)
- [Environment Configuration](#environment-configuration)

---

## Overview

The FocusFlow authentication service uses Laravel's built-in email verification system with Sanctum for SPA authentication. The email verification flow consists of:

1. **User Registration** - Triggers automatic verification email
2. **Resend Verification Email** - Manual resend endpoint
3. **Email Verification** - User clicks link in email to verify
4. **Verification Status Check** - Check if user's email is verified

---

## Authentication Flow with Email Verification

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Signs    │────▶│  Backend Sends  │────▶│  User Receives  │
│      Up         │     │ Verification    │     │     Email       │
└─────────────────┘     │     Email       │     └────────┬────────┘
                        └─────────────────┘              │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend Gets  │◀────│ Backend Marks   │◀────│  User Clicks    │
│ ?verified=1     │     │ Email Verified  │     │  Verify Link    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## API Endpoints

### 1. Get CSRF Cookie (Required Before All Auth Requests)

Before making any authentication requests, you must first obtain a CSRF token.

**Endpoint:** `GET /sanctum/csrf-cookie`

**Headers:**
```
Accept: application/json
Referer: http://localhost:3000
Origin: http://localhost:3000
```

**Response:** Sets `XSRF-TOKEN` cookie

---

### 2. User Registration

Registers a new user and automatically sends a verification email.

**Endpoint:** `POST /register`

**Headers:**
```
Content-Type: application/json
Accept: application/json
X-XSRF-TOKEN: <token-from-cookie>
Referer: http://localhost:3000
Origin: http://localhost:3000
```

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Success Response (201):**
```json
{
    "status": "success",
    "message": "Registration successful",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    },
    "user_id": 1
}
```

**Note:** Upon successful registration:
- User is automatically logged in
- A verification email is sent to the user's email address
- The `email_verified_at` field will be `null` until verified

---

### 3. Resend Verification Email

Resends the verification email to the authenticated user.

**Endpoint:** `POST /email/verification-notification`

**Headers:**
```
Content-Type: application/json
Accept: application/json
X-XSRF-TOKEN: <token-from-cookie>
Referer: http://localhost:3000
Origin: http://localhost:3000
```

**Rate Limiting:** 6 requests per minute

**Success Response (200):**
```json
{
    "status": "verification-link-sent"
}
```

**Already Verified Response:**
Redirects to `/dashboard`

---

### 4. Email Verification (User Clicks Link)

This endpoint is called when the user clicks the verification link in their email.

**Endpoint:** `GET /verify-email/{id}/{hash}`

**URL Parameters:**
- `id` - User ID
- `hash` - SHA1 hash of the user's email

**Query Parameters (auto-included in signed URL):**
- `expires` - Expiration timestamp
- `signature` - URL signature for validation

**Middleware:** `signed`, `throttle:6,1`

**Rate Limiting:** 6 requests per minute

**Success Response:**
Redirects to: `{FRONTEND_URL}/dashboard?verified=1`

**Example Redirect URL:**
```
http://localhost:3000/dashboard?verified=1
```

**Note:** The verification link is a signed URL that:
- Contains the user ID and email hash
- Has a 60-minute expiration
- Cannot be tampered with (signature validation)

---

### 5. Get User Profile (Check Verification Status)

Retrieve the current user's profile including verification status.

**Endpoint:** `GET /api/user`

**Headers:**
```
Accept: application/json
X-XSRF-TOKEN: <token-from-cookie>
Referer: http://localhost:3000
Origin: http://localhost:3000
```

**Authentication:** Required (Sanctum session)

**Success Response (200):**
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "username": "johndoe",
        "bio": null,
        "avatar": null,
        "location": null,
        "website": null,
        "email_verified_at": "2026-01-22T10:30:00.000000Z",
        "created_at": "2026-01-22T10:00:00.000000Z",
        "updated_at": "2026-01-22T10:30:00.000000Z"
    }
}
```

**Verification Status:**
- `email_verified_at: null` = Email NOT verified
- `email_verified_at: "2026-01-22T10:30:00.000000Z"` = Email verified

---

### 6. Get User by ID

Retrieve a specific user's profile by ID.

**Endpoint:** `GET /api/user/{id}`

**Success Response (200):**
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "username": "johndoe",
        "bio": null,
        "avatar": null,
        "location": null,
        "website": null,
        "email_verified_at": "2026-01-22T10:30:00.000000Z",
        "created_at": "2026-01-22T10:00:00.000000Z",
        "updated_at": "2026-01-22T10:30:00.000000Z"
    }
}
```

---

## Response Formats

### Verification Required Error (409)

When accessing protected routes that require email verification:

```json
{
    "message": "Your email address is not verified."
}
```

**HTTP Status:** 409 Conflict

---

## Frontend Implementation Guide

### Nuxt 3 Implementation Example

#### 1. Configure API Client (`composables/useApi.ts`)

```typescript
export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl || 'http://localhost:8000'

  const getCsrfToken = async () => {
    await $fetch('/sanctum/csrf-cookie', {
      baseURL,
      credentials: 'include',
    })
  }

  const api = $fetch.create({
    baseURL,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    async onRequest({ options }) {
      // Get XSRF token from cookie
      const xsrfToken = useCookie('XSRF-TOKEN')
      if (xsrfToken.value) {
        options.headers = {
          ...options.headers,
          'X-XSRF-TOKEN': xsrfToken.value,
        }
      }
    },
  })

  return { api, getCsrfToken, baseURL }
}
```

#### 2. Auth Composable (`composables/useAuth.ts`)

```typescript
interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  // ... other fields
}

export const useAuth = () => {
  const { api, getCsrfToken } = useApi()
  const user = useState<User | null>('user', () => null)
  const isEmailVerified = computed(() => !!user.value?.email_verified_at)

  const register = async (data: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => {
    await getCsrfToken()
    const response = await api('/register', {
      method: 'POST',
      body: data,
    })
    return response
  }

  const resendVerificationEmail = async () => {
    await getCsrfToken()
    const response = await api('/email/verification-notification', {
      method: 'POST',
    })
    return response
  }

  const fetchUser = async () => {
    try {
      const response = await api('/api/user')
      user.value = response.data
      return response.data
    } catch (error) {
      user.value = null
      throw error
    }
  }

  return {
    user,
    isEmailVerified,
    register,
    resendVerificationEmail,
    fetchUser,
  }
}
```

#### 3. Email Verification Page (`pages/verify-email.vue`)

```vue
<template>
  <div class="verify-email-container">
    <div v-if="!isEmailVerified">
      <h1>Verify Your Email</h1>
      <p>
        We've sent a verification link to <strong>{{ user?.email }}</strong>.
        Please check your inbox and click the link to verify your email address.
      </p>
      
      <div v-if="message" :class="['alert', messageType]">
        {{ message }}
      </div>

      <button 
        @click="resendEmail" 
        :disabled="loading || cooldown > 0"
        class="resend-button"
      >
        <span v-if="loading">Sending...</span>
        <span v-else-if="cooldown > 0">Resend in {{ cooldown }}s</span>
        <span v-else>Resend Verification Email</span>
      </button>
    </div>

    <div v-else>
      <h1>Email Verified!</h1>
      <p>Your email has been verified successfully.</p>
      <NuxtLink to="/dashboard">Go to Dashboard</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isEmailVerified, resendVerificationEmail, fetchUser } = useAuth()

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const cooldown = ref(0)

let cooldownInterval: NodeJS.Timer | null = null

const resendEmail = async () => {
  if (loading.value || cooldown.value > 0) return

  loading.value = true
  message.value = ''

  try {
    await resendVerificationEmail()
    message.value = 'Verification email sent! Please check your inbox.'
    messageType.value = 'success'
    
    // Start cooldown (60 seconds)
    cooldown.value = 60
    cooldownInterval = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0 && cooldownInterval) {
        clearInterval(cooldownInterval)
      }
    }, 1000)
  } catch (error: any) {
    message.value = error.data?.message || 'Failed to send verification email.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Poll for verification status
const pollVerificationStatus = async () => {
  const interval = setInterval(async () => {
    try {
      await fetchUser()
      if (isEmailVerified.value) {
        clearInterval(interval)
      }
    } catch (error) {
      // Handle error silently
    }
  }, 5000) // Check every 5 seconds

  // Clean up on unmount
  onUnmounted(() => clearInterval(interval))
}

onMounted(() => {
  fetchUser()
  pollVerificationStatus()
})
</script>
```

#### 4. Handle Verification Redirect (`pages/dashboard.vue`)

```vue
<script setup lang="ts">
const route = useRoute()
const { fetchUser } = useAuth()

onMounted(async () => {
  // Check if user just verified their email
  if (route.query.verified === '1') {
    // Refresh user data to get updated verification status
    await fetchUser()
    
    // Show success notification
    // useToast().success('Email verified successfully!')
    
    // Clean up URL
    navigateTo('/dashboard', { replace: true })
  }
})
</script>
```

#### 5. Protected Route Middleware (`middleware/verified.ts`)

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isEmailVerified, fetchUser } = useAuth()

  // Fetch user if not already loaded
  if (!user.value) {
    try {
      await fetchUser()
    } catch {
      return navigateTo('/login')
    }
  }

  // Check if email is verified
  if (!isEmailVerified.value) {
    return navigateTo('/verify-email')
  }
})
```

#### 6. Nuxt Config (`nuxt.config.ts`)

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
    },
  },
})
```

---

## Error Handling

### Common Error Responses

| HTTP Status | Scenario | Response |
|-------------|----------|----------|
| 401 | Unauthenticated | `{"message": "Unauthenticated."}` |
| 403 | Invalid signature | `{"message": "Invalid signature."}` |
| 409 | Email not verified | `{"message": "Your email address is not verified."}` |
| 419 | CSRF token mismatch | `{"message": "CSRF token mismatch."}` |
| 429 | Rate limit exceeded | `{"message": "Too Many Attempts."}` |

### Handling 409 (Email Not Verified)

When you receive a 409 error with message "Your email address is not verified", redirect the user to the email verification page:

```typescript
// In your API error handler
if (error.status === 409 && error.data?.message?.includes('not verified')) {
  navigateTo('/verify-email')
}
```

---

## Environment Configuration

### Backend (.env)

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Mail configuration for verification emails
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@focusflow.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Frontend (.env)

```env
API_BASE_URL=http://localhost:8000
```

---

## Flow Summary

1. **Registration**
   - User submits registration form
   - Backend creates user and sends verification email
   - User is logged in but `email_verified_at` is `null`

2. **Verification Required**
   - User tries to access protected route
   - Backend returns 409 if email not verified
   - Frontend redirects to verification page

3. **Resend Email**
   - User clicks "Resend" button
   - Frontend calls `POST /email/verification-notification`
   - New email is sent (rate limited to 6/minute)

4. **Email Verification**
   - User clicks link in email
   - Backend validates signed URL
   - Backend marks email as verified
   - User is redirected to `{FRONTEND_URL}/dashboard?verified=1`

5. **Post-Verification**
   - Frontend detects `?verified=1` query parameter
   - Frontend refreshes user data
   - `email_verified_at` is now populated

---

## Testing

You can test the email verification flow using:

1. **Mailpit** (local development) - Catches all outgoing emails
2. **Mailtrap** - For staging environments
3. **Your actual email** - For production testing

### Bruno Collection

The Bruno collection included in this repository contains pre-configured requests for testing the authentication flow. See `bruno-collection/README.md` for setup instructions.

---

## Security Considerations

1. **Signed URLs** - Verification links are cryptographically signed and cannot be forged
2. **Expiration** - Links expire after 60 minutes
3. **Rate Limiting** - Verification endpoints are rate-limited (6 requests/minute)
4. **HTTPS** - Always use HTTPS in production for verification links
5. **CORS** - Backend only accepts requests from configured frontend URL

---

## Related Documentation

- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Quick API reference
- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - Testing guide
- [README.md](./README.md) - Main documentation
