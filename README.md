# Holm Investing Solutions

A simple web app where users can create an account, log in, and view current stock recommendations (buy/sell).

## Features

- Header with Home and Stocks navigation
- Admin page to add, edit, and delete stock recommendations
- Home page with weekly recommendation update message
- Stocks page with protected buy/sell recommendation list
- Top-right Log In / Sign Out button
- User registration and login with name + email (as username) + password
- Session-based authentication
- Seeded recommendations available on first run

## Tech Stack

- Node.js + Express
- SQLite (`better-sqlite3`)
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

## Notes

- Default session secret is development-only. For production, set `SESSION_SECRET`.
- To control admin access, set `ADMIN_EMAIL` (single) or `ADMIN_EMAILS` (comma-separated).
- If no admin env var is set, default admin email is `austinrayholm@yahoo.com`.
- The app seeds/updates a default admin user on startup:
	- Name: `ADMIN2073`
	- Email: `austinrayholm@yahoo.com`
	- Password: `Atlantic73!`
- Local database is stored at `data/app.db` and is ignored by git.