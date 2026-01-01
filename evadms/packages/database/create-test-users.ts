import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  const password = await bcrypt.hash('Test123!', 12);

  const testUsers = [
    { email: 'owner@evagas.co.za', firstName: 'Johan', lastName: 'Van der Berg', role: 'owner' },
    { email: 'compliance@evagas.co.za', firstName: 'Sarah', lastName: 'Naidoo', role: 'compliance' },
    { email: 'supervisor@evagas.co.za', firstName: 'Thabo', lastName: 'Mokoena', role: 'supervisor' },
    { email: 'dispatcher@evagas.co.za', firstName: 'Pieter', lastName: 'Du Plessis', role: 'dispatcher' },
    { email: 'sales@evagas.co.za', firstName: 'Lerato', lastName: 'Molefe', role: 'sales' },
    { email: 'operator@evagas.co.za', firstName: 'Sipho', lastName: 'Dlamini', role: 'operator' },
    { email: 'driver@evagas.co.za', firstName: 'David', lastName: 'Botha', role: 'driver' },
    { email: 'driver2@evagas.co.za', firstName: 'James', lastName: 'Ngcobo', role: 'driver' },
  ];

  console.log('Creating test users...\n');

  for (const userData of testUsers) {
    // Get the role
    const role = await prisma.role.findUnique({ where: { name: userData.role } });
    if (!role) {
      console.log(`Role ${userData.role} not found, skipping ${userData.email}`);
      continue;
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: password,
      },
      create: {
        email: userData.email,
        passwordHash: password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: '+27' + Math.floor(100000000 + Math.random() * 900000000),
        status: 'active',
        emailVerified: true,
      },
    });

    // Assign role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });

    // If driver role, also create a Driver record
    if (userData.role === 'driver') {
      await prisma.driver.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          licenseNumber: 'DL' + Math.floor(100000 + Math.random() * 900000),
          licenseCode: 'C1',
          licenseExpiry: new Date('2027-12-31'),
        },
      });
    }

    console.log(`Created: ${userData.email} (${userData.role})`);
  }

  console.log('\n========================================');
  console.log('TEST USER CREDENTIALS');
  console.log('========================================');
  console.log('Password for all test users: Test123!');
  console.log('');
  console.log('Users created:');
  testUsers.forEach(u => {
    console.log(`  ${u.role.padEnd(12)} : ${u.email}`);
  });
  console.log('========================================');
}

createTestUsers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
