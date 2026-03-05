import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rhythia.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@rhythia.com',
      passwordHash: await hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'mapper@rhythia.com' },
    update: {},
    create: {
      username: 'mapper1',
      email: 'mapper@rhythia.com',
      passwordHash: await hashPassword('mapper123'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'artist@rhythia.com' },
    update: {},
    create: {
      username: 'artist1',
      email: 'artist@rhythia.com',
      passwordHash: await hashPassword('artist123'),
    },
  });

  console.log('✓ Users created:', { admin: admin.username, user1: user1.username, user2: user2.username });

  // Create sample maps (don't actually create them for seeding)
  console.log('✓ Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
