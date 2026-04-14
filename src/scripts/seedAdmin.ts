import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { z } from 'zod';

import { prisma } from '../lib/prisma';

dotenv.config();

const seedAdminEnvSchema = z.object({
  ADMIN_SEED_EMAIL: z.string().trim().email('ADMIN_SEED_EMAIL must be a valid email'),
  ADMIN_SEED_PASSWORD: z
    .string()
    .min(8, 'ADMIN_SEED_PASSWORD must be at least 8 characters long'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12)
});

const run = async (): Promise<void> => {
  const parsed = seedAdminEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid seed admin env variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  const { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, BCRYPT_SALT_ROUNDS } = parsed.data;
  const normalizedAdminEmail = ADMIN_SEED_EMAIL.toLowerCase();

  const hashedPassword = await bcrypt.hash(ADMIN_SEED_PASSWORD, BCRYPT_SALT_ROUNDS);

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: normalizedAdminEmail }
  });

  if (existingAdmin) {
    await prisma.admin.update({
      where: { email: normalizedAdminEmail },
      data: {
        password: hashedPassword,
        isActive: true
      }
    });

    console.log('Admin already existed. Password has been updated securely.');
    return;
  }

  await prisma.admin.create({
    data: {
      email: normalizedAdminEmail,
      password: hashedPassword,
      isActive: true
    }
  });

  console.log('Admin created successfully.');
};

run()
  .catch((error) => {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
