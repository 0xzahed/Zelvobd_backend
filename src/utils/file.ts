import { promises as fs } from 'node:fs';

export const removeLocalFile = async (filePath: string): Promise<void> => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};
