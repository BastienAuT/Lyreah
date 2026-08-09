export const storageFolders = {
  masters: "masters",
  renditions: "renditions",
  covers: "covers",
  audio: "audio",
} as const;

export type StorageFolder = keyof typeof storageFolders;

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function createStoragePath(
  folder: StorageFolder,
  resourceId: string,
  fileName: string,
  prefix = process.env.SUPABASE_STORAGE_PREFIX ?? "dev",
) {
  const safePrefix = prefix
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map(sanitizeSegment)
    .filter(Boolean)
    .join("/");
  const safeResourceId = sanitizeSegment(resourceId);
  const safeFileName = sanitizeSegment(fileName);

  if (!safePrefix || !safeResourceId || !safeFileName) {
    throw new Error("Storage paths require a prefix, resource id and file name.");
  }

  return `${safePrefix}/${storageFolders[folder]}/${safeResourceId}/${safeFileName}`;
}
