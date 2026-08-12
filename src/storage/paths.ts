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

export function createStorageResourcePrefix(
  folder: StorageFolder,
  resourceId: string,
  prefix = process.env.SUPABASE_STORAGE_PREFIX ?? "dev",
) {
  const safePrefix = prefix
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map(sanitizeSegment)
    .filter(Boolean)
    .join("/");
  const safeResourceId = sanitizeSegment(resourceId);

  if (!safePrefix || !safeResourceId) {
    throw new Error("Storage paths require a prefix and resource id.");
  }

  return `${safePrefix}/${storageFolders[folder]}/${safeResourceId}`;
}

export function createNestedStoragePath(
  folder: StorageFolder,
  resourceId: string,
  relativePath: string,
  prefix = process.env.SUPABASE_STORAGE_PREFIX ?? "dev",
) {
  if (
    !relativePath ||
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(relativePath)
  ) {
    throw new Error("Storage object path is unsafe.");
  }

  const segments = relativePath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Storage object path is unsafe.");
  }

  return `${createStorageResourcePrefix(folder, resourceId, prefix)}/${relativePath}`;
}

export function createStoragePath(
  folder: StorageFolder,
  resourceId: string,
  fileName: string,
  prefix = process.env.SUPABASE_STORAGE_PREFIX ?? "dev",
) {
  const safeFileName = sanitizeSegment(fileName);

  if (!safeFileName) {
    throw new Error("Storage paths require a prefix, resource id and file name.");
  }

  return `${createStorageResourcePrefix(folder, resourceId, prefix)}/${safeFileName}`;
}
