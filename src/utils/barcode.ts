import path from 'node:path';
import { promises as fs } from 'node:fs';
import bwipjs from 'bwip-js';
import { uploadRootPath } from './paths.js';

const barcodesDirectoryPath = path.join(uploadRootPath, 'products', 'barcodes');

export const ensureBarcodesDirectoryExists = (): void => {
  fs.mkdir(barcodesDirectoryPath, { recursive: true }).catch(() => {
    // Directory already exists — ignore
  });
};

type GenerateBarcodeParams = {
  variantId: string;
  productTitle: string;
  productSlugId: number;
  variantColor: string;
};

type GenerateBarcodeResult = {
  barcodeUrl: string;
  barcodePath: string;
};

/**
 * Generates a Code128 barcode PNG for a product variant and saves it to disk.
 *
 * The barcode encodes a short string format: P-2026-{productSlugId}-{variantColor}
 * (spaces in variant color are replaced with hyphens).
 */
export const generateAndSaveBarcode = async (
  params: GenerateBarcodeParams
): Promise<GenerateBarcodeResult> => {
  const { variantId, productSlugId, variantColor } = params;

  // Ensure directory exists (synchronously so the file write never fails)
  await fs.mkdir(barcodesDirectoryPath, { recursive: true });

  const formattedColor = variantColor.trim().replace(/\s+/g, '-');
  const barcodeCode = `P-2026-${productSlugId}-${formattedColor}`;

  // Render the barcode to a PNG buffer using bwip-js
  const pngBuffer = await bwipjs.toBuffer({
    bcid: 'code128',       // Code128 — universally readable by all scanners
    text: barcodeCode,     // Value encoded in the barcode
    scale: 3,              // 3x scale for clear printing
    height: 15,            // Bar height in mm
    includetext: true,     // Show the text below bars
    textxalign: 'center',
    alttext: barcodeCode,  // Use the short code as the printed text
    textyoffset: 0         // Add 5px gap so text doesn't collapse with the bars
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
