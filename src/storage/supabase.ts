import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export {
  createNestedStoragePath,
  createStoragePath,
  createStorageResourcePrefix,
  storageFolders,
} from "./paths";
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

export async function createSignedUpload(path: string) {
  const { data, error } = await getSupabaseStorageClient()
    .storage.from(getStorageBucket())
    .createSignedUploadUrl(path, { upsert: false });

  if (error) {
    throw new Error(`Unable to sign upload path "${path}": ${error.message}`);
  }

  return { path: data.path, token: data.token };
}

export async function storageObjectExists(path: string) {
  const { data, error } = await getSupabaseStorageClient()
    .storage.from(getStorageBucket())
    .exists(path);

  if (error && !data) {
    return false;
  }

  return data;
}

export async function downloadStorageObject(path: string) {
  const { data, error } = await getSupabaseStorageClient()
    .storage.from(getStorageBucket())
    .download(path);

  if (error || !data) {
    throw new Error(
      `Unable to download storage path "${path}": ${error?.message ?? "empty response"}`,
    );
  }

  return data.arrayBuffer();
}

export async function uploadStorageObject(
  path: string,
  contents: Uint8Array,
  contentType: string,
) {
  const { error } = await getSupabaseStorageClient()
    .storage.from(getStorageBucket())
    .upload(path, contents, {
      cacheControl: "3600",
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Unable to upload storage path "${path}": ${error.message}`);
  }
}

export async function removeStorageObjects(paths: Array<string | null>) {
  const existingPaths = paths.filter((path): path is string => Boolean(path));

  if (existingPaths.length === 0) {
    return;
  }

  const { error } = await getSupabaseStorageClient()
    .storage.from(getStorageBucket())
    .remove(existingPaths);

  if (error) {
    throw new Error(`Unable to remove abandoned storage objects: ${error.message}`);
  }
}
