# Holm Investing Solutions

A simple web app where users can create an account, log in, and view current Stock Insights (buy/sell).

## Features

- Header with Home and Stocks navigation
- Admin page to add, edit, and delete Stock Insights
- Home page with weekly recommendation update message
- Stocks page with protected buy/sell recommendation list
- Top-right Log In / Sign Out button
- User registration and login with name + email (as username) + password
- Session-based authentication
- Seeded recommendations available on first run

## Tech Stack

- Node.js + Express
- Supabase (Postgres)
- Plain HTML/CSS/JavaScript frontend

## Run Locally

1. Install dependencies:

	```bash
	npm install
	```

2. Start the server:

	```bash
	npm start
	```

3. Open in your browser:

	```
	http://localhost:3000
	```

## Deployment Workflow

For a safe process to preview changes before they go live, see:

- [DEPLOYMENT_WORKFLOW.md](DEPLOYMENT_WORKFLOW.md)

## Notes

- Default session secret is development-only. For production, set `SESSION_SECRET`.
- Supabase config can be set with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
- For server-side writes (users, recommendations, sessions), prefer `SUPABASE_SERVICE_ROLE_KEY` so backend operations are authorized.
- Run [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) in the Supabase SQL editor to create required tables (`public.users`, `public.recommendations`, `public.sessions`).
- Passwords are stored as bcrypt hashes (`password_hash`), never plaintext.
- To control admin access, set `ADMIN_EMAIL` (single) or `ADMIN_EMAILS` (comma-separated).
- If no admin env var is set, default admin email is `austinrayholm@yahoo.com`.
- The app seeds/updates a default admin user on startup:
	- Name: `ADMIN2073`
	- Email: `austinrayholm@yahoo.com`
	- Password: `Atlantic73!`