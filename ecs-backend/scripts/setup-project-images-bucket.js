require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'project-images';

async function main() {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) { console.error('List buckets failed:', listErr.message); process.exit(1); }

  if (buckets.some(b => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" already exists.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });
  if (error) { console.error('Create bucket failed:', error.message); process.exit(1); }
  console.log(`Bucket "${BUCKET}" created (public, 5MB limit, image types only).`);
}

main();
