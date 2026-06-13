require('dotenv').config({ path: '/home/kali/Desktop/excelonCS/ecs-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sb.from('services').update({ badge: '' }).neq('id', 0);
  if (error) console.error('ERROR:', error.message);
  else console.log('badges cleared, rows affected:', data);
  process.exit(0);
})();
