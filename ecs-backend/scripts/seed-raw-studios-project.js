require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'project-images';
const SHOTS_DIR = path.join(__dirname, '../public/projects/images/therawstudios');
const SHOTS = ['shot-1.png', 'shot-2.png', 'shot-3.png'];

async function main() {
  console.log('Checking for an existing "The Raw Studios" project row...');
  const { data: existing } = await supabase.from('projects').select('id').eq('title', 'The Raw Studios').maybeSingle();

  let project = existing;
  if (project) {
    console.log('Already seeded (id=' + project.id + '). Will still check/attach images.');
  } else {
    console.log('Inserting project row...');
    const { data: inserted, error: insErr } = await supabase.from('projects').insert([{
      type: 'web_dev',
      title: 'The Raw Studios',
      link: 'https://therawstudios.in',
      description: "Scaling an institute for music, dance, art, and craft — from local studio to global digital presence. Mr. Rounak's vision was clear: make The Raw Studios the digital face of their artistic legacy, celebrating creativity for every age group from 4 to 50+.",
      functionalities: 'Static website with GSAP animations, responsive across all devices\nAdmin dashboard for CRUD on courses and teachers\nCRM and Enquiry Dashboard with WhatsApp integration\nSEO-friendly with optimised pixel ad generation',
      delivery_time: '3 weeks',
    }]).select().single();
    if (insErr) { console.error('Insert failed:', insErr.message); process.exit(1); }
    project = inserted;
    console.log('Project inserted: id=' + project.id);
  }

  console.log('Checking project_images table exists...');
  const { data: already, error: tableCheckErr } = await supabase.from('project_images').select('id').eq('project_id', project.id);
  if (tableCheckErr) {
    console.error('project_images table not found yet — apply supabase/migrations/002_project_images.sql first, then rerun this script to attach images.');
    console.error('(Project row itself exists; nothing else was changed.)');
    process.exit(1);
  }
  if (already && already.length) {
    console.log('Images already attached (' + already.length + '). Nothing to do.');
    return;
  }

  for (let i = 0; i < SHOTS.length; i++) {
    const file = SHOTS[i];
    const filePath = path.join(SHOTS_DIR, file);
    if (!fs.existsSync(filePath)) { console.warn('Missing local file, skipping:', file); continue; }
    const buf = fs.readFileSync(filePath);
    const objectName = `${project.id}/${Date.now()}-${i}.png`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectName, buf, { contentType: 'image/png', upsert: false });
    if (upErr) { console.error('Upload failed for', file, ':', upErr.message); continue; }
    const { error: rowErr } = await supabase.from('project_images').insert([{ project_id: project.id, image_url: objectName, sort_order: i }]);
    if (rowErr) { console.error('Image row insert failed for', file, ':', rowErr.message); continue; }
    console.log('Attached image', i, '->', objectName);
  }
  console.log('Done.');
}

main();
