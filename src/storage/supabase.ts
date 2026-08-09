import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export { createStoragePath, storageFolders } from "./paths";
export type { StorageFolder } from "./paths";

let storageClient: SupabaseClient | undefined;

function requireEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

/**
 * Server-only Supabase client with access to the private Lyreah storage bucket.
 * Never expose SUPABASE_SERVICE_ROLE_KEY through a NEXT_PUBLIC_* variable.
 */
export function getSupabaseStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  storageClient = createClient(
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

  return storageClient;
}

export function getStorageBucket() {
  return requireEnvironmentVariable("SUPABASE_STORAGE_BUCKET");
}

export async function createSignedReadUrl(path: string, expiresIn = 60) {
  const { data, error } = await getSupabaseStorageClient()
    .storage.from(getStorageBucket())
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Unable to sign storage path "${path}": ${error.message}`);
  }

  return data.signedUrl;
}
