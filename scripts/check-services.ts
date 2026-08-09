import { neon } from "@neondatabase/serverless";
import { createClient } from "@supabase/supabase-js";

function requireEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

async function checkNeon() {
  const sql = neon(requireEnvironmentVariable("DATABASE_URL"));
  await sql`select 1 as connected`;
  console.log("✓ Neon PostgreSQL connecté");

  const [authSchema] = await sql`
    select exists (
      select 1
      from information_schema.schemata
      where schema_name = 'neon_auth'
    ) as enabled
  `;

  if (!authSchema?.enabled) {
    throw new Error("Neon Auth n'est pas activé sur cette branche Neon.");
  }

  console.log("✓ Schéma Neon Auth présent");
}

async function checkSupabaseStorage() {
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

  const { data, error } = await supabase.storage.getBucket(bucket);

  if (error) {
    throw new Error(`Supabase Storage: ${error.message}`);
  }

  if (data.public) {
    throw new Error(`Le bucket Supabase "${bucket}" doit être privé.`);
  }

  console.log(`✓ Supabase Storage connecté (bucket privé: ${bucket})`);
}

await checkNeon();
await checkSupabaseStorage();
