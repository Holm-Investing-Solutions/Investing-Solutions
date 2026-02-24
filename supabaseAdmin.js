const { createClient } = require("@supabase/supabase-js");

// Validate that required environment variables are present
if (!process.env.SUPABASE_URL) {
	console.error("ERROR: SUPABASE_URL environment variable is not set");
	process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
	console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
	process.exit(1);
}

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});

module.exports = supabaseAdmin;