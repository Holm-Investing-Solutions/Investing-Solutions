# Development Environment Setup

## Overview

This application uses **environment variables** to configure Supabase connections. This allows you to:
- Use a **separate Supabase dev project** for local development
- Deploy with **different credentials** for production
- **Never hardcode** sensitive credentials in your code

## Setup Steps

### 1. Install Dependencies

First, install the project dependencies including `dotenv`:

```bash
npm install
```

### 2. Create Your `.env` File

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Get Your Supabase Credentials

For your **local development** Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **development project**
3. Navigate to **Settings > API**
4. Copy the following values:

| Variable | Location | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Project URL | API endpoint |
| `SUPABASE_ANON_KEY` | `anon` public | Frontend API key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret | Backend admin key (KEEP SECRET!) |

### 4. Fill in Your `.env` File

Edit `.env` with your development credentials:

```env
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-xxxx
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-xxxx
PORT=3000
```

### 5. Start Your Development Server

```bash
npm run dev
```

The server will:
- Load environment variables from `.env`
- Validate that all required variables are set
- Display `✓ All required environment variables loaded successfully`
- Connect to your **development Supabase project**

## Environment Variable Requirements

The application requires these environment variables:

| Variable | Required | Default | Usage |
|----------|----------|---------|-------|
| `SUPABASE_URL` | **Yes** | None | Supabase project URL |
| `SUPABASE_ANON_KEY` | **Yes** | None | Frontend API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | None | Backend admin operations |
| `PORT` | No | 3000 | Express server port |

If any required variable is missing, the server will exit with an error message.

## Code Flow: How Environment Variables Are Loaded

### 1. **dotenv** Loads `.env` File

In [server.js](server.js#L1-L2), the very first thing that happens:

```javascript
// Load environment variables from .env file FIRST
require("dotenv").config();
```

This must be **before any other require statements** that might use environment variables.

### 2. **Validation Happens**

[server.js](server.js#L11-L35) validates that all required variables are present:

```javascript
const REQUIRED_ENV_VARS = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const missingVars = Object.entries(REQUIRED_ENV_VARS)
  .filter(([_, value]) => !value || String(value).trim() === "")
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("ERROR: Missing required environment variables:", missingVars.join(", "));
  process.exit(1);
}
```

### 3. **Supabase Admin Client Uses Env Vars**

In [supabaseAdmin.js](supabaseAdmin.js#L14-L18), the Supabase client is initialized:

```javascript
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
```

No credentials are hardcoded. Everything comes from environment variables.

## Multi-Environment Setup

### Development Environment (.env)

```env
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_ANON_KEY=dev-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=dev-service-key-here
PORT=3000
```

### Production Environment

When deploying (e.g., to Railway, Render, or Heroku):

1. Set environment variables in your hosting provider's dashboard
2. Use your **production Supabase project** credentials
3. Do **NOT** use the `.env` file (it won't be deployed)

**Example for Railway:**
- Go to Variables in the Railway project
- Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`

## Security Best Practices

### ✅ DO:
- ✓ Keep `.env` in `.gitignore` (already configured)
- ✓ Use different Supabase projects for dev vs production
- ✓ Store `SUPABASE_SERVICE_ROLE_KEY` securely (never commit)
- ✓ Use environment variables everywhere
- ✓ Validate required variables on startup

### ❌ DON'T:
- ✗ Hardcode credentials in source code
- ✗ Commit `.env` files to git
- ✗ Share your `SUPABASE_SERVICE_ROLE_KEY`
- ✗ Use production credentials in development
- ✗ Expose secrets in client-side code (use only `SUPABASE_ANON_KEY` on frontend)

## Troubleshooting

### Error: "SUPABASE_URL is missing or empty"

**Problem:** The `.env` file doesn't exist or is missing the variable.

**Solution:**
1. Verify `.env` file exists: `ls -la .env`
2. Recreate it: `cp .env.example .env`
3. Fill in your actual Supabase credentials

### Error: "SUPABASE_SERVICE_ROLE_KEY is missing"

**Problem:** The service role key in `.env` is empty or incorrect.

**Solution:**
1. Go to Supabase Dashboard > Settings > API
2. Under "Service role secret", click "Copy"
3. Paste into `.env` as `SUPABASE_SERVICE_ROLE_KEY=...`

### Application still using wrong credentials

**Problem:** Server didn't reload environment variables.

**Solution:**
- Restart the server: `npm run dev`
- The server loads `.env` only on startup

### Different dev machine not connecting

**Problem:** Each developer needs their own `.env` file.

**Solution:**
- Each developer should:
  1. Copy `.env.example` to `.env`
  2. Fill in their own Supabase project credentials
  3. Never commit their `.env` file

## Next Steps

1. **Install dependencies:** `npm install`
2. **Create `.env` file:** `cp .env.example .env`
3. **Add your credentials:** Edit `.env` with your dev Supabase project details
4. **Start server:** `npm run dev`
5. **Verify:** You should see ✓ All required environment variables loaded successfully

Your local development environment is now configured to use a separate Supabase dev project while keeping production credentials secure! 🎉
