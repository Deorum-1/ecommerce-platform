
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

const categories = [
  { name: "Apparel", slug: "demo-apparel" },
  { name: "Accessories", slug: "demo-accessories" },
  { name: "Home & Living", slug: "demo-home-living" },
  { name: "Beauty", slug: "demo-beauty" },
];

const products = [
  {
    name: "Everyday Linen Shirt",
    slug: "demo-everyday-linen-shirt",
    categorySlug: "demo-apparel",
    description: "A breathable linen shirt for warm days.",
    price: 18500,
    inventoryQuantity: 18,
  },
  {
    name: "Classic Cotton Tee",
    slug: "demo-classic-cotton-tee",
    categorySlug: "demo-apparel",
    description: "A soft cotton essential in a relaxed fit.",
    price: 9500,
    inventoryQuantity: 4,
  },
  {
    name: "Tailored Weekend Trousers",
    slug: "demo-weekend-trousers",
    categorySlug: "demo-apparel",
    description: "Easy-wearing trousers with a clean, tailored shape.",
    price: 22000,
    inventoryQuantity: 11,
  },
  {
    name: "Canvas Market Tote",
    slug: "demo-canvas-market-tote",
    categorySlug: "demo-accessories",
    description: "A sturdy everyday tote with room for the essentials.",
    price: 7500,
    inventoryQuantity: 27,
  },
  {
    name: "Minimal Leather Wallet",
    slug: "demo-minimal-leather-wallet",
    categorySlug: "demo-accessories",
    description: "A compact wallet with a simple, practical layout.",
    price: 16000,
    inventoryQuantity: 9,
  },
  {
    name: "Beaded Statement Earrings",
    slug: "demo-beaded-earrings",
    categorySlug: "demo-accessories",
    description: "Lightweight, hand-finished statement earrings.",
    price: 6800,
    inventoryQuantity: 2,
  },
  {
    name: "Stoneware Coffee Mug",
    slug: "demo-stoneware-coffee-mug",
    categorySlug: "demo-home-living",
    description: "A glazed stoneware mug for the daily coffee ritual.",
    price: 6200,
    inventoryQuantity: 22,
  },
  {
    name: "Woven Table Runner",
    slug: "demo-woven-table-runner",
    categorySlug: "demo-home-living",
    description: "A textured table runner woven from natural fibres.",
    price: 12800,
    inventoryQuantity: 7,
  },
  {
    name: "Citrus Hand Balm",
    slug: "demo-citrus-hand-balm",
    categorySlug: "demo-beauty",
    description: "A nourishing hand balm with a fresh citrus scent.",
    price: 5400,
    inventoryQuantity: 31,
  },
  {
    name: "Shea Body Butter",
    slug: "demo-shea-body-butter",
    categorySlug: "demo-beauty",
    description: "A rich, fragrance-light body butter for daily use.",
    price: 8900,
    inventoryQuantity: 0,
  },
];

const customers = [
  {
    name: "Amara Okafor",
    email: "amara.okafor@example.test",
    phone: "+2348000000101",
  },
  {
    name: "Tunde Adebayo",
    email: "tunde.adebayo@example.test",
    phone: "+2348000000102",
  },
  {
    name: "Zainab Bello",
    email: "zainab.bello@example.test",
    phone: "+2348000000103",
  },
  {
    name: "Chidi Nwosu",
    email: "chidi.nwosu@example.test",
    phone: "+2348000000104",
  },
  {
    name: "Kemi Adeyemi",
    email: "kemi.adeyemi@example.test",
    phone: "+2348000000105",
  },
  {
    name: "Ifeoma Eze",
    email: "ifeoma.eze@example.test",
    phone: "+2348000000106",
  },
  {
    name: "Dayo Balogun",
    email: "dayo.balogun@example.test",
    phone: "+2348000000107",
  },
  {
    name: "Nneka Obi",
    email: "nneka.obi@example.test",
    phone: "+2348000000108",
  },
];

const discounts = [
  { code: "DEMO10", type: "PERCENTAGE", value: 10, minimumSubtotal: 15000 },
  { code: "WELCOME15", type: "PERCENTAGE", value: 15, minimumSubtotal: 25000 },
  {
    code: "DEMO2500",
    type: "FIXED_AMOUNT",
    value: 2500,
    minimumSubtotal: 12000,
  },
];

const orderPlans = [
  {
    status: "DELIVERED",
    customer: 0,
    items: [
      [0, 1],
      [3, 1],
    ],
    daysAgo: 2,
  },
  { status: "DELIVERED", customer: 1, items: [[6, 2]], daysAgo: 4 },
  {
    status: "SHIPPED",
    customer: 2,
    items: [
      [1, 2],
      [4, 1],
    ],
    daysAgo: 1,
  },
  {
    status: "PROCESSING",
    customer: 3,
    items: [
      [2, 1],
      [7, 1],
    ],
    daysAgo: 3,
  },
  {
    status: "PAID",
    customer: 4,
    items: [
      [8, 2],
      [9, 1],
    ],
    daysAgo: 5,
  },
  { status: "PENDING", customer: 5, items: [[0, 1]], daysAgo: 0 },
  { status: "CANCELLED", customer: 6, items: [[5, 1]], daysAgo: 8 },
  {
    status: "REFUNDED",
    customer: 7,
    items: [
      [3, 1],
      [6, 1],
    ],
    daysAgo: 11,
  },
  {
    status: "DELIVERED",
    customer: 2,
    items: [
      [4, 1],
      [8, 1],
    ],
    daysAgo: 13,
  },
  {
    status: "SHIPPED",
    customer: 0,
    items: [
      [1, 1],
      [2, 1],
    ],
    daysAgo: 7,
  },
  { status: "PROCESSING", customer: 5, items: [[7, 2]], daysAgo: 9 },
  {
    status: "PAID",
    customer: 1,
    items: [
      [0, 1],
      [5, 1],
    ],
    daysAgo: 15,
  },
  {
    status: "DELIVERED",
    customer: 3,
    items: [
      [6, 1],
      [9, 1],
    ],
    daysAgo: 19,
  },
  {
    status: "PENDING",
    customer: 6,
    items: [
      [2, 1],
      [3, 1],
    ],
    daysAgo: 0,
  },
  { status: "DELIVERED", customer: 4, items: [[8, 3]], daysAgo: 23 },
  { status: "CANCELLED", customer: 7, items: [[1, 1]], daysAgo: 26 },
];

function assertLocalDatabaseUrls() {
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const value = process.env[key];
    if (!value) {
      if (key === "DATABASE_URL") {
        throw new Error(
          "DATABASE_URL is not configured in the workspace .env.local.",
        );
      }
      continue;
    }

    const hostname = new URL(value).hostname.replace(/^\[|\]$/g, "");
    if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
      throw new Error(
        `${key} must point to a local database; refusing to seed a non-local database.`,
      );
    }
  }
}

async function findSeedTenant() {
  const tenantId = process.env.SEED_TENANT_ID;
  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("SEED_TENANT_ID does not match a local store.");
    }
    return tenant;
  }

  const tenants = await prisma.tenant.findMany({
    take: 2,
    orderBy: { createdAt: "asc" },
  });
  if (tenants.length !== 1) {
    throw new Error(
      tenants.length === 0
        ? "No local store exists yet. Create a store first, or set SEED_TENANT_ID."
        : "More than one local store exists. Set SEED_TENANT_ID to choose the demo store.",
    );
  }
  return tenants[0];
}

async function seedTenantDetails(tenant) {
  const updates = {};
  if (!tenant.description)
    updates.description =
      "A sample store populated with demo products and orders.";
  if (!tenant.contactEmail)
    updates.contactEmail = `hello@${tenant.slug}.example.test`;
  if (!tenant.website) updates.website = `https://${tenant.slug}.example.test`;
  if (!tenant.logoUrl)
    updates.logoUrl = "https://placehold.co/256x256?text=Demo+Store";

  if (Object.keys(updates).length > 0) {
    await prisma.tenant.update({ where: { id: tenant.id }, data: updates });
  }
}

async function seedDemoData() {
  assertLocalDatabaseUrls();
  const tenant = await findSeedTenant();
  const counts = {
    categories: 0,
    products: 0,
    customers: 0,
    orders: 0,
    discounts: 0,
  };

  await seedTenantDetails(tenant);

  const categoryIds = new Map();
  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: category.slug } },
    });
    const record =
      existing ??
      (await prisma.category.create({
        data: { tenantId: tenant.id, ...category },
      }));
    if (!existing) counts.categories += 1;
    categoryIds.set(category.slug, record.id);
  }

  const productRecords = [];
  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: product.slug } },
    });
    const record =
      existing ??
      (await prisma.product.create({
        data: {
          tenantId: tenant.id,
          categoryId: categoryIds.get(product.categorySlug),
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          inventoryQuantity: product.inventoryQuantity,
          imageUrls: [
            `https://placehold.co/640x640?text=${encodeURIComponent(product.name)}`,
          ],
          currency: tenant.currency,
          status: "PUBLISHED",
        },
      }));
    if (!existing) counts.products += 1;
    productRecords.push(record);
  }

  const customerRecords = [];
  for (const customer of customers) {
    const existing = await prisma.customer.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: customer.email } },
    });
    const record =
      existing ??
      (await prisma.customer.create({
        data: { tenantId: tenant.id, ...customer },
      }));
    if (!existing) counts.customers += 1;
    customerRecords.push(record);
  }

  for (const discount of discounts) {
    const existing = await prisma.discount.findUnique({
      where: { tenantId_code: { tenantId: tenant.id, code: discount.code } },
    });
    if (existing) continue;

    await prisma.discount.create({
      data: { tenantId: tenant.id, ...discount },
    });
    counts.discounts += 1;
  }

  const now = Date.now();
  for (let index = 0; index < orderPlans.length; index += 1) {
    const plan = orderPlans[index];
    const paymentReference = `demo-${tenant.slug}-${String(index + 1).padStart(3, "0")}`;
    const existing = await prisma.order.findUnique({
      where: { paymentReference },
    });
    if (existing) continue;

    const customer = customerRecords[plan.customer];
    const createdAt = new Date(now - plan.daysAgo * DAY);
    const orderItems = plan.items.map(([productIndex, quantity]) => ({
      product: productRecords[productIndex],
      quantity,
    }));
    const total = orderItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    const paidAt = [
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "REFUNDED",
    ].includes(plan.status)
      ? new Date(createdAt.getTime() + 30 * 60 * 1000)
      : undefined;

    await prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: `${12 + index} Demo Street`,
        shippingCity: ["Lagos", "Abuja", "Ibadan", "Port Harcourt"][index % 4],
        shippingState: ["Lagos", "FCT", "Oyo", "Rivers"][index % 4],
        paymentReference,
        status: plan.status,
        total,
        currency: tenant.currency,
        ...(paidAt ? { paidAt } : {}),
        createdAt,
        items: {
          create: orderItems.map(({ product, quantity }) => ({
            product: {
              connect: {
                tenantId_id: { tenantId: tenant.id, id: product.id },
              },
            },
            productName: product.name,
            quantity,
            unitPrice: product.price,
          })),
        },
      },
    });
    counts.orders += 1;
  }

  console.log(
    `Seeded local demo data for store "${tenant.name}" (${tenant.slug}).`,
  );
  console.log(
    `Created: ${Object.entries(counts)
      .map(([key, count]) => `${key}=${count}`)
      .join(", ")}`,
  );
}

seedDemoData()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
