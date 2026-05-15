import "dotenv/config";
import { BillingCycle, PlanTier, PrismaClient, UserRole } from "@nepthok/database";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123456", 12);

  await prisma.user.upsert({
    where: { email: "admin@nepthok.com" },
    update: {},
    create: {
      email: "admin@nepthok.com",
      password: passwordHash,
      name: "Nepthok Admin",
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
  });
  console.log("Seeded: admin@nepthok.com");

  await prisma.plan.upsert({
    where: { slug: "basic" },
    update: {},
    create: {
      name: "Basic",
      slug: "basic",
      tier: PlanTier.BASIC,
      price: 999,
      billingCycle: BillingCycle.MONTHLY,
      maxProducts: 50,
      features: [
        "product_management",
        "order_management",
        "inventory_management",
        "store_profile",
      ],
      isActive: true,
    },
  });
  console.log("Seeded: plan basic (NPR 999/month)");

  await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      tier: PlanTier.PRO,
      price: 2499,
      billingCycle: BillingCycle.MONTHLY,
      maxProducts: null,
      features: [
        "product_management",
        "order_management",
        "inventory_management",
        "store_profile",
        "analytics",
        "discount_codes",
        "csv_exports",
        "sms_messaging",
      ],
      isActive: true,
    },
  });
  console.log("Seeded: plan pro (NPR 2499/month)");

  const categories = [
    { name: "Phone Cases", slug: "phone-cases" },
    { name: "Chargers & Cables", slug: "chargers-cables" },
    { name: "Screen Protectors", slug: "screen-protectors" },
    { name: "Earphones & Headphones", slug: "earphones-headphones" },
    { name: "Power Banks", slug: "power-banks" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, isActive: true },
    });
    console.log(`Seeded: category ${cat.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
