import path from 'node:path';
import { promises as fs } from 'node:fs';

import bwipjs from 'bwip-js';

import { env } from '../config/env';
import { uploadRootPath } from './paths';

const barcodesDirectoryPath = path.join(uploadRootPath, 'products', 'barcodes');

export const ensureBarcodesDirectoryExists = (): void => {
  fs.mkdir(barcodesDirectoryPath, { recursive: true }).catch(() => {
    // Directory already exists — ignore
  });
};

type GenerateBarcodeParams = {
  variantId: string;
  productTitle: string;
  variantColor: string;
  productSlug: string;
  categorySlug: string;
  subCategorySlug: string;
};

type GenerateBarcodeResult = {
  barcodeUrl: string;
  barcodePath: string;
};

/**
 * Builds the full frontend URL that will be encoded inside the barcode.
 * When scanned, the user is taken directly to this variant's detail page.
 */
const buildVariantFrontendUrl = (params: Omit<GenerateBarcodeParams, 'productTitle' | 'variantColor'>): string => {
  const { categorySlug, subCategorySlug, productSlug, variantId } = params;
  const base = env.frontendBaseUrl.replace(/\/+$/, '');
  return `${base}/${categorySlug}/${subCategorySlug}/${productSlug}/${variantId}`;
};

/**
 * Generates a Code128 barcode PNG for a product variant and saves it to disk.
 *
 * The barcode encodes the full frontend variant URL so that scanning it
 * redirects the user to the correct product + pre-selected variant.
 *
 * The label displayed below the barcode bars is: "ProductTitle - VariantColor"
 */
export const generateAndSaveBarcode = async (
  params: GenerateBarcodeParams
): Promise<GenerateBarcodeResult> => {
  const { variantId, productTitle, variantColor } = params;

  // Ensure directory exists (synchronously so the file write never fails)
  await fs.mkdir(barcodesDirectoryPath, { recursive: true });

  const variantUrl = buildVariantFrontendUrl(params);
  const label = `${productTitle} - ${variantColor}`;

  // Render the barcode to a PNG buffer using bwip-js
  const pngBuffer = await bwipjs.toBuffer({
    bcid: 'code128',       // Code128 — universally readable by all scanners
    text: variantUrl,      // Value encoded in the barcode (the full variant URL)
    scale: 3,              // 3x scale for clear printing
    height: 15,            // Bar height in mm
    includetext: true,     // Show the URL text below bars (small)
    textxalign: 'center',
    alttext: label,        // This overrides the printed text with our human-readable label
    textyoffset: 2
  });

  const fileName = `barcode-${variantId}-${Date.now()}.png`;
  const filePath = path.join(barcodesDirectoryPath, fileName);
  const relativePath = `upload/products/barcodes/${fileName}`;
  const publicUrl = `/upload/products/barcodes/${fileName}`;

  await fs.writeFile(filePath, pngBuffer);

  return {
    barcodeUrl: publicUrl,
    barcodePath: relativePath
  };
};
