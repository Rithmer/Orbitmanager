import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const hashedPassword = await argon2.hash('Admin123!');

  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password: hashedPassword,
      fullName: 'Администратор',
      profession: 'System Administrator',
      accountStatus: 'active',
      accountRole: 'admin',
    },
  });

  console.log('Seed completed: admin user created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
