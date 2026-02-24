const { createClient } = require("@supabase/supabase-js");

console.log(`SUPABASE_URL exists: ${Boolean(process.env.SUPABASE_URL)}`);
console.log(`SERVICE_ROLE_KEY exists: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
console.log("SUPABASE_URL length:", String(process.env.SUPABASE_URL || "").length);

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});

module.exports = supabaseAdmin;