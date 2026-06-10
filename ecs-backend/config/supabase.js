const { createClient } = require('@supabase/supabase-js');

// Tolerant init: only create the client when env is present.
// Page routes use static fallback content, so the site renders without Supabase.
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
} else {
  console.warn('[supabase] No SUPABASE_URL/SERVICE_ROLE_KEY — DB features disabled (site still renders).');
}

module.exports = supabase;
