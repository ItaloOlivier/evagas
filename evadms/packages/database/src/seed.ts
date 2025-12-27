// ============================================
// EVADMS Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Permissions
  console.log('Creating permissions...');
  const resources = [
    'users', 'customers', 'products', 'quotes', 'orders', 'schedule',
    'vehicles', 'drivers', 'inventory_cylinders', 'inventory_bulk',
    'checklists', 'pod', 'documents', 'incidents', 'ncrs', 'capas',
    'training', 'audits', 'assets', 'reports', 'audit_log'
  ];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export'];

  const permissions: { resource: string; action: string }[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push({ resource, action });
    }
  }

  await prisma.permission.createMany({
    data: permissions.map(p => ({
      resource: p.resource,
      action: p.action,
      description: `${p.action} access to ${p.resource}`,
    })),
    skipDuplicates: true,
  });

  // 2. Create Roles
  console.log('Creating roles...');
  const roles = [
    { name: 'admin', displayName: 'System Administrator', description: 'Full system access', isSystem: true },
    { name: 'owner', displayName: 'Owner/Director', description: 'Business oversight and approvals', isSystem: true },
    { name: 'compliance', displayName: 'Compliance Officer', description: 'Document control and compliance', isSystem: true },
    { name: 'supervisor', displayName: 'Supervisor', description: 'Depot operations oversight', isSystem: true },
    { name: 'dispatcher', displayName: 'Dispatcher', description: 'Scheduling and dispatch', isSystem: true },
    { name: 'sales', displayName: 'Sales/Admin', description: 'Customer and order management', isSystem: true },
    { name: 'operator', displayName: 'Depot Operator', description: 'Physical depot operations', isSystem: true },
    { name: 'driver', displayName: 'Driver', description: 'Deliveries and POD capture', isSystem: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 3. Assign permissions to roles
  console.log('Assigning permissions to roles...');

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [`${p.resource}:${p.action}`, p.id]));

  // Admin gets all permissions
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map(p => ({
        roleId: adminRole.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });
  }

  // Owner gets read all + approve
  const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } });
  if (ownerRole) {
    const ownerPermissions = allPermissions.filter(
      p => p.action === 'read' || p.action === 'approve' || p.action === 'export'
    );
    await prisma.rolePermission.createMany({
      data: ownerPermissions.map(p => ({
        roleId: ownerRole.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });
  }

  // Sales role permissions
  const salesRole = await prisma.role.findUnique({ where: { name: 'sales' } });
  if (salesRole) {
    const salesResources = ['customers', 'quotes', 'orders', 'products'];
    const salesPermissions = allPermissions.filter(
      p => salesResources.includes(p.resource) && ['create', 'read', 'update'].includes(p.action)
    );
    await prisma.rolePermission.createMany({
      data: salesPermissions.map(p => ({
        roleId: salesRole.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });
  }

  // Driver role permissions
  const driverRole = await prisma.role.findUnique({ where: { name: 'driver' } });
  if (driverRole) {
    const driverPermissions = allPermissions.filter(p =>
      (p.resource === 'orders' && p.action === 'read') ||
      (p.resource === 'pod' && ['create', 'read'].includes(p.action)) ||
      (p.resource === 'checklists' && ['create', 'read'].includes(p.action)) ||
      (p.resource === 'schedule' && p.action === 'read')
    );
    await prisma.rolePermission.createMany({
      data: driverPermissions.map(p => ({
        roleId: driverRole.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });
  }

  // 4. Create default admin user
  console.log('Creating default admin user...');
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@evagas.co.za' },
    update: {},
    create: {
      email: 'admin@evagas.co.za',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+27123456789',
      status: 'active',
      emailVerified: true,
    },
  });

  // Assign admin role to admin user
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  // 5. Create Products
  console.log('Creating products...');
  const products = [
    { sku: 'CYL-9KG', name: '9kg LPG Cylinder', productType: 'cylinder' as const, cylinderSizeKg: 9, unitPrice: 250, unitOfMeasure: 'each' },
    { sku: 'CYL-14KG', name: '14kg LPG Cylinder', productType: 'cylinder' as const, cylinderSizeKg: 14, unitPrice: 350, unitOfMeasure: 'each' },
    { sku: 'CYL-19KG', name: '19kg LPG Cylinder', productType: 'cylinder' as const, cylinderSizeKg: 19, unitPrice: 450, unitOfMeasure: 'each' },
    { sku: 'CYL-48KG', name: '48kg LPG Cylinder', productType: 'cylinder' as const, cylinderSizeKg: 48, unitPrice: 850, unitOfMeasure: 'each' },
    { sku: 'BULK-LPG', name: 'Bulk LPG', productType: 'bulk_lpg' as const, cylinderSizeKg: null, unitPrice: 18.50, unitOfMeasure: 'litre' },
    { sku: 'DEL-STD', name: 'Standard Delivery Fee', productType: 'delivery_fee' as const, cylinderSizeKg: null, unitPrice: 100, unitOfMeasure: 'trip' },
    { sku: 'DEL-EXP', name: 'Express Delivery Fee', productType: 'delivery_fee' as const, cylinderSizeKg: null, unitPrice: 200, unitOfMeasure: 'trip' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        name: product.name,
        productType: product.productType,
        cylinderSizeKg: product.cylinderSizeKg,
        unitPrice: product.unitPrice,
        unitOfMeasure: product.unitOfMeasure,
        vatApplicable: true,
        isActive: true,
      },
    });
  }

  // 6. Create Pricing Tiers
  console.log('Creating pricing tiers...');
  const tiers = [
    { name: 'retail', description: 'Standard retail pricing', discountPercentage: 0, isDefault: true },
    { name: 'b2b_standard', description: 'B2B standard pricing', discountPercentage: 5, isDefault: false },
    { name: 'b2b_premium', description: 'B2B premium pricing', discountPercentage: 10, isDefault: false },
    { name: 'wholesale', description: 'Wholesale pricing', discountPercentage: 15, isDefault: false },
  ];

  for (const tier of tiers) {
    await prisma.pricingTier.upsert({
      where: { name: tier.name },
      update: {},
      create: tier,
    });
  }

  // 7. Initialize Cylinder Stock Summary
  console.log('Initializing cylinder stock summary...');
  const sizes = ['kg9', 'kg14', 'kg19', 'kg48'] as const;
  const statuses = ['full', 'empty', 'quarantine', 'maintenance', 'issued', 'in_transit', 'at_customer'] as const;

  for (const size of sizes) {
    for (const status of statuses) {
      await prisma.cylinderStockSummary.upsert({
        where: {
          cylinderSize_status: {
            cylinderSize: size,
            status: status,
          },
        },
        update: {},
        create: {
          cylinderSize: size,
          status: status,
          quantity: 0,
        },
      });
    }
  }

  // 8. Create Checklist Templates
  console.log('Creating checklist templates...');

  // Loading Checklist
  const loadingTemplate = await prisma.checklistTemplate.upsert({
    where: { code: 'LOADING_OUTBOUND' },
    update: {},
    create: {
      code: 'LOADING_OUTBOUND',
      name: 'Outbound Loading Checklist',
      description: 'Must be completed before vehicle departs with delivery load',
      templateType: 'loading',
      isMandatory: true,
      blocksOnFailure: true,
      version: 1,
      status: 'active',
    },
  });

  // Loading checklist items
  const loadingItems = [
    { sequenceNumber: 1, questionText: 'Vehicle pre-trip inspection completed and passed?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 2, questionText: 'Vehicle registration number', itemType: 'text' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 3, questionText: 'Loading area clear of hazards?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 4, questionText: 'Cylinders visually inspected for damage before loading?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 5, questionText: '9kg Full cylinders loaded', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 6, questionText: '14kg Full cylinders loaded', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 7, questionText: '19kg Full cylinders loaded', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 8, questionText: '48kg Full cylinders loaded', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 9, questionText: 'Quantities match pick list/delivery notes?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 10, questionText: 'All cylinders secured with straps/restraints?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 11, questionText: 'Vehicle weight within legal limit?', itemType: 'yes_no_na' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 12, questionText: 'Delivery documentation on board?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 13, questionText: 'Driver has signed for load', itemType: 'signature' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 14, questionText: 'Photo of secured load', itemType: 'photo' as const, isMandatory: true, isCritical: false },
  ];

  for (const item of loadingItems) {
    await prisma.checklistItem.upsert({
      where: {
        id: `${loadingTemplate.id}-${item.sequenceNumber}`,
      },
      update: {},
      create: {
        id: `${loadingTemplate.id}-${item.sequenceNumber}`,
        templateId: loadingTemplate.id,
        ...item,
      },
    });
  }

  // Delivery Checklist
  const deliveryTemplate = await prisma.checklistTemplate.upsert({
    where: { code: 'DELIVERY_COMPLETE' },
    update: {},
    create: {
      code: 'DELIVERY_COMPLETE',
      name: 'Delivery Completion Checklist',
      description: 'Must be completed at each delivery stop',
      templateType: 'delivery',
      isMandatory: true,
      blocksOnFailure: false,
      version: 1,
      status: 'active',
    },
  });

  const deliveryItems = [
    { sequenceNumber: 1, questionText: 'Arrived at correct delivery address?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 2, questionText: 'Safe to deliver? (Access clear, no hazards)', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 3, questionText: 'Customer/authorized person present?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 4, questionText: 'Cylinders placed in safe location?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 5, questionText: 'Empty cylinders collected (9kg)', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 6, questionText: 'Empty cylinders collected (14kg)', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 7, questionText: 'Empty cylinders collected (19kg)', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 8, questionText: 'Empty cylinders collected (48kg)', itemType: 'number' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 9, questionText: 'Any safety advice given to customer?', itemType: 'yes_no_na' as const, isMandatory: false, isCritical: false },
    { sequenceNumber: 10, questionText: 'Delivery note signed by customer', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 11, questionText: 'Any issues or customer feedback?', itemType: 'text' as const, isMandatory: false, isCritical: false },
  ];

  for (const item of deliveryItems) {
    await prisma.checklistItem.upsert({
      where: {
        id: `${deliveryTemplate.id}-${item.sequenceNumber}`,
      },
      update: {},
      create: {
        id: `${deliveryTemplate.id}-${item.sequenceNumber}`,
        templateId: deliveryTemplate.id,
        ...item,
      },
    });
  }

  // Vehicle Pre-Trip Checklist
  const vehicleCheckTemplate = await prisma.checklistTemplate.upsert({
    where: { code: 'VEHICLE_PRETRIP' },
    update: {},
    create: {
      code: 'VEHICLE_PRETRIP',
      name: 'Vehicle Pre-Trip Inspection',
      description: 'Daily vehicle safety check before departure',
      templateType: 'vehicle_check',
      isMandatory: true,
      blocksOnFailure: true,
      version: 1,
      status: 'active',
    },
  });

  const vehicleCheckItems = [
    { sequenceNumber: 1, questionText: 'Vehicle exterior condition satisfactory?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 2, questionText: 'Tyres in good condition (tread depth, pressure)?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 3, questionText: 'All lights working (headlights, indicators, brake lights)?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 4, questionText: 'Windscreen and mirrors clean and undamaged?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 5, questionText: 'Brakes functioning correctly?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 6, questionText: 'Fluid levels checked (oil, coolant, washer)?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 7, questionText: 'Fire extinguisher present and in date?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 8, questionText: 'First aid kit present?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 9, questionText: 'Reflective triangles present?', itemType: 'yes_no' as const, isMandatory: true, isCritical: false },
    { sequenceNumber: 10, questionText: 'License disc valid?', itemType: 'yes_no' as const, isMandatory: true, isCritical: true },
    { sequenceNumber: 11, questionText: 'Odometer reading', itemType: 'reading' as const, isMandatory: true, isCritical: false, unitOfMeasure: 'km' },
    { sequenceNumber: 12, questionText: 'Any issues noted?', itemType: 'text' as const, isMandatory: false, isCritical: false },
  ];

  for (const item of vehicleCheckItems) {
    await prisma.checklistItem.upsert({
      where: {
        id: `${vehicleCheckTemplate.id}-${item.sequenceNumber}`,
      },
      update: {},
      create: {
        id: `${vehicleCheckTemplate.id}-${item.sequenceNumber}`,
        templateId: vehicleCheckTemplate.id,
        sequenceNumber: item.sequenceNumber,
        questionText: item.questionText,
        itemType: item.itemType,
        isMandatory: item.isMandatory,
        isCritical: item.isCritical,
        unitOfMeasure: 'unitOfMeasure' in item ? item.unitOfMeasure : null,
      },
    });
  }

  // 9. Create sample customers for testing
  console.log('Creating sample customers...');

  const sampleCustomers = [
    {
      accountNumber: 'EVA-C-00001',
      companyName: 'ABC Hardware',
      customerType: 'b2b' as const,
      primaryContactName: 'Mike Manager',
      primaryPhone: '+27123456789',
      primaryEmail: 'mike@abchardware.co.za',
      status: 'active' as const,
    },
    {
      accountNumber: 'EVA-C-00002',
      companyName: null,
      customerType: 'retail' as const,
      primaryContactName: 'John Smith',
      primaryPhone: '+27123456790',
      primaryEmail: 'john.smith@email.com',
      status: 'active' as const,
    },
    {
      accountNumber: 'EVA-C-00003',
      companyName: 'Riverside Restaurant',
      customerType: 'b2b' as const,
      primaryContactName: 'Sarah Chef',
      primaryPhone: '+27123456791',
      primaryEmail: 'sarah@riverside.co.za',
      status: 'active' as const,
    },
  ];

  for (const customer of sampleCustomers) {
    const created = await prisma.customer.upsert({
      where: { accountNumber: customer.accountNumber },
      update: {},
      create: customer,
    });

    // Create a site for each customer
    await prisma.customerSite.upsert({
      where: { id: `${created.id}-site-1` },
      update: {},
      create: {
        id: `${created.id}-site-1`,
        customerId: created.id,
        siteName: 'Main Location',
        isPrimary: true,
        streetAddress: '123 Main Street',
        city: 'Brits',
        province: 'North West',
        postalCode: '0250',
      },
    });
  }

  // 10. Create sample vehicles
  console.log('Creating sample vehicles...');

  const vehicles = [
    { registrationNumber: 'ND 123 GP', vehicleType: 'cylinder_truck' as const, make: 'Isuzu', model: 'NPR', cylinderCapacityUnits: 100 },
    { registrationNumber: 'ND 456 GP', vehicleType: 'cylinder_truck' as const, make: 'Hino', model: '300', cylinderCapacityUnits: 80 },
    { registrationNumber: 'BT 789 NW', vehicleType: 'bulk_tanker' as const, make: 'Mercedes', model: 'Actros', bulkCapacityLitres: 20000 },
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { registrationNumber: vehicle.registrationNumber },
      update: {},
      create: {
        ...vehicle,
        status: 'available',
      },
    });
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
