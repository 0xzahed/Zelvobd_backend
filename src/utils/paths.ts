import path from 'node:path';

export const backendRootPath = path.resolve(__dirname, '..', '..');
export const uploadRootPath = path.join(backendRootPath, 'upload');

export const resolveBackendPath = (...segments: string[]) => {
  return path.join(backendRootPath, ...segments);
};

export const resolveStoredRelativePath = (storedPath: string) => {
  const normalized = storedPath.replace(/^[/\\]+/, '');
  return path.join(backendRootPath, normalized);
};
