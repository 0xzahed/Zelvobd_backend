import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Prisma, ProductStatus } from '@prisma/client';

import { prisma } from '../lib/prisma';

const backendRoot = path.resolve(__dirname, '..', '..');
const workspaceRoot = path.resolve(backendRoot, '..');
const readmartAssetsRoot = path.join(workspaceRoot, 'readmart', 'src', 'assets');
const uploadRoot = path.join(backendRoot, 'upload');

const categoriesUploadDir = path.join(uploadRoot, 'categories');
const bannersUploadDir = path.join(uploadRoot, 'banners');
const productImagesUploadDir = path.join(uploadRoot, 'products', 'images');

type SeedCategoryConfig = {
  title: string;
  assetSourcePath: string;
  categoryFileName: string;
  subCategoryTitle: string;
  product: {
    title: string;
    slug: string;
    description: string;
    weight: string;
    material: string;
    color: string;
    size: string;
    actualPrice: number;
    discountedPrice: number;
    imageFileName: string;
  };
};

const seedCategories: SeedCategoryConfig[] = [
  {
    title: 'Mobile',
    assetSourcePath: path.join(readmartAssetsRoot, 'products', 'sneaker1.png'),
    categoryFileName: 'seed-category-mobile.png',
    subCategoryTitle: 'Featured',
    product: {
      title: 'Smart Mobile X',
      slug: 'seed-smart-mobile-x',
      description: 'A reliable smartphone for daily use with stylish design.',
      weight: '180g',
      material: 'Aluminum + Glass',
      color: 'Black',
      size: '128GB',
      actualPrice: 25000,
      discountedPrice: 21999,
      imageFileName: 'seed-product-mobile.png'
    }
  },
  {
    title: 'Headphone',
    assetSourcePath: path.join(readmartAssetsRoot, 'products', 'headphones1.png'),
    categoryFileName: 'seed-category-headphone.png',
    subCategoryTitle: 'Featured',
    product: {
      title: 'Noise Cancel Headphone',
      slug: 'seed-noise-cancel-headphone',
      description: 'Comfortable wireless headphone with clear audio output.',
      weight: '260g',
      material: 'ABS + Leather',
      color: 'Silver',
      size: 'Standard',
      actualPrice: 6200,
      discountedPrice: 4990,
      imageFileName: 'seed-product-headphone.png'
    }
  },
  {
    title: 'Tablets',
    assetSourcePath: path.join(readmartAssetsRoot, 'products', 'dress1.png'),
    categoryFileName: 'seed-category-tablets.png',
    subCategoryTitle: 'Featured',
    product: {
      title: 'Tab Pro Lite',
      slug: 'seed-tab-pro-lite',
      description: 'Lightweight tablet for study, browsing, and media.',
      weight: '490g',
      material: 'Aluminum',
      color: 'Blue',
      size: '64GB',
      actualPrice: 32000,
      discountedPrice: 28900,
      imageFileName: 'seed-product-tablets.png'
    }
  },
  {
    title: 'Laptop',
    assetSourcePath: path.join(readmartAssetsRoot, 'products', 'watch1.png'),
    categoryFileName: 'seed-category-laptop.png',
    subCategoryTitle: 'Featured',
    product: {
      title: 'UltraBook Air 14',
      slug: 'seed-ultrabook-air-14',
      description: 'Slim performance laptop ideal for office and creators.',
      weight: '1.3kg',
      material: 'Metal Chassis',
      color: 'Gray',
      size: '16GB/512GB',
      actualPrice: 76000,
      discountedPrice: 69900,
      imageFileName: 'seed-product-laptop.png'
    }
  },
  {
    title: 'Speakers',
    assetSourcePath: path.join(readmartAssetsRoot, 'products', 'handbag1.png'),
    categoryFileName: 'seed-category-speakers.png',
    subCategoryTitle: 'Featured',
    product: {
      title: 'Portable Bass Speaker',
      slug: 'seed-portable-bass-speaker',
      description: 'Portable Bluetooth speaker with deep bass and long battery.',
      weight: '540g',
      material: 'Polycarbonate',
      color: 'Black',
      size: '10W',
      actualPrice: 4500,
      discountedPrice: 3790,
      imageFileName: 'seed-product-speakers.png'
    }
  },
  {
    title: 'Smart Watch',
    assetSourcePath: path.join(readmartAssetsRoot, 'products', 'sofa1.png'),
    categoryFileName: 'seed-category-smart-watch.png',
    subCategoryTitle: 'Featured',
    product: {
      title: 'Active Smart Watch',
      slug: 'seed-active-smart-watch',
      description: 'Fitness-oriented smartwatch with heart-rate tracking.',
      weight: '52g',
      material: 'Silicone + Alloy',
      color: 'Midnight',
      size: '44mm',
      actualPrice: 7200,
      discountedPrice: 5890,
      imageFileName: 'seed-product-smart-watch.png'
    }
  }
];

const seedBanners = [
  {
    title: 'Seed Home Banner 1',
    fileName: 'seed-banner-home-1.jpg',
    sourcePath: path.join(readmartAssetsRoot, 'banner-hero.jpg'),
    url: '/'
  },
  {
    title: 'Seed Home Banner 2',
    fileName: 'seed-banner-home-2.png',
    sourcePath: path.join(readmartAssetsRoot, 'products', 'watch1.png'),
    url: '/categories'
  }
];

const descriptionDeltaFromText = (text: string): Prisma.InputJsonValue => {
  return {
    ops: [
      {
        insert: text.endsWith('\n') ? text : `${text}\n`
      }
    ]
  };
};

const descriptionHtmlFromText = (text: string): string => {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  return `<p>${escaped}</p>`;
};

const buildExtraDescription = (productTitle: string, material: string, weight: string): string => {
  return `${productTitle} is built with ${material} and weighs approximately ${weight}. It is optimized for daily use, comfort, and long-term durability in the ReadMart seed catalog.`;
};

const ensureDirectory = async (directoryPath: string) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const ensureFileCopied = async (sourcePath: string, destinationPath: string) => {
  await fs.copyFile(sourcePath, destinationPath);
};

const normalizeSlashPath = (value: string) => value.split(path.sep).join('/');

const relativeUploadPath = (...segments: string[]) => normalizeSlashPath(path.join('upload', ...segments));
const publicUploadUrl = (...segments: string[]) => `/${relativeUploadPath(...segments)}`;

const fileExistsAtRelativePath = async (relativePath: string): Promise<boolean> => {
  try {
    await fs.access(path.join(backendRoot, relativePath));
    return true;
  } catch {
    return false;
  }
};

const seed = async () => {
  await ensureDirectory(categoriesUploadDir);
  await ensureDirectory(bannersUploadDir);
  await ensureDirectory(productImagesUploadDir);

  const categoryFallbackRelativePaths: string[] = [];
  const productFallbackByCategoryId = new Map<string, { relativePath: string; publicUrl: string }>();

  for (const config of seedCategories) {
    const categoryDestinationPath = path.join(categoriesUploadDir, config.categoryFileName);
    const productDestinationPath = path.join(productImagesUploadDir, config.product.imageFileName);

    await ensureFileCopied(config.assetSourcePath, categoryDestinationPath);
    await ensureFileCopied(config.assetSourcePath, productDestinationPath);

    const categoryImagePath = relativeUploadPath('categories', config.categoryFileName);
    const categoryImageUrl = publicUploadUrl('categories', config.categoryFileName);
    const productImagePath = relativeUploadPath('products', 'images', config.product.imageFileName);
    const productImageUrl = publicUploadUrl('products', 'images', config.product.imageFileName);

    categoryFallbackRelativePaths.push(categoryImagePath);

    const category = await prisma.category.upsert({
      where: { title: config.title },
      update: {
        imagePath: categoryImagePath,
        imageUrl: categoryImageUrl
      },
      create: {
        title: config.title,
        imagePath: categoryImagePath,
        imageUrl: categoryImageUrl
      }
    });

    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        categoryId: category.id,
        title: config.subCategoryTitle
      },
      select: { id: true }
    });

    const subCategoryImagePath = categoryImagePath;
    const subCategoryImageUrl = categoryImageUrl;

    const subCategory = existingSubCategory
      ? await prisma.subCategory.update({
          where: { id: existingSubCategory.id },
          data: {
            imagePath: subCategoryImagePath,
            imageUrl: subCategoryImageUrl
          }
        })
      : await prisma.subCategory.create({
          data: {
            categoryId: category.id,
            title: config.subCategoryTitle,
            imagePath: subCategoryImagePath,
            imageUrl: subCategoryImageUrl
          }
        });

    const productDescriptionDelta = descriptionDeltaFromText(config.product.description);
    const productDescriptionHtml = descriptionHtmlFromText(config.product.description);
    const productExtraDescriptionText = buildExtraDescription(
      config.product.title,
      config.product.material,
      config.product.weight
    );
    const productExtraDescriptionDelta = descriptionDeltaFromText(productExtraDescriptionText);
    const productExtraDescriptionHtml = descriptionHtmlFromText(productExtraDescriptionText);

    const product = await prisma.product.upsert({
      where: { slug: config.product.slug },
      update: {
        categoryId: category.id,
        subCategoryId: subCategory.id,
        title: config.product.title,
        descriptionDelta: productDescriptionDelta,
        descriptionHtml: productDescriptionHtml,
        extraDescriptionDelta: productExtraDescriptionDelta,
        extraDescriptionHtml: productExtraDescriptionHtml,
        weight: config.product.weight,
        material: config.product.material,
        stock: true,
        availability: true,
        status: ProductStatus.PENDING,
        isFreeDelivery: false
      },
      create: {
        categoryId: category.id,
        subCategoryId: subCategory.id,
        title: config.product.title,
        slug: config.product.slug,
        descriptionDelta: productDescriptionDelta,
        descriptionHtml: productDescriptionHtml,
        extraDescriptionDelta: productExtraDescriptionDelta,
        extraDescriptionHtml: productExtraDescriptionHtml,
        weight: config.product.weight,
        material: config.product.material,
        stock: true,
        availability: true,
        status: ProductStatus.PENDING,
        isFreeDelivery: false
      }
    });

    await prisma.productVariant.deleteMany({
      where: { productId: product.id }
    });

    await prisma.productVariant.create({
      data: {
        productId: product.id,
        actualPrice: new Prisma.Decimal(config.product.actualPrice),
        discountedPrice: new Prisma.Decimal(config.product.discountedPrice),
        color: config.product.color,
        size: config.product.size,
        imagePath: productImagePath,
        imageUrl: productImageUrl
      }
    });

    productFallbackByCategoryId.set(category.id, {
      relativePath: productImagePath,
      publicUrl: productImageUrl
    });
  }

  for (const banner of seedBanners) {
    const destinationPath = path.join(bannersUploadDir, banner.fileName);
    await ensureFileCopied(banner.sourcePath, destinationPath);

    const bannerImagePath = relativeUploadPath('banners', banner.fileName);
    const bannerImageUrl = publicUploadUrl('banners', banner.fileName);

    const existing = await prisma.banner.findFirst({
      where: { title: banner.title },
      select: { id: true }
    });

    if (existing) {
      await prisma.banner.update({
        where: { id: existing.id },
        data: {
          url: banner.url,
          imagePath: bannerImagePath,
          imageUrl: bannerImageUrl
        }
      });
    } else {
      await prisma.banner.create({
        data: {
          title: banner.title,
          url: banner.url,
          imagePath: bannerImagePath,
          imageUrl: bannerImageUrl
        }
      });
    }
  }

  const categoryFallback = categoryFallbackRelativePaths[0];
  if (categoryFallback) {
    const categories = await prisma.category.findMany({
      select: { id: true, imagePath: true }
    });

    for (const category of categories) {
      const exists = await fileExistsAtRelativePath(category.imagePath);
      if (exists) continue;

      await prisma.category.update({
        where: { id: category.id },
        data: {
          imagePath: categoryFallback,
          imageUrl: `/${categoryFallback}`
        }
      });
    }

    const subCategories = await prisma.subCategory.findMany({
      select: { id: true, imagePath: true }
    });

    for (const subCategory of subCategories) {
      const exists = await fileExistsAtRelativePath(subCategory.imagePath);
      if (exists) continue;

      await prisma.subCategory.update({
        where: { id: subCategory.id },
        data: {
          imagePath: categoryFallback,
          imageUrl: `/${categoryFallback}`
        }
      });
    }
  }

  const bannerFallback = relativeUploadPath('banners', seedBanners[0].fileName);
  const banners = await prisma.banner.findMany({
    select: { id: true, imagePath: true }
  });

  for (const banner of banners) {
    const exists = await fileExistsAtRelativePath(banner.imagePath);
    if (exists) continue;

    await prisma.banner.update({
      where: { id: banner.id },
      data: {
        imagePath: bannerFallback,
        imageUrl: `/${bannerFallback}`
      }
    });
  }

  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      imagePath: true,
      product: {
        select: {
          categoryId: true
        }
      }
    }
  });

  const defaultVariantFallback = productFallbackByCategoryId.values().next().value as
    | { relativePath: string; publicUrl: string }
    | undefined;

  for (const variant of variants) {
    const exists = await fileExistsAtRelativePath(variant.imagePath);
    if (exists) continue;

    const fallback =
      productFallbackByCategoryId.get(variant.product.categoryId) ?? defaultVariantFallback;
    if (!fallback) continue;

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        imagePath: fallback.relativePath,
        imageUrl: fallback.publicUrl
      }
    });
  }

  const [categoryCount, subCategoryCount, productCount, variantCount, bannerCount] =
    await Promise.all([
      prisma.category.count(),
      prisma.subCategory.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.banner.count()
    ]);

  console.log(
    `Storefront seed and media repair completed successfully. categories=${categoryCount}, subCategories=${subCategoryCount}, products=${productCount}, variants=${variantCount}, banners=${bannerCount}`
  );
};

seed()
  .catch((error) => {
    console.error('Storefront seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
