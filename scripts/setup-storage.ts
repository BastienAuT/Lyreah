import { createClient } from "@supabase/supabase-js";

function requireEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

const bucket = requireEnvironmentVariable("SUPABASE_STORAGE_BUCKET");
const supabase = createClient(
  requireEnvironmentVariable("SUPABASE_URL"),
  requireEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);

const { data: existingBucket, error: lookupError } =
  await supabase.storage.getBucket(bucket);

if (existingBucket) {
  if (existingBucket.public) {
    const { error } = await supabase.storage.updateBucket(bucket, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    });

    if (error) {
      throw new Error(`Impossible de rendre le bucket privé : ${error.message}`);
    }

    console.log(`✓ Bucket "${bucket}" rendu privé`);
  } else {
    console.log(`✓ Bucket privé "${bucket}" déjà présent`);
  }
} else {
  if (lookupError && !/not found/i.test(lookupError.message)) {
    throw new Error(`Supabase Storage: ${lookupError.message}`);
  }

  const { error } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
  });

  if (error) {
    throw new Error(`Impossible de créer le bucket : ${error.message}`);
  }

  console.log(`✓ Bucket privé "${bucket}" créé (50 Mo maximum par fichier)`);
}
