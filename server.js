const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const DEFAULT_ADMIN = {
  name: "ADMIN2073",
  email: "austinrayholm@yahoo.com",
  password: "Atlantic73!",
};

const LEGACY_DEFAULT_ADMIN_EMAILS = ["brodyholm73@gmail.com"];
const TERMS_VERSION = "1.1";

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    company TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('BUY', 'SELL', 'HOLD')),
    rationale TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function ensureHoldActionSupport() {
  const recommendationsTable = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'recommendations'")
    .get();

  const createSql = String(recommendationsTable?.sql || "");
  const hasBuySellOnlyConstraint = createSql.includes("CHECK(action IN ('BUY', 'SELL'))");
  if (!hasBuySellOnlyConstraint) {
    return;
  }

  const migrate = db.transaction(() => {
    db.exec(`
      CREATE TABLE recommendations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        company TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('BUY', 'SELL', 'HOLD')),
        rationale TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO recommendations_new (id, ticker, company, action, rationale, updated_at)
      SELECT id, ticker, company, action, rationale, updated_at
      FROM recommendations;

      DROP TABLE recommendations;
      ALTER TABLE recommendations_new RENAME TO recommendations;
    `);
  });

  migrate();
}

ensureHoldActionSupport();

function ensureRecommendationSectorSupport() {
  const recommendationColumns = db.prepare("PRAGMA table_info(recommendations)").all();
  const hasSectorColumn = recommendationColumns.some((column) => column.name === "sector");

  if (!hasSectorColumn) {
    db.exec("ALTER TABLE recommendations ADD COLUMN sector TEXT NOT NULL DEFAULT 'General'");
  }

  db.exec(
    "UPDATE recommendations SET sector = 'Unspecified' WHERE sector IS NULL OR trim(sector) = '' OR lower(sector) = 'general'"
  );

  const defaultSectorByTicker = {
    MSFT: "Technology",
    NVDA: "Technology",
    AAPL: "Technology",
    XOM: "Energy",
    AMZN: "Consumer Discretionary",
  };

  const updateSector = db.prepare(
    "UPDATE recommendations SET sector = ? WHERE ticker = ? AND (sector IS NULL OR trim(sector) = '' OR lower(sector) = 'general' OR sector = 'Unspecified')"
  );

  for (const [ticker, sector] of Object.entries(defaultSectorByTicker)) {
    updateSector.run(sector, ticker);
  }
}

ensureRecommendationSectorSupport();

function ensureRecommendationLockedChangeSupport() {
  const recommendationColumns = db.prepare("PRAGMA table_info(recommendations)").all();
  const hasLockedChangeColumn = recommendationColumns.some(
    (column) => column.name === "locked_change_percent"
  );

  if (!hasLockedChangeColumn) {
    db.exec("ALTER TABLE recommendations ADD COLUMN locked_change_percent REAL");
  }
}

ensureRecommendationLockedChangeSupport();

async function fetchSectorForTicker(ticker) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
        ticker
      )}?modules=assetProfile`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const sector = data?.quoteSummary?.result?.[0]?.assetProfile?.sector;
    const normalized = String(sector || "").trim();
    return normalized || null;
  } catch {
    return null;
  }
}

async function fetchChangePercentSinceDate(ticker, sinceDateText) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?range=max&interval=1d`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const sinceMs = new Date(String(sinceDateText || "")).getTime();

    if (!Number.isFinite(sinceMs) || !timestamps.length) {
      return null;
    }

    const history = [];
    for (let index = 0; index < timestamps.length; index += 1) {
      const close = closes[index];
      if (typeof close !== "number" || Number.isNaN(close)) {
        continue;
      }

      history.push({
        dateMs: timestamps[index] * 1000,
        close,
      });
    }

    if (!history.length) {
      return null;
    }

    const entryPoint = history.find((point) => point.dateMs >= sinceMs) || history[history.length - 1];
    const latestPoint = history[history.length - 1];

    if (!entryPoint || !latestPoint || entryPoint.close <= 0) {
      return null;
    }

    return ((latestPoint.close - entryPoint.close) / entryPoint.close) * 100;
  } catch {
    return null;
  }
}

async function enrichRecommendationSectors(stocks) {
  const updateSectorStatement = db.prepare(
    "UPDATE recommendations SET sector = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  );

  const result = await Promise.all(
    stocks.map(async (stock) => {
      const currentSector = String(stock.sector || "").trim();
      const isGenericSector =
        !currentSector ||
        currentSector.toLowerCase() === "general" ||
        currentSector === "Unspecified";

      if (!isGenericSector) {
        return stock;
      }

      const resolvedSector = await fetchSectorForTicker(stock.ticker);
      if (!resolvedSector) {
        return {
          ...stock,
          sector: "Unspecified",
        };
      }

      updateSectorStatement.run(resolvedSector, stock.id);
      return {
        ...stock,
        sector: resolvedSector,
      };
    })
  );

  return result;
}

const userColumns = db.prepare("PRAGMA table_info(users)").all();
const hasNameColumn = userColumns.some((column) => column.name === "name");
const hasEmailColumn = userColumns.some((column) => column.name === "email");
const hasLegacyUsernameColumn = userColumns.some((column) => column.name === "username");

if (!hasNameColumn) {
  db.exec("ALTER TABLE users ADD COLUMN name TEXT");
}

if (!hasEmailColumn) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  db.exec("UPDATE users SET email = username WHERE email IS NULL AND username IS NOT NULL");
}

function ensureUserTermsAcceptanceSupport() {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasTermsAcceptedAtColumn = columns.some((column) => column.name === "terms_accepted_at");
  const hasTermsVersionColumn = columns.some((column) => column.name === "terms_version_accepted");

  if (!hasTermsAcceptedAtColumn) {
    db.exec("ALTER TABLE users ADD COLUMN terms_accepted_at TEXT");
  }

  if (!hasTermsVersionColumn) {
    db.exec("ALTER TABLE users ADD COLUMN terms_version_accepted TEXT");
  }
}

ensureUserTermsAcceptanceSupport();

db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL"
);

const recommendationCount = db
  .prepare("SELECT COUNT(*) as count FROM recommendations")
  .get().count;

if (recommendationCount === 0) {
  const insertRecommendation = db.prepare(
    "INSERT INTO recommendations (ticker, company, action, rationale, sector) VALUES (?, ?, ?, ?, ?)"
  );

  // This is where you edit the stock picks
  const seedRecommendations = [
    ["MSFT", "Microsoft", "BUY", "Cloud growth and strong enterprise demand.", "Technology"],
    ["NVDA", "NVIDIA", "BUY", "AI infrastructure demand remains strong.", "Technology"],
    ["AAPL", "Apple", "SELL", "Valuation appears stretched against growth outlook.", "Technology"],
    ["XOM", "Exxon Mobil", "SELL", "Earnings sensitivity to commodity volatility is high.", "Energy"],
    ["AMZN", "Amazon", "BUY", "Margin expansion and resilient retail + AWS momentum.", "Consumer Discretionary"],
  ];

  const transaction = db.transaction(() => {
    for (const stock of seedRecommendations) {
      insertRecommendation.run(...stock);
    }
  });
  transaction();
}

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function hasAcceptedCurrentTerms(user) {
  const acceptedAt = String(user?.terms_accepted_at || "").trim();
  const acceptedVersion = String(user?.terms_version_accepted || "").trim();
  return Boolean(acceptedAt) && acceptedVersion === TERMS_VERSION;
}

function getSessionUserWithTerms(userId) {
  return db
    .prepare(
      "SELECT id, name, email, terms_accepted_at, terms_version_accepted FROM users WHERE id = ?"
    )
    .get(userId);
}

function requireAcceptedTerms(req, res, next) {
  const user = getSessionUserWithTerms(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!hasAcceptedCurrentTerms(user)) {
    return res.status(403).json({
      error: "Please accept the latest Terms and Conditions to continue.",
      requireTermsAcceptance: true,
      termsVersion: TERMS_VERSION,
    });
  }

  next();
}

function getAdminEmails() {
  const configured = String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set([...configured, DEFAULT_ADMIN.email.toLowerCase()])];
}

function isAdminEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return getAdminEmails().includes(normalizedEmail);
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = getSessionUserWithTerms(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!hasAcceptedCurrentTerms(user)) {
    return res.status(403).json({
      error: "Please accept the latest Terms and Conditions to continue.",
      requireTermsAcceptance: true,
      termsVersion: TERMS_VERSION,
    });
  }

  if (!isAdminEmail(req.session.email)) {
    return res.status(403).json({ error: "Admin access required." });
  }

  next();
}

function ensureDefaultAdminUser() {
  const adminEmail = DEFAULT_ADMIN.email.toLowerCase();
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(adminEmail);

  const legacyAdmin = db
    .prepare(
      `SELECT id FROM users WHERE lower(email) IN (${LEGACY_DEFAULT_ADMIN_EMAILS
        .map(() => "?")
        .join(",")}) LIMIT 1`
    )
    .get(...LEGACY_DEFAULT_ADMIN_EMAILS);

  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN.password, 10);

  if (existingAdmin) {
    db.prepare("UPDATE users SET name = ?, password_hash = ? WHERE id = ?").run(
      DEFAULT_ADMIN.name,
      passwordHash,
      existingAdmin.id
    );
    return;
  }

  if (legacyAdmin) {
    db.prepare("UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?").run(
      DEFAULT_ADMIN.name,
      adminEmail,
      passwordHash,
      legacyAdmin.id
    );
    return;
  }

  if (hasLegacyUsernameColumn) {
    db
      .prepare("INSERT INTO users (name, email, username, password_hash) VALUES (?, ?, ?, ?)")
      .run(DEFAULT_ADMIN.name, adminEmail, adminEmail, passwordHash);
    return;
  }

  db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(
    DEFAULT_ADMIN.name,
    adminEmail,
    passwordHash
  );
}

ensureDefaultAdminUser();

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const termsAccepted = Boolean(req.body.termsAccepted);
  const termsVersion = String(req.body.termsVersion || "").trim();

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Name, valid email, and password (8+ chars) are required." });
  }

  if (!termsAccepted || termsVersion !== TERMS_VERSION) {
    return res
      .status(400)
      .json({ error: `You must agree to Terms and Conditions version ${TERMS_VERSION}.` });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const termsAcceptedAt = new Date().toISOString();
    const result = hasLegacyUsernameColumn
      ? db
          .prepare(
            "INSERT INTO users (name, email, username, password_hash, terms_accepted_at, terms_version_accepted) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .run(name, email, email, passwordHash, termsAcceptedAt, TERMS_VERSION)
      : db
          .prepare("INSERT INTO users (name, email, password_hash, terms_accepted_at, terms_version_accepted) VALUES (?, ?, ?, ?, ?)")
          .run(name, email, passwordHash, termsAcceptedAt, TERMS_VERSION);

    req.session.userId = result.lastInsertRowid;
    req.session.name = name;
    req.session.email = email;

    return res.status(201).json({ name, email });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      const existingUser = db
        .prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?")
        .get(email);

      if (existingUser) {
        const valid = await bcrypt.compare(password, existingUser.password_hash);
        if (valid) {
          req.session.userId = existingUser.id;
          req.session.name = existingUser.name || "Member";
          req.session.email = existingUser.email;
          const existingUserWithTerms = getSessionUserWithTerms(existingUser.id);
          return res.status(200).json({
            name: req.session.name,
            email: req.session.email,
            alreadyExists: true,
            mustAcceptTerms: !hasAcceptedCurrentTerms(existingUserWithTerms),
            termsVersionRequired: TERMS_VERSION,
          });
        }
      }

      return res.status(409).json({ error: "Email already exists. Use Log In or enter the correct password." });
    }
    return res.status(500).json({ error: "Failed to register." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (
    email === DEFAULT_ADMIN.email.toLowerCase() &&
    password === DEFAULT_ADMIN.password
  ) {
    ensureDefaultAdminUser();
    const adminUser = db
      .prepare("SELECT id, name, email, terms_accepted_at, terms_version_accepted FROM users WHERE email = ?")
      .get(email);

    if (adminUser) {
      req.session.userId = adminUser.id;
      req.session.name = adminUser.name || DEFAULT_ADMIN.name;
      req.session.email = adminUser.email;
      return res.json({
        name: req.session.name,
        email: req.session.email,
        mustAcceptTerms: !hasAcceptedCurrentTerms(adminUser),
        termsVersionRequired: TERMS_VERSION,
      });
    }
  }

  const user = db
    .prepare("SELECT id, name, email, password_hash, terms_accepted_at, terms_version_accepted FROM users WHERE email = ?")
    .get(email);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (name && user.name && name.toLowerCase() !== user.name.toLowerCase()) {
    return res.status(401).json({ error: "Name does not match this account." });
  }

  req.session.userId = user.id;
  req.session.name = user.name || "Member";
  req.session.email = user.email;

  return res.json({
    name: req.session.name,
    email: req.session.email,
    mustAcceptTerms: !hasAcceptedCurrentTerms(user),
    termsVersionRequired: TERMS_VERSION,
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = getSessionUserWithTerms(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({
    name: user.name || req.session.name || "Member",
    email: user.email || req.session.email,
    isAdmin: isAdminEmail(user.email || req.session.email),
    mustAcceptTerms: !hasAcceptedCurrentTerms(user),
    termsVersionRequired: TERMS_VERSION,
  });
});

app.post("/api/auth/accept-terms", requireAuth, (req, res) => {
  const termsAccepted = Boolean(req.body.termsAccepted);
  const termsVersion = String(req.body.termsVersion || "").trim();

  if (!termsAccepted || termsVersion !== TERMS_VERSION) {
    return res.status(400).json({
      error: `You must accept Terms and Conditions version ${TERMS_VERSION}.`,
    });
  }

  const termsAcceptedAt = new Date().toISOString();
  const result = db
    .prepare(
      "UPDATE users SET terms_accepted_at = ?, terms_version_accepted = ? WHERE id = ?"
    )
    .run(termsAcceptedAt, TERMS_VERSION, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "User not found." });
  }

  return res.json({ ok: true, termsAcceptedAt, termsVersionAccepted: TERMS_VERSION });
});

app.get("/api/recommendations", requireAuth, requireAcceptedTerms, async (req, res) => {
  const stocks = db
    .prepare(
      "SELECT id, ticker, company, action, rationale, sector, locked_change_percent as lockedChangePercent, updated_at as updatedAt FROM recommendations ORDER BY id DESC"
    )
    .all();

  const enrichedStocks = await enrichRecommendationSectors(stocks);

  return res.json({ stocks: enrichedStocks });
});

app.get("/api/admin/recommendations", requireAdmin, async (req, res) => {
  const stocks = db
    .prepare(
      "SELECT id, ticker, company, action, rationale, sector, locked_change_percent as lockedChangePercent, updated_at as updatedAt FROM recommendations ORDER BY id DESC"
    )
    .all();

  const enrichedStocks = await enrichRecommendationSectors(stocks);

  return res.json({ stocks: enrichedStocks });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = db
    .prepare(
      "SELECT id, name, email, created_at as createdAt, terms_accepted_at as termsAcceptedAt, terms_version_accepted as termsVersionAccepted FROM users ORDER BY id DESC"
    )
    .all();

  return res.json({ users });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  if (Number(req.session.userId) === id) {
    return res.status(400).json({ error: "You cannot delete the currently logged-in user." });
  }

  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "User not found." });
  }

  return res.json({ ok: true });
});

app.post("/api/admin/recommendations", requireAdmin, (req, res) => {
  const ticker = String(req.body.ticker || "").trim().toUpperCase();
  const company = String(req.body.company || "").trim();
  const action = String(req.body.action || "").trim().toUpperCase();
  const rationale = String(req.body.rationale || "").trim();
  const sector = String(req.body.sector || "").trim();

  if (!ticker || !company || !rationale || !sector || !["BUY", "SELL", "HOLD"].includes(action)) {
    return res.status(400).json({ error: "Ticker, company, sector, rationale, and BUY/SELL/HOLD action are required." });
  }

  const result = db
    .prepare(
      "INSERT INTO recommendations (ticker, company, action, rationale, sector, locked_change_percent, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .run(ticker, company, action, rationale, sector, action === "SELL" ? 0 : null);

  return res.status(201).json({ id: result.lastInsertRowid });
});

app.put("/api/admin/recommendations/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const ticker = String(req.body.ticker || "").trim().toUpperCase();
  const company = String(req.body.company || "").trim();
  const action = String(req.body.action || "").trim().toUpperCase();
  const rationale = String(req.body.rationale || "").trim();
  const sector = String(req.body.sector || "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid recommendation id." });
  }

  if (!ticker || !company || !rationale || !sector || !["BUY", "SELL", "HOLD"].includes(action)) {
    return res.status(400).json({ error: "Ticker, company, sector, rationale, and BUY/SELL/HOLD action are required." });
  }

  const existing = db
    .prepare("SELECT id, ticker, action, updated_at as updatedAt, locked_change_percent as lockedChangePercent FROM recommendations WHERE id = ?")
    .get(id);

  if (!existing) {
    return res.status(404).json({ error: "Recommendation not found." });
  }

  const updateRecommendation = async () => {
    let lockedChangePercent = null;
    const wasSell = String(existing.action || "") === "SELL";
    const isSell = action === "SELL";

    if (isSell) {
      if (wasSell && typeof existing.lockedChangePercent === "number") {
        lockedChangePercent = existing.lockedChangePercent;
      } else {
        const computedPercent = await fetchChangePercentSinceDate(existing.ticker, existing.updatedAt);
        lockedChangePercent = typeof computedPercent === "number" ? computedPercent : 0;
      }
    }

    db.prepare(
      "UPDATE recommendations SET ticker = ?, company = ?, action = ?, rationale = ?, sector = ?, locked_change_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(ticker, company, action, rationale, sector, lockedChangePercent, id);

    return res.json({ ok: true });
  };

  updateRecommendation().catch(() => {
    return res.status(500).json({ error: "Failed to update recommendation." });
  });
});

app.delete("/api/admin/recommendations/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid recommendation id." });
  }

  const result = db.prepare("DELETE FROM recommendations WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Recommendation not found." });
  }

  return res.json({ ok: true });
});

app.get("/api/stocks/:ticker/history", requireAuth, requireAcceptedTerms, async (req, res) => {
  const ticker = String(req.params.ticker || "")
    .trim()
    .toUpperCase();
  const range = String(req.query.range || "6mo").trim().toLowerCase();
  const start = String(req.query.start || "").trim();
  const end = String(req.query.end || "").trim();

  const allowedRanges = new Set(["1mo", "3mo", "6mo", "1y", "max", "custom"]);

  if (!/^[A-Z.\-]{1,10}$/.test(ticker)) {
    return res.status(400).json({ error: "Invalid ticker." });
  }

  if (!allowedRanges.has(range)) {
    return res.status(400).json({ error: "Invalid history range." });
  }

  let queryString = `range=${encodeURIComponent(range)}&interval=1d`;
  if (range === "custom") {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(start) || !datePattern.test(end)) {
      return res.status(400).json({ error: "Custom range requires start and end dates (YYYY-MM-DD)." });
    }

    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T23:59:59Z`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid custom date range." });
    }
    if (startDate > endDate) {
      return res.status(400).json({ error: "Start date must be before end date." });
    }

    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    queryString = `period1=${period1}&period2=${period2}&interval=1d`;
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?${queryString}`
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch stock history." });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    const history = [];
    for (let index = 0; index < timestamps.length; index += 1) {
      const close = closes[index];
      if (typeof close !== "number" || Number.isNaN(close)) {
        continue;
      }

      history.push({
        date: new Date(timestamps[index] * 1000).toISOString(),
        close,
      });
    }

    if (history.length === 0) {
      return res.status(404).json({ error: "No stock history found for this ticker." });
    }

    return res.json({
      ticker,
      range,
      company: result?.meta?.shortName || ticker,
      currency: result?.meta?.currency || "USD",
      history,
    });
  } catch {
    return res.status(502).json({ error: "Failed to fetch stock history." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
