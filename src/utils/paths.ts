import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backendRootPath = path.resolve(__dirname, '..', '..');
export const uploadRootPath = path.join(backendRootPath, 'upload');

export const resolveBackendPath = (...segments: string[]) => {
  return path.join(backendRootPath, ...segments);
};

export const resolveStoredRelativePath = (storedPath: string) => {
  const normalized = storedPath.replace(/^[/\\]+/, '');
  return path.join(backendRootPath, normalized);
};