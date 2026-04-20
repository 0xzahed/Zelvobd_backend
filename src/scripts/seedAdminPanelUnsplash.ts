import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Prisma, ProductStatus } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { backendRootPath, uploadRootPath } from '../utils/paths';

type ProductVariantSeed = {
  actualPrice: number;
  discountedPrice: number;
  color: string;
  size: string;
  imageUrl: string;
  imageFileName: string;
};

type ProductSeed = {
  title: string;
  slug: string;
  description: string;
  extraDescription: string;
  weight: string;
  material: string;
  status: ProductStatus;
  stock: boolean;
  availability: boolean;
  variant: ProductVariantSeed;
};

type CategorySeed = {
  title: string;
  imageUrl: string;
  imageFileName: string;
  subCategoryTitle: string;
  product: ProductSeed;
};

type BannerSeed = {
  title: string;
  url: string;
  imageUrl: string;
  imageFileName: string;
};

const categoriesUploadDir = path.join(uploadRootPath, 'categories');
const bannersUploadDir = path.join(uploadRootPath, 'banners');
const productImagesUploadDir = path.join(uploadRootPath, 'products', 'images');

const categorySeeds: CategorySeed[] = [
  {
    title: 'Mobile',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    imageFileName: 'unsplash-category-mobile.jpg',
    subCategoryTitle: 'Flagship',
    product: {
      title: 'Galaxy S24 Ultra 5G',
      slug: 'admin-seed-galaxy-s24-ultra-5g',
      description:
        'Premium flagship smartphone with advanced camera, smooth display, and all-day battery backup.',
      extraDescription:
        'Ideal for power users, gaming, and mobile photography with stable performance and stylish design.',
      weight: '232g',
      material: 'Aluminum + Gorilla Glass',
      status: ProductStatus.PENDING,
      stock: true,
      availability: true,
      variant: {
        actualPrice: 165000,
        discountedPrice: 149500,
        color: 'Titanium Black',
        size: '12GB/256GB',
        imageUrl:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80',
        imageFileName: 'unsplash-product-galaxy-s24-ultra.jpg'
      }
    }
  },
  {
    title: 'Laptop',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    imageFileName: 'unsplash-category-laptop.jpg',
    subCategoryTitle: 'Ultrabook',
    product: {
      title: 'Dell XPS 13 Plus',
      slug: 'admin-seed-dell-xps-13-plus',
      description:
        'Slim ultrabook with sharp display, fast SSD, and lightweight design for professional work.',
      extraDescription:
        'Excellent for coding, office productivity, and travel with premium build quality and quiet performance.',
      weight: '1.24kg',
      material: 'CNC Aluminum',
      status: ProductStatus.PENDING,
      stock: true,
      availability: true,
      variant: {
        actualPrice: 189000,
        discountedPrice: 172000,
        color: 'Platinum Silver',
        size: '16GB/512GB',
        imageUrl:
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=80',
        imageFileName: 'unsplash-product-dell-xps-13-plus.jpg'
      }
    }
  },
  {
    title: 'Headphone',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    imageFileName: 'unsplash-category-headphone.jpg',
    subCategoryTitle: 'Noise Cancelling',
    product: {
      title: 'Sony WH-1000XM5',
      slug: 'admin-seed-sony-wh-1000xm5',
      description:
        'Wireless over-ear headphone with industry-leading noise cancellation and rich balanced sound.',
      extraDescription:
        'Comfortable earcups with long battery life suitable for calls, meetings, and long listening sessions.',
      weight: '250g',
      material: 'ABS + Soft Cushion',
      status: ProductStatus.PENDING,
      stock: true,
      availability: true,
      variant: {
        actualPrice: 46000,
        discountedPrice: 41900,
        color: 'Matte Black',
        size: 'Standard',
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80',
        imageFileName: 'unsplash-product-sony-wh-1000xm5.jpg'
      }
    }
  },
  {
    title: 'Smart Watch',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    imageFileName: 'unsplash-category-smart-watch.jpg',
    subCategoryTitle: 'Fitness',
    product: {
      title: 'Garmin Venu 3',
      slug: 'admin-seed-garmin-venu-3',
      description:
        'Fitness smartwatch with AMOLED display, health tracking sensors, and dependable battery performance.',
      extraDescription:
        'Tracks heart rate, sleep, and activity while syncing quickly with your smartphone for daily insights.',
      weight: '46g',
      material: 'Fiber-reinforced Polymer',
      status: ProductStatus.PENDING,
      stock: true,
      availability: true,
      variant: {
        actualPrice: 58000,
        discountedPrice: 52900,
        color: 'Slate',
        size: '45mm',
        imageUrl:
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1400&q=80',
        imageFileName: 'unsplash-product-garmin-venu-3.jpg'
      }
    }
  },
  {
    title: 'Camera',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    imageFileName: 'unsplash-category-camera.jpg',
    subCategoryTitle: 'Mirrorless',
    product: {
      title: 'Sony Alpha A7 IV',
      slug: 'admin-seed-sony-alpha-a7-iv',
      description:
        'Full-frame mirrorless camera with high detail output, reliable autofocus, and professional video quality.',
      extraDescription:
        'Great for creators and photographers who need flexible shooting performance for studio and outdoor use.',
      weight: '658g',
      material: 'Magnesium Alloy',
      status: ProductStatus.PENDING,
      stock: true,
      availability: true,
      variant: {
        actualPrice: 325000,
        discountedPrice: 309000,
        color: 'Black',
        size: 'Body Only',
        imageUrl:
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
        imageFileName: 'unsplash-product-sony-alpha-a7-iv.jpg'
      }
    }
  },
  {
    title: 'Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80',
    imageFileName: 'unsplash-category-tablet.jpg',
    subCategoryTitle: 'Android',
    product: {
      title: 'Samsung Galaxy Tab S9',
      slug: 'admin-seed-galaxy-tab-s9',
      description:
        'Premium Android tablet with vivid display, fast chipset, and smooth multitasking support.',
      extraDescription:
        'Suitable for study, media, and light productivity with stylus support and durable build quality.',
      weight: '498g',
      material: 'Armor Aluminum',
      status: ProductStatus.PENDING,
      stock: true,
      availability: true,
      variant: {
        actualPrice: 98000,
        discountedPrice: 91900,
        color: 'Graphite',
        size: '8GB/128GB',
        imageUrl:
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1400&q=80',
        imageFileName: 'unsplash-product-galaxy-tab-s9.jpg'
      }
    }
  }
];

const bannerSeeds: BannerSeed[] = [
  {
    title: 'Unsplash Tech Banner 1',
    url: '/',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=80',
    imageFileName: 'unsplash-banner-tech-1.jpg'
  },
  {
    title: 'Unsplash Tech Banner 2',
    url: '/categories',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=1800&q=80',
    imageFileName: 'unsplash-banner-tech-2.jpg'
  }
];

const normalizeSlashPath = (value: string) => value.split(path.sep).join('/');
const relativeUploadPath = (...segments: string[]) => normalizeSlashPath(path.join('upload', ...segments));
const publicUploadUrl = (...segments: string[]) => `/${relativeUploadPath(...segments)}`;

const ensureDirectory = async (directoryPath: string) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const downloadImage = async (url: string, destinationPath: string): Promise<void> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'readmart-admin-seed-script'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download image. url=${url} status=${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destinationPath, Buffer.from(arrayBuffer));
};

const downloadImageIfMissing = async (url: string, destinationPath: string): Promise<void> => {
  try {
    const stat = await fs.stat(destinationPath);
    if (stat.size > 0) {
      return;
    }
  } catch {
    // File does not exist yet.
  }

  await downloadImage(url, destinationPath);
};

const textToDelta = (text: string): Prisma.InputJsonValue => ({
  ops: [
    {
      insert: text.endsWith('\n') ? text : `${text}\n`
    }
  ]
});

const textToHtml = (text: string): string => {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  return `<p>${escaped}</p>`;
};

const seedAdminPanelCatalogFromUnsplash = async () => {
  await ensureDirectory(categoriesUploadDir);
  await ensureDirectory(bannersUploadDir);
  await ensureDirectory(productImagesUploadDir);

  for (const categorySeed of categorySeeds) {
    const categoryDestinationPath = path.join(categoriesUploadDir, categorySeed.imageFileName);
    const productDestinationPath = path.join(
      productImagesUploadDir,
      categorySeed.product.variant.imageFileName
    );

    await downloadImageIfMissing(categorySeed.imageUrl, categoryDestinationPath);
    await downloadImageIfMissing(categorySeed.product.variant.imageUrl, productDestinationPath);

    const categoryImagePath = relativeUploadPath('categories', categorySeed.imageFileName);
    const categoryImageUrl = publicUploadUrl('categories', categorySeed.imageFileName);

    const productImagePath = relativeUploadPath(
      'products',
      'images',
      categorySeed.product.variant.imageFileName
    );
    const productImageUrl = publicUploadUrl(
      'products',
      'images',
      categorySeed.product.variant.imageFileName
    );

    const category = await prisma.category.upsert({
      where: {
        title: categorySeed.title
      },
      update: {
        imagePath: categoryImagePath,
        imageUrl: categoryImageUrl
      },
      create: {
        title: categorySeed.title,
        imagePath: categoryImagePath,
        imageUrl: categoryImageUrl
      }
    });

    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        categoryId: category.id,
        title: categorySeed.subCategoryTitle
      },
      select: {
        id: true
      }
    });

    const subCategory = existingSubCategory
      ? await prisma.subCategory.update({
          where: { id: existingSubCategory.id },
          data: {
            imagePath: categoryImagePath,
            imageUrl: categoryImageUrl
          }
        })
      : await prisma.subCategory.create({
          data: {
            categoryId: category.id,
            title: categorySeed.subCategoryTitle,
            imagePath: categoryImagePath,
            imageUrl: categoryImageUrl
          }
        });

    const productDescriptionDelta = textToDelta(categorySeed.product.description);
    const productDescriptionHtml = textToHtml(categorySeed.product.description);
    const extraDescriptionDelta = textToDelta(categorySeed.product.extraDescription);
    const extraDescriptionHtml = textToHtml(categorySeed.product.extraDescription);

    const product = await prisma.product.upsert({
      where: {
        slug: categorySeed.product.slug
      },
      update: {
        categoryId: category.id,
        subCategoryId: subCategory.id,
        title: categorySeed.product.title,
        descriptionDelta: productDescriptionDelta,
        descriptionHtml: productDescriptionHtml,
        extraDescriptionDelta,
        extraDescriptionHtml,
        weight: categorySeed.product.weight,
        material: categorySeed.product.material,
        stock: categorySeed.product.stock,
        availability: categorySeed.product.availability,
        status: categorySeed.product.status,
        isFreeDelivery: false
      },
      create: {
        categoryId: category.id,
        subCategoryId: subCategory.id,
        title: categorySeed.product.title,
        slug: categorySeed.product.slug,
        descriptionDelta: productDescriptionDelta,
        descriptionHtml: productDescriptionHtml,
        extraDescriptionDelta,
        extraDescriptionHtml,
        weight: categorySeed.product.weight,
        material: categorySeed.product.material,
        stock: categorySeed.product.stock,
        availability: categorySeed.product.availability,
        status: categorySeed.product.status,
        isFreeDelivery: false
      }
    });

    await prisma.productVariant.deleteMany({
      where: {
        productId: product.id
      }
    });

    await prisma.productVariant.create({
      data: {
        productId: product.id,
        actualPrice: new Prisma.Decimal(categorySeed.product.variant.actualPrice),
        discountedPrice: new Prisma.Decimal(categorySeed.product.variant.discountedPrice),
        color: categorySeed.product.variant.color,
        size: categorySeed.product.variant.size,
        imagePath: productImagePath,
        imageUrl: productImageUrl
      }
    });
  }

  for (const bannerSeed of bannerSeeds) {
    const bannerDestinationPath = path.join(bannersUploadDir, bannerSeed.imageFileName);
    await downloadImageIfMissing(bannerSeed.imageUrl, bannerDestinationPath);

    const imagePath = relativeUploadPath('banners', bannerSeed.imageFileName);
    const imageUrl = publicUploadUrl('banners', bannerSeed.imageFileName);

    const existingBanner = await prisma.banner.findFirst({
      where: {
        title: bannerSeed.title
      },
      select: {
        id: true
      }
    });

    if (existingBanner) {
      await prisma.banner.update({
        where: {
          id: existingBanner.id
        },
        data: {
          url: bannerSeed.url,
          imagePath,
          imageUrl
        }
      });
    } else {
      await prisma.banner.create({
        data: {
          title: bannerSeed.title,
          url: bannerSeed.url,
          imagePath,
          imageUrl
        }
      });
    }
  }

  const [categoryCount, subCategoryCount, productCount, variantCount, bannerCount] =
    await Promise.all([
      prisma.category.count(),
      prisma.subCategory.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.banner.count()
    ]);

  console.log('Unsplash admin-panel seed completed');
  console.log({
    backendRootPath,
    categoryCount,
    subCategoryCount,
    productCount,
    variantCount,
    bannerCount
  });
};

seedAdminPanelCatalogFromUnsplash()
  .catch((error) => {
    console.error('Unsplash admin-panel seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
