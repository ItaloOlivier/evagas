// ============================================
// EVADMS Sample Data Seed Script
// Adds sample orders, quotes, inventory for demo
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

function futureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

async function main() {
  console.log('🌱 Starting sample data seed...');

  // Get admin user for relations
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@evagas.co.za' },
  });
  if (!adminUser) {
    throw new Error('Admin user not found. Run main seed first.');
  }

  // Get customers
  const customers = await prisma.customer.findMany({
    include: { sites: true },
  });
  if (customers.length === 0) {
    throw new Error('No customers found. Run main seed first.');
  }

  // Get products
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    throw new Error('No products found. Run main seed first.');
  }

  // Get vehicles
  const vehicles = await prisma.vehicle.findMany();

  // 1. Update cylinder stock with actual quantities
  console.log('Updating cylinder stock...');
  const stockUpdates = [
    { cylinderSize: 'kg9' as const, status: 'full' as const, quantity: 150 },
    { cylinderSize: 'kg9' as const, status: 'empty' as const, quantity: 45 },
    { cylinderSize: 'kg14' as const, status: 'full' as const, quantity: 120 },
    { cylinderSize: 'kg14' as const, status: 'empty' as const, quantity: 30 },
    { cylinderSize: 'kg19' as const, status: 'full' as const, quantity: 80 },
    { cylinderSize: 'kg19' as const, status: 'empty' as const, quantity: 25 },
    { cylinderSize: 'kg48' as const, status: 'full' as const, quantity: 40 },
    { cylinderSize: 'kg48' as const, status: 'empty' as const, quantity: 15 },
    { cylinderSize: 'kg9' as const, status: 'in_transit' as const, quantity: 20 },
    { cylinderSize: 'kg14' as const, status: 'in_transit' as const, quantity: 15 },
    { cylinderSize: 'kg19' as const, status: 'in_transit' as const, quantity: 10 },
  ];

  for (const stock of stockUpdates) {
    await prisma.cylinderStockSummary.updateMany({
      where: {
        cylinderSize: stock.cylinderSize,
        status: stock.status,
      },
      data: { quantity: stock.quantity },
    });
  }

  // 2. Create sample quotes
  console.log('Creating sample quotes...');
  const quoteStatuses = ['draft', 'sent', 'accepted', 'rejected', 'converted'] as const;
  const cylinder9 = products.find(p => p.sku === 'CYL-9KG');
  const cylinder14 = products.find(p => p.sku === 'CYL-14KG');

  for (let i = 1; i <= 12; i++) {
    const customer = customers[i % customers.length];
    const site = customer.sites[0];
    const status = quoteStatuses[i % quoteStatuses.length];
    const quoteNumber = `QT-${String(i).padStart(5, '0')}`;

    const existingQuote = await prisma.quote.findUnique({ where: { quoteNumber } });
    if (existingQuote) continue;

    const items = [
      { productId: cylinder9!.id, quantity: 5 + (i % 10), unitPrice: 250 },
      { productId: cylinder14!.id, quantity: 3 + (i % 5), unitPrice: 350 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: customer.id,
        siteId: site?.id,
        status,
        subtotal,
        vatAmount,
        total,
        issuedDate: randomDate(30),
        validUntil: futureDate(30),
        createdById: adminUser.id,
        notes: `Sample quote ${i}`,
      },
    });

    // Create quote items
    for (let j = 0; j < items.length; j++) {
      await prisma.quoteItem.create({
        data: {
          quoteId: quote.id,
          productId: items[j].productId,
          quantity: items[j].quantity,
          unitPrice: items[j].unitPrice,
          lineTotal: items[j].quantity * items[j].unitPrice,
          sortOrder: j,
        },
      });
    }
  }

  // 3. Create sample orders
  console.log('Creating sample orders...');
  const orderStatuses = [
    'created', 'scheduled', 'prepared', 'dispatched',
    'in_transit', 'delivered', 'delivered', 'closed'
  ] as const;
  const paymentStatuses = ['pending', 'paid', 'partial'] as const;

  for (let i = 1; i <= 25; i++) {
    const customer = customers[i % customers.length];
    const site = customer.sites[0];
    if (!site) continue;

    const status = orderStatuses[i % orderStatuses.length];
    const orderNumber = `ORD-${String(i).padStart(5, '0')}`;

    const existingOrder = await prisma.order.findUnique({ where: { orderNumber } });
    if (existingOrder) continue;

    const items = [
      { product: cylinder9!, quantity: 2 + (i % 8) },
      { product: cylinder14!, quantity: 1 + (i % 4) },
    ];
    const subtotal = items.reduce((sum, item) =>
      sum + item.quantity * Number(item.product.unitPrice), 0);
    const deliveryFee = 100;
    const vatAmount = (subtotal + deliveryFee) * 0.15;
    const total = subtotal + deliveryFee + vatAmount;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        siteId: site.id,
        orderType: 'cylinder_delivery',
        status,
        paymentStatus: paymentStatuses[i % paymentStatuses.length],
        subtotal,
        deliveryFee,
        vatAmount,
        total,
        requestedDate: randomDate(7),
        scheduledDate: status !== 'created' ? randomDate(3) : null,
        completedAt: ['delivered', 'closed'].includes(status) ? randomDate(1) : null,
        createdById: adminUser.id,
        notes: `Sample order ${i}`,
      },
    });

    // Create order items
    for (let j = 0; j < items.length; j++) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: items[j].product.id,
          quantityOrdered: items[j].quantity,
          quantityDelivered: ['delivered', 'closed'].includes(status) ? items[j].quantity : 0,
          unitPrice: items[j].product.unitPrice,
          lineTotal: items[j].quantity * Number(items[j].product.unitPrice),
          emptiesExpected: items[j].quantity,
          emptiesCollected: ['delivered', 'closed'].includes(status) ? items[j].quantity : 0,
          sortOrder: j,
        },
      });
    }
  }

  // 4. Create sample schedule runs
  console.log('Creating sample schedule runs...');
  const runStatuses = ['planned', 'ready', 'in_progress', 'completed'] as const;

  for (let i = 1; i <= 8; i++) {
    const runNumber = `RUN-${String(i).padStart(5, '0')}`;
    const existingRun = await prisma.scheduleRun.findUnique({ where: { runNumber } });
    if (existingRun) continue;

    const status = runStatuses[i % runStatuses.length];
    const runDate = new Date();
    runDate.setDate(runDate.getDate() - (i % 5) + 2);

    await prisma.scheduleRun.create({
      data: {
        runNumber,
        runDate,
        vehicleId: vehicles[i % vehicles.length]?.id,
        runType: 'delivery',
        status,
        plannedStartTime: '08:00',
        actualStartTime: ['in_progress', 'completed'].includes(status) ? new Date() : null,
        actualEndTime: status === 'completed' ? new Date() : null,
        totalStops: 3 + (i % 5),
        completedStops: status === 'completed' ? 3 + (i % 5) : (status === 'in_progress' ? Math.floor((3 + (i % 5)) / 2) : 0),
        createdById: adminUser.id,
        notes: `Delivery run ${i}`,
      },
    });
  }

  // 5. Create sample cylinder movements
  console.log('Creating sample cylinder movements...');
  const movementTypes = ['deliver', 'collect_empty', 'refill', 'issue'] as const;

  for (let i = 1; i <= 20; i++) {
    const movementRef = `MOV-${String(i).padStart(6, '0')}`;
    const existingMovement = await prisma.cylinderMovement.findUnique({ where: { movementRef } });
    if (existingMovement) continue;

    const sizes = ['kg9', 'kg14', 'kg19', 'kg48'] as const;
    await prisma.cylinderMovement.create({
      data: {
        movementRef,
        cylinderSize: sizes[i % sizes.length],
        movementType: movementTypes[i % movementTypes.length],
        fromStatus: 'full',
        toStatus: i % 2 === 0 ? 'empty' : 'in_transit',
        quantity: 2 + (i % 10),
        recordedAt: randomDate(7),
        recordedById: adminUser.id,
        reason: `Sample movement ${i}`,
      },
    });
  }

  // 6. Create sample refill batches
  console.log('Creating sample refill batches...');
  const batchStatuses = ['created', 'filling', 'qc', 'stocked'] as const;

  for (let i = 1; i <= 6; i++) {
    const batchRef = `BATCH-${String(i).padStart(5, '0')}`;
    const existingBatch = await prisma.cylinderRefillBatch.findUnique({ where: { batchRef } });
    if (existingBatch) continue;

    const sizes = ['kg9', 'kg14', 'kg19'] as const;
    const status = batchStatuses[i % batchStatuses.length];

    await prisma.cylinderRefillBatch.create({
      data: {
        batchRef,
        cylinderSize: sizes[i % sizes.length],
        quantity: 10 + (i * 5),
        status,
        passedCount: status === 'stocked' ? 10 + (i * 5) : 0,
        createdById: adminUser.id,
        stockedAt: status === 'stocked' ? randomDate(2) : null,
        notes: `Refill batch ${i}`,
      },
    });
  }

  // 7. Create a bulk tank if not exists
  console.log('Creating bulk tank...');
  const existingTank = await prisma.tank.findUnique({ where: { tankCode: 'TANK-001' } });
  if (!existingTank) {
    await prisma.tank.create({
      data: {
        tankCode: 'TANK-001',
        name: 'Main Storage Tank',
        locationDescription: 'Depot main yard',
        capacityLitres: 50000,
        minLevelLitres: 5000,
        reorderLevelLitres: 15000,
        currentLevelLitres: 32500,
        status: 'active',
      },
    });
  }

  console.log('✅ Sample data seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Sample data seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
