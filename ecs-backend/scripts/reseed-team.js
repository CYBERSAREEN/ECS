require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const team = [
  {
    name: 'Vandana Kochhar',
    role: 'Founder · Director & CTO',
    bio: 'Founder and Director of Excelon CS. Driving the AI-powered security vision — from enterprise WAPT to digital safety programs for children and senior citizens.',
    photo_url: '/img/team/vandana.jpeg',
    initials: 'VK',
    sort_order: 1
  },
  {
    name: 'Vedant Sareen',
    role: 'Senior Security Analyst',
    bio: 'Ex-EY Senior Security Analyst, VAPT specialist, and Red Teamer. Patent holder for PenBox DMAS. Active bug bounty researcher across global programs.',
    photo_url: '/img/team/vedant.jpeg',
    initials: 'VS',
    sort_order: 2
  },
  {
    name: 'Suneha Passi',
    role: 'Senior Web Developer · Team Lead',
    bio: 'Senior full-stack developer and team lead. Delivers secure, responsive web products in React and Node.js — from architecture to production deployment.',
    photo_url: '/img/team/suneha.jpeg',
    initials: 'SP',
    sort_order: 3
  },
  {
    name: 'Hardik Garg',
    role: 'EDR & SOC Specialist · Purple Teamer',
    bio: 'Certified Purple Teamer with deep SOC and SIEM expertise. Leads EDR/XDR telemetry, threat hunting, and automated red teaming for enterprise defence.',
    photo_url: '/img/team/hardik.jpeg',
    initials: 'HG',
    sort_order: 4
  }
];

async function reseedTeam() {
  console.log('Deleting existing team members from Supabase...');
  const { error: delErr } = await supabase
    .from('team_members')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (delErr) {
    console.error('Delete failed:', delErr.message);
    process.exit(1);
  }

  console.log('Inserting 4 updated team members...');
  const { data, error: insErr } = await supabase
    .from('team_members')
    .insert(team)
    .select();

  if (insErr) {
    console.error('Insert failed:', insErr.message);
    process.exit(1);
  }

  console.log('Done! Seeded', data.length, 'members:');
  data.forEach(m => console.log('  [' + m.sort_order + ']', m.name, '—', m.role));
  process.exit(0);
}

reseedTeam();
