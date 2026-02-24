const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const supabaseAdmin = require("./supabaseAdmin");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("ENV CHECK SUPABASE_URL:", !!process.env.SUPABASE_URL);
console.log("ENV CHECK SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HAS_SUPABASE_SERVICE_ROLE_KEY = Boolean(String(SUPABASE_SERVICE_ROLE_KEY || "").trim());

if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is missing at runtime. Value:",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const DEFAULT_ADMIN = {
  name: "ADMIN2073",
  email: "austinrayholm@yahoo.com",
  password: "Atlantic73!",
};

const LEGACY_DEFAULT_ADMIN_EMAILS = ["brodyholm73@gmail.com"];
const TERMS_VERSION = "1.1";

const DEFAULT_RECOMMENDATIONS = [
  {
    ticker: "MSFT",
    company: "Microsoft",
    action: "BUY",
    rationale: "Cloud growth and strong enterprise demand.",
    sector: "Technology",
  },
  {
    ticker: "NVDA",
    company: "NVIDIA",
    action: "BUY",
    rationale: "AI infrastructure demand remains strong.",
    sector: "Technology",
  },
  {
    ticker: "AAPL",
    company: "Apple",
    action: "SELL",
    rationale: "Valuation appears stretched against growth outlook.",
    sector: "Technology",
  },
  {
    ticker: "XOM",
    company: "Exxon Mobil",
    action: "SELL",
    rationale: "Earnings sensitivity to commodity volatility is high.",
    sector: "Energy",
  },
  {
    ticker: "AMZN",
    company: "Amazon",
    action: "BUY",
    rationale: "Margin expansion and resilient retail + AWS momentum.",
    sector: "Consumer Discretionary",
  },
];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function formatSupabaseError(error, fallbackMessage) {
  const errorMessage = String(error?.message || "").trim();
  return errorMessage || fallbackMessage;
}

function getSupabaseWriteConfigErrorMessage() {
  return "Server configuration error: set SUPABASE_SERVICE_ROLE_KEY for backend writes.";
}

function isSupabaseWritePermissionError(error) {
  const message = formatSupabaseError(error, "").toLowerCase();
  return (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not allowed")
  );
}

function getSessionExpirationDate(sessionData) {
  const rawExpiration = sessionData?.cookie?.expires;
  const expiration = rawExpiration ? new Date(rawExpiration) : new Date(Date.now() + 1000 * 60 * 60 * 24);

  if (!Number.isFinite(expiration.getTime())) {
    return new Date(Date.now() + 1000 * 60 * 60 * 24);
  }

  return expiration;
}

class SupabaseSessionStore extends session.Store {
  async get(sid, callback) {
    try {
      const { data, error } = await supabaseAdmin
        .from("sessions")
        .select("sess, expire")
        .eq("sid", sid)
        .maybeSingle();

      if (error) {
        callback(new Error(formatSupabaseError(error, "Failed to load session.")));
        return;
      }

      if (!data) {
        callback(null, null);
        return;
      }

      const expiration = new Date(data.expire);
      if (!Number.isFinite(expiration.getTime()) || expiration.getTime() <= Date.now()) {
        await supabaseAdmin.from("sessions").delete().eq("sid", sid);
        callback(null, null);
        return;
      }

      callback(null, data.sess);
    } catch (error) {
      callback(new Error(formatSupabaseError(error, "Failed to load session.")));
    }
  }

  async set(sid, sessionData, callback) {
    try {
      const expiration = getSessionExpirationDate(sessionData);
      const { error } = await supabaseAdmin
        .from("sessions")
        .upsert(
          {
            sid,
            sess: sessionData,
            expire: expiration.toISOString(),
          },
          { onConflict: "sid" }
        );

      callback(error ? new Error(formatSupabaseError(error, "Failed to save session.")) : null);
    } catch (error) {
      callback(new Error(formatSupabaseError(error, "Failed to save session.")));
    }
  }

  async destroy(sid, callback) {
    try {
      const { error } = await supabaseAdmin.from("sessions").delete().eq("sid", sid);
      callback(error ? new Error(formatSupabaseError(error, "Failed to delete session.")) : null);
    } catch (error) {
      callback(new Error(formatSupabaseError(error, "Failed to delete session.")));
    }
  }

  async touch(sid, sessionData, callback) {
    try {
      const expiration = getSessionExpirationDate(sessionData);
      const { error } = await supabaseAdmin
        .from("sessions")
        .update({ expire: expiration.toISOString() })
        .eq("sid", sid);

      callback(error ? new Error(formatSupabaseError(error, "Failed to refresh session.")) : null);
    } catch (error) {
      callback(new Error(formatSupabaseError(error, "Failed to refresh session.")));
    }
  }
}

function mapRecommendationForClient(row) {
  return {
    id: row.id,
    ticker: row.ticker,
    company: row.company,
    action: row.action,
    rationale: row.rationale,
    sector: row.sector,
    lockedChangePercent:
      typeof row.locked_change_percent === "number" ? row.locked_change_percent : null,
    updatedAt: row.updated_at,
  };
}

async function getAllRecommendations() {
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .select("id, ticker, company, action, rationale, sector, locked_change_percent, updated_at")
    .order("id", { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error, "Failed to load recommendations."));
  }

  return (data || []).map(mapRecommendationForClient);
}

async function ensureDefaultRecommendations() {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(getSupabaseWriteConfigErrorMessage());
  }

  const { count, error: countError } = await supabaseAdmin
    .from("recommendations")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(formatSupabaseError(countError, "Failed to check recommendations."));
  }

  if ((count || 0) > 0) {
    return;
  }

  console.log("USING ADMIN CLIENT FOR RECOMMENDATIONS WRITE");
  const { error: insertError } = await supabaseAdmin.from("recommendations").insert(DEFAULT_RECOMMENDATIONS);

  if (insertError) {
    throw new Error(formatSupabaseError(insertError, "Failed to seed recommendations."));
  }
}

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

      const { error } = await supabaseAdmin
        .from("recommendations")
        .update({
          sector: resolvedSector,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stock.id);

      if (error) {
        return {
          ...stock,
          sector: "Unspecified",
        };
      }

      return {
        ...stock,
        sector: resolvedSector,
      };
    })
  );

  return result;
}

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new SupabaseSessionStore(),
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

async function getUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, password_hash, created_at, terms_accepted_at, terms_version_accepted")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, "Failed to load user."));
  }

  return data;
}

async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, password_hash, created_at, terms_accepted_at, terms_version_accepted")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, "Failed to load user."));
  }

  return data;
}

function mapUserForClient(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    termsAcceptedAt: user.terms_accepted_at,
    termsVersionAccepted: user.terms_version_accepted,
  };
}

async function getSessionUserWithTerms(userId) {
  return getUserById(userId);
}

async function requireAcceptedTerms(req, res, next) {
  let user;
  try {
    user = await getSessionUserWithTerms(req.session.userId);
  } catch {
    return res.status(500).json({ error: "Failed to verify user account." });
  }

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

async function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user;
  try {
    user = await getSessionUserWithTerms(req.session.userId);
  } catch {
    return res.status(500).json({ error: "Failed to verify user account." });
  }

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

async function ensureDefaultAdminUser() {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(getSupabaseWriteConfigErrorMessage());
  }

  const adminEmail = DEFAULT_ADMIN.email.toLowerCase();
  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN.password, 10);

  const existingAdmin = await getUserByEmail(adminEmail);
  if (existingAdmin) {
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        name: DEFAULT_ADMIN.name,
        password_hash: passwordHash,
      })
      .eq("id", existingAdmin.id);

    if (updateError) {
      throw new Error(formatSupabaseError(updateError, "Failed to update default admin user."));
    }

    return;
  }

  const legacyEmails = LEGACY_DEFAULT_ADMIN_EMAILS.map((email) => normalizeEmail(email));
  const { data: legacyUsers, error: legacyLookupError } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .in("email", legacyEmails)
    .limit(1);

  if (legacyLookupError) {
    throw new Error(formatSupabaseError(legacyLookupError, "Failed to check legacy admin users."));
  }

  const legacyAdmin = legacyUsers?.[0];
  if (legacyAdmin) {
    const { error: legacyUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        name: DEFAULT_ADMIN.name,
        email: adminEmail,
        password_hash: passwordHash,
      })
      .eq("id", legacyAdmin.id);

    if (legacyUpdateError) {
      throw new Error(formatSupabaseError(legacyUpdateError, "Failed to migrate legacy admin user."));
    }

    return;
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    name: DEFAULT_ADMIN.name,
    email: adminEmail,
    password_hash: passwordHash,
  });

  if (insertError) {
    throw new Error(formatSupabaseError(insertError, "Failed to create default admin user."));
  }
}

Promise.all([ensureDefaultAdminUser(), ensureDefaultRecommendations()]).catch((error) => {
  console.error(error.message);
});

app.post("/api/auth/register", async (req, res) => {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
  }

  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
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
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email,
        password_hash: passwordHash,
        terms_accepted_at: termsAcceptedAt,
        terms_version_accepted: TERMS_VERSION,
      })
      .select("id, name, email")
      .single();

    if (insertError) {
      throw insertError;
    }

    req.session.userId = newUser.id;
    req.session.name = name;
    req.session.email = email;

    return res.status(201).json({ name, email });
  } catch (error) {
    if (isSupabaseWritePermissionError(error)) {
      return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
    }

    const duplicateEmailCodes = new Set(["23505", "409"]);
    if (duplicateEmailCodes.has(String(error.code || "")) || String(error.message).toLowerCase().includes("duplicate")) {
      const existingUser = await getUserByEmail(email);

      if (existingUser) {
        const valid = await bcrypt.compare(password, existingUser.password_hash);
        if (valid) {
          req.session.userId = existingUser.id;
          req.session.name = existingUser.name || "Member";
          req.session.email = existingUser.email;
          const existingUserWithTerms = await getSessionUserWithTerms(existingUser.id);
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

    console.error(formatSupabaseError(error, "Failed to register."));
    return res.status(500).json({ error: "Failed to register." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (
    email === DEFAULT_ADMIN.email.toLowerCase() &&
    password === DEFAULT_ADMIN.password
  ) {
    try {
      await ensureDefaultAdminUser();
    } catch {
      return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
    }

    const adminUser = await getUserByEmail(email);

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

  const user = await getUserByEmail(email);

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

app.get("/api/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user;
  try {
    user = await getSessionUserWithTerms(req.session.userId);
  } catch {
    return res.status(500).json({ error: "Failed to load user account." });
  }

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

app.post("/api/auth/accept-terms", requireAuth, async (req, res) => {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
  }

  const termsAccepted = Boolean(req.body.termsAccepted);
  const termsVersion = String(req.body.termsVersion || "").trim();

  if (!termsAccepted || termsVersion !== TERMS_VERSION) {
    return res.status(400).json({
      error: `You must accept Terms and Conditions version ${TERMS_VERSION}.`,
    });
  }

  const termsAcceptedAt = new Date().toISOString();
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      terms_accepted_at: termsAcceptedAt,
      terms_version_accepted: TERMS_VERSION,
    })
    .eq("id", req.session.userId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(formatSupabaseError(updateError, "Failed to save terms acceptance."));
    return res.status(500).json({ error: "Failed to save terms acceptance." });
  }

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found." });
  }

  return res.json({ ok: true, termsAcceptedAt, termsVersionAccepted: TERMS_VERSION });
});

app.get("/api/recommendations", requireAuth, requireAcceptedTerms, async (req, res) => {
  let stocks;
  try {
    stocks = await getAllRecommendations();
  } catch {
    return res.status(500).json({ error: "Failed to load recommendations." });
  }

  const enrichedStocks = await enrichRecommendationSectors(stocks);

  return res.json({ stocks: enrichedStocks });
});

app.get("/api/admin/recommendations", requireAdmin, async (req, res) => {
  let stocks;
  try {
    stocks = await getAllRecommendations();
  } catch {
    return res.status(500).json({ error: "Failed to load recommendations." });
  }

  const enrichedStocks = await enrichRecommendationSectors(stocks);

  return res.json({ stocks: enrichedStocks });
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, created_at, terms_accepted_at, terms_version_accepted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(formatSupabaseError(error, "Failed to load users."));
    return res.status(500).json({ error: "Failed to load users." });
  }

  return res.json({ users: (users || []).map(mapUserForClient) });
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id || "").trim();

  if (!id) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  if (String(req.session.userId) === id) {
    return res.status(400).json({ error: "You cannot delete the currently logged-in user." });
  }

  const { data: deletedUser, error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(formatSupabaseError(error, "Failed to delete user."));
    return res.status(500).json({ error: "Failed to delete user." });
  }

  if (!deletedUser) {
    return res.status(404).json({ error: "User not found." });
  }

  return res.json({ ok: true });
});

app.post("/api/admin/recommendations", requireAdmin, async (req, res) => {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
  }

  const ticker = String(req.body.ticker || "").trim().toUpperCase();
  const company = String(req.body.company || "").trim();
  const action = String(req.body.action || "").trim().toUpperCase();
  const rationale = String(req.body.rationale || "").trim();
  const sector = String(req.body.sector || "").trim();

  if (!ticker || !company || !rationale || !sector || !["BUY", "SELL", "HOLD"].includes(action)) {
    return res.status(400).json({ error: "Ticker, company, sector, rationale, and BUY/SELL/HOLD action are required." });
  }

  console.log("USING ADMIN CLIENT FOR RECOMMENDATIONS WRITE");
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .insert({
      ticker,
      company,
      action,
      rationale,
      sector,
      locked_change_percent: action === "SELL" ? 0 : null,
    })
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to create recommendation." });
  }

  return res.status(201).json({ id: data.id });
});

app.put("/api/admin/recommendations/:id", requireAdmin, async (req, res) => {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
  }

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

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("recommendations")
    .select("id, ticker, action, updated_at, locked_change_percent")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ error: "Failed to load recommendation." });
  }

  if (!existing) {
    return res.status(404).json({ error: "Recommendation not found." });
  }

  let lockedChangePercent = null;
  const wasSell = String(existing.action || "") === "SELL";
  const isSell = action === "SELL";

  if (isSell) {
    if (wasSell && typeof existing.locked_change_percent === "number") {
      lockedChangePercent = existing.locked_change_percent;
    } else {
      const computedPercent = await fetchChangePercentSinceDate(existing.ticker, existing.updated_at);
      lockedChangePercent = typeof computedPercent === "number" ? computedPercent : 0;
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("recommendations")
    .update({
      ticker,
      company,
      action,
      rationale,
      sector,
      locked_change_percent: lockedChangePercent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return res.status(500).json({ error: "Failed to update recommendation." });
  }

  return res.json({ ok: true });
});

app.delete("/api/admin/recommendations/:id", requireAdmin, async (req, res) => {
  if (!HAS_SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: getSupabaseWriteConfigErrorMessage() });
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid recommendation id." });
  }

  const { data: deletedRow, error } = await supabaseAdmin
    .from("recommendations")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: "Failed to delete recommendation." });
  }

  if (!deletedRow) {
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
