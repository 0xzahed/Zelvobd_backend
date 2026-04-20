import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';

import { env } from './config/env';
import { globalErrorHandler } from './core/errors/globalErrorHandler';
import { notFoundHandler } from './core/errors/notFoundHandler';
import { router } from './routes';
import { uploadRootPath } from './utils/paths';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow uploaded media to be embedded by the frontend (different localhost port).
app.use('/upload', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use('/upload', express.static(uploadRootPath));

const legacyUploadPath = path.join(process.cwd(), 'upload');
if (legacyUploadPath !== uploadRootPath && fs.existsSync(legacyUploadPath)) {
  app.use('/upload', express.static(legacyUploadPath));
}

const uploadFallbackRoots = [uploadRootPath];
if (legacyUploadPath !== uploadRootPath && fs.existsSync(legacyUploadPath)) {
  uploadFallbackRoots.push(legacyUploadPath);
}

const normalizeUploadRequestPath = (requestPath: string): string => {
  return requestPath
    .replace(/^[/\\]+/, '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/');
};

const hasReadableFile = (filePath: string): boolean => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

const buildUploadFallbackRelativeCandidates = (normalizedRequestPath: string): string[] => {
  if (!normalizedRequestPath) {
    return [];
  }

  const candidates = new Set<string>();
  const addCandidate = (candidate: string) => {
    if (candidate) {
      candidates.add(candidate);
    }
  };

  addCandidate(normalizedRequestPath);

  const pathParts = normalizedRequestPath.split('/');
  const [folderName, ...restParts] = pathParts;
  const fileName = restParts[restParts.length - 1];
  const remainder = restParts.join('/');

  if (folderName && remainder) {
    if (folderName === 'subcategories' || folderName === 'subCategory') {
      addCandidate(path.posix.join('subCategories', remainder));
    }

    if (folderName === 'subCategories') {
      addCandidate(path.posix.join('subcategories', remainder));
      addCandidate(path.posix.join('subCategory', remainder));
    }

    if (
      (folderName === 'subCategories' ||
        folderName === 'subcategories' ||
        folderName === 'subCategory') &&
      fileName
    ) {
      addCandidate(path.posix.join('categories', fileName));
    }
  }

  if (pathParts.length === 1 && fileName) {
    addCandidate(path.posix.join('categories', fileName));
    addCandidate(path.posix.join('subCategories', fileName));
    addCandidate(path.posix.join('banners', fileName));
    addCandidate(path.posix.join('products', 'images', fileName));
  }

  return Array.from(candidates);
};

const resolveUploadFallbackFilePath = (requestPath: string): string | null => {
  const normalizedRequestPath = normalizeUploadRequestPath(requestPath);
  if (!normalizedRequestPath) {
    return null;
  }

  const fallbackCandidates = buildUploadFallbackRelativeCandidates(normalizedRequestPath);

  for (const uploadRoot of uploadFallbackRoots) {
    for (const relativeCandidatePath of fallbackCandidates) {
      const absoluteCandidatePath = path.join(uploadRoot, relativeCandidatePath);

      if (hasReadableFile(absoluteCandidatePath)) {
        return absoluteCandidatePath;
      }
    }
  }

  return null;
};

app.use('/upload', (req, res, next) => {
  const fallbackFilePath = resolveUploadFallbackFilePath(req.path);

  if (!fallbackFilePath) {
    next();
    return;
  }

  res.sendFile(fallbackFilePath, (error) => {
    if (error) {
      next();
    }
  });
});

app.use('/api/v1', router);

app.use(notFoundHandler);
app.use(globalErrorHandler);
