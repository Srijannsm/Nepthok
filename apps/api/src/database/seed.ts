import "dotenv/config";
import {
  BillingCycle,
  PlanTier,
  PrismaClient,
  ProductStatus,
  SubscriptionStatus,
  TenantStatus,
  UserRole,
} from "@nepthok/database";
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

  const catRecords: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, isActive: true },
    });
    catRecords[cat.slug] = record.id;
    console.log(`Seeded: category ${cat.name}`);
  }

  // ── Plans (needed for subscriptions) ─────────────────────────────────────
  const basicPlan = await prisma.plan.findUnique({ where: { slug: "basic" } });
  const proPlan   = await prisma.plan.findUnique({ where: { slug: "pro" } });
  if (!basicPlan || !proPlan) throw new Error("Run seed again — plans not found");

  // ── Sellers ───────────────────────────────────────────────────────────────
  const sellerPassword = await bcrypt.hash("Seller@123456", 12);
  const periodStart = new Date();
  const periodEnd   = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const sellers = [
    {
      email: "admin@chargenepal.com",
      name: "ChargeNepal Admin",
      tenant: { name: "ChargeNepal", slug: "chargenepal", description: "Nepal's #1 fast-charger store. Verified since 2022." },
      planSlug: "pro",
    },
    {
      email: "admin@casehub.com",
      name: "CaseHub Admin",
      tenant: { name: "CaseHub", slug: "casehub", description: "Premium phone cases for every model — iPhone, Samsung, Xiaomi and more." },
      planSlug: "basic",
    },
    {
      email: "admin@pixelguard.com",
      name: "PixelGuard Admin",
      tenant: { name: "PixelGuard", slug: "pixelguard", description: "Tempered glass & screen protectors with zero-bubble guarantee." },
      planSlug: "basic",
    },
  ];

  const tenantIds: Record<string, string> = {};

  for (const s of sellers) {
    const plan = s.planSlug === "pro" ? proPlan : basicPlan;

    // Upsert seller user (we need tenantId, so create tenant first)
    // Tenant requires ownerId — create user first with null tenantId placeholder
    const existingUser = await prisma.user.findUnique({ where: { email: s.email } });

    let user = existingUser;
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: s.email,
          password: sellerPassword,
          name: s.name,
          role: UserRole.SELLER_ADMIN,
          tenantId: null,
          isActive: true,
        },
      });
    }

    // Upsert tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: s.tenant.slug },
      update: { status: TenantStatus.ACTIVE },
      create: {
        name: s.tenant.name,
        slug: s.tenant.slug,
        description: s.tenant.description,
        status: TenantStatus.ACTIVE,
        ownerId: user.id,
      },
    });
    tenantIds[s.tenant.slug] = tenant.id;

    // Link user to tenant
    await prisma.user.update({ where: { id: user.id }, data: { tenantId: tenant.id } });

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      update: { status: SubscriptionStatus.ACTIVE },
      create: {
        tenantId: tenant.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });

    console.log(`Seeded: seller ${s.tenant.name} (${s.email})`);
  }

  // ── Products ──────────────────────────────────────────────────────────────
  // picsum.photos/seed/<seed>/600/600 gives deterministic placeholder images
  const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

  const products = [
    // ── ChargeNepal products ──────────────────────────────────────────────
    {
      tenantSlug: "chargenepal",
      name: "20W USB-C Fast Charger (PD)",
      slug: "20w-usbc-fast-charger-pd",
      description: "20W Power Delivery fast charger compatible with iPhone 12 and above, Samsung, OnePlus, and all USB-C devices. Includes 1-year warranty.",
      price: 1299,
      comparePrice: 1599,
      stock: 48,
      categorySlug: "chargers-cables",
      images: [img("charger1"), img("charger1b")],
      pricingTiers: [{ minQty: 10, price: 1099 }, { minQty: 50, price: 949 }],
      isFeatured: true,
    },
    {
      tenantSlug: "chargenepal",
      name: "65W GaN Fast Charger 3-Port",
      slug: "65w-gan-charger-3port",
      description: "GaN technology — charge your laptop, phone, and earbuds simultaneously. Ultra-compact. Supports PPS and PD.",
      price: 3499,
      comparePrice: 4200,
      stock: 22,
      categorySlug: "chargers-cables",
      images: [img("charger2"), img("charger2b")],
      pricingTiers: [{ minQty: 5, price: 3199 }, { minQty: 20, price: 2999 }],
      isFeatured: true,
    },
    {
      tenantSlug: "chargenepal",
      name: "USB-C to USB-C Braided Cable 1m",
      slug: "usbc-usbc-braided-1m",
      description: "100W rated nylon-braided USB-C cable. Supports fast charging and 10Gbps data. Tangle-free design. 2-year warranty.",
      price: 699,
      comparePrice: null,
      stock: 150,
      categorySlug: "chargers-cables",
      images: [img("cable1")],
      pricingTiers: [{ minQty: 10, price: 599 }, { minQty: 50, price: 499 }],
      isFeatured: false,
    },
    {
      tenantSlug: "chargenepal",
      name: "Lightning to USB-C Cable 2m",
      slug: "lightning-usbc-2m",
      description: "MFi-certified 2-metre Lightning cable. Works with all iPhone models. Reinforced connector, braided jacket.",
      price: 899,
      comparePrice: 1099,
      stock: 60,
      categorySlug: "chargers-cables",
      images: [img("cable2")],
      pricingTiers: null,
      isFeatured: false,
    },
    {
      tenantSlug: "chargenepal",
      name: "Wireless Charging Pad 15W",
      slug: "wireless-charging-pad-15w",
      description: "Qi2 compatible. 15W for iPhone 13+, 10W for Samsung, 5W universal. Non-slip surface, LED indicator.",
      price: 1799,
      comparePrice: 2299,
      stock: 35,
      categorySlug: "chargers-cables",
      images: [img("charger3")],
      pricingTiers: [{ minQty: 5, price: 1599 }],
      isFeatured: false,
    },
    {
      tenantSlug: "chargenepal",
      name: "Micro-USB to USB-A Cable Pack (3-in-1)",
      slug: "microusb-3pack",
      description: "3 cables in the box (0.5m, 1m, 2m). Works with Android devices, power banks, and car chargers.",
      price: 449,
      comparePrice: null,
      stock: 200,
      categorySlug: "chargers-cables",
      images: [img("cable3")],
      pricingTiers: [{ minQty: 20, price: 349 }],
      isFeatured: false,
    },

    // ── CaseHub products ──────────────────────────────────────────────────
    {
      tenantSlug: "casehub",
      name: "iPhone 15 Pro Max Silicone Case — Midnight",
      slug: "iphone-15-pro-max-silicone-midnight",
      description: "Liquid silicone with microfibre lining. Raised lip for screen protection. Supports MagSafe. Available in 6 colours.",
      price: 999,
      comparePrice: 1299,
      stock: 30,
      categorySlug: "phone-cases",
      images: [img("case1"), img("case1b"), img("case1c")],
      pricingTiers: [{ minQty: 10, price: 849 }],
      isFeatured: true,
    },
    {
      tenantSlug: "casehub",
      name: "Samsung Galaxy S24 Ultra Clear Case",
      slug: "samsung-s24-ultra-clear-case",
      description: "Military-grade drop protection (MIL-STD-810G). Crystal-clear TPU shows off your phone's original colour. Anti-yellow coating.",
      price: 799,
      comparePrice: null,
      stock: 45,
      categorySlug: "phone-cases",
      images: [img("case2")],
      pricingTiers: [{ minQty: 10, price: 699 }],
      isFeatured: false,
    },
    {
      tenantSlug: "casehub",
      name: "Xiaomi Redmi Note 13 Leather Wallet Case",
      slug: "redmi-note13-leather-wallet",
      description: "PU leather folio case with 3 card slots and a cash pocket. Magnetic closure. Kickstand for hands-free viewing.",
      price: 649,
      comparePrice: 849,
      stock: 28,
      categorySlug: "phone-cases",
      images: [img("case3")],
      pricingTiers: null,
      isFeatured: false,
    },
    {
      tenantSlug: "casehub",
      name: "OnePlus 12 Frosted Matte Case",
      slug: "oneplus12-frosted-matte",
      description: "Ultra-thin 0.8mm frosted polycarbonate. Fingerprint resistant. Precise cutouts for cameras and buttons.",
      price: 549,
      comparePrice: null,
      stock: 0,
      categorySlug: "phone-cases",
      images: [img("case4")],
      pricingTiers: null,
      isFeatured: false,
    },
    {
      tenantSlug: "casehub",
      name: "Universal MagSafe Ring Holder Stand",
      slug: "magsafe-ring-holder",
      description: "Stick-on magnetic ring compatible with all phones. Rotates 360°. Works as a stand or hand grip. Strong N52 magnet.",
      price: 349,
      comparePrice: 499,
      stock: 120,
      categorySlug: "phone-cases",
      images: [img("case5")],
      pricingTiers: [{ minQty: 20, price: 299 }],
      isFeatured: false,
    },
    {
      tenantSlug: "casehub",
      name: "iPhone 14 Shockproof Armour Case",
      slug: "iphone-14-armour-case",
      description: "Dual-layer protection: TPU inner + polycarbonate outer. Corner airbags. Survives 6-foot drops. Kickstand built-in.",
      price: 1199,
      comparePrice: 1499,
      stock: 18,
      categorySlug: "phone-cases",
      images: [img("case6")],
      pricingTiers: null,
      isFeatured: true,
    },

    // ── PixelGuard products ───────────────────────────────────────────────
    {
      tenantSlug: "pixelguard",
      name: "iPhone 15 Pro Tempered Glass (2-pack)",
      slug: "iphone-15-pro-tempered-glass-2pk",
      description: "9H hardness, 0.3mm ultra-thin, 99% clarity. Includes alignment tray for bubble-free install. Pack of 2.",
      price: 499,
      comparePrice: 699,
      stock: 88,
      categorySlug: "screen-protectors",
      images: [img("screen1")],
      pricingTiers: [{ minQty: 10, price: 399 }, { minQty: 50, price: 329 }],
      isFeatured: true,
    },
    {
      tenantSlug: "pixelguard",
      name: "Samsung S24 Privacy Tempered Glass",
      slug: "samsung-s24-privacy-glass",
      description: "Privacy filter blocks side-view. 9H hardness. Anti-fingerprint coating. Includes installation kit.",
      price: 649,
      comparePrice: null,
      stock: 55,
      categorySlug: "screen-protectors",
      images: [img("screen2")],
      pricingTiers: [{ minQty: 10, price: 549 }],
      isFeatured: false,
    },
    {
      tenantSlug: "pixelguard",
      name: "Matte Anti-Glare Screen Protector (Universal 6.7\")",
      slug: "matte-antiglare-67",
      description: "Soft TPU matte film. Anti-glare coating cuts reflections outdoors. Self-healing surface. Compatible with any 6.7-inch phone.",
      price: 299,
      comparePrice: 399,
      stock: 200,
      categorySlug: "screen-protectors",
      images: [img("screen3")],
      pricingTiers: [{ minQty: 20, price: 249 }],
      isFeatured: false,
    },
    {
      tenantSlug: "pixelguard",
      name: "Camera Lens Protector — iPhone 15 Series",
      slug: "camera-lens-protector-iphone15",
      description: "Titanium alloy ring with 9H glass lens cover. Zero impact on photo quality. Easy snap-on fit.",
      price: 449,
      comparePrice: 599,
      stock: 42,
      categorySlug: "screen-protectors",
      images: [img("screen4")],
      pricingTiers: null,
      isFeatured: false,
    },
    {
      tenantSlug: "pixelguard",
      name: "10000mAh Power Bank (PD 22.5W)",
      slug: "powerbank-10000-pd-225w",
      description: "22.5W fast output via USB-C PD. Dual USB-A output. Digital battery display. Compact 145g design. Airline approved.",
      price: 2499,
      comparePrice: 2999,
      stock: 30,
      categorySlug: "power-banks",
      images: [img("powerbank1")],
      pricingTiers: [{ minQty: 5, price: 2299 }],
      isFeatured: true,
    },
    {
      tenantSlug: "pixelguard",
      name: "20000mAh Power Bank with LED Torch",
      slug: "powerbank-20000-torch",
      description: "Dual USB-C + 2× USB-A. 65W total output. Built-in LED torch. Solar charging panel on back. Rugged design for outdoors.",
      price: 3999,
      comparePrice: 4999,
      stock: 12,
      categorySlug: "power-banks",
      images: [img("powerbank2")],
      pricingTiers: null,
      isFeatured: false,
    },
    {
      tenantSlug: "chargenepal",
      name: "True Wireless Earbuds (ANC)",
      slug: "tws-earbuds-anc",
      description: "Active noise cancellation, 30hr total battery, IPX5 water resistance. Bluetooth 5.3. Fits iPhone, Samsung, and all smartphones.",
      price: 4499,
      comparePrice: 5999,
      stock: 20,
      categorySlug: "earphones-headphones",
      images: [img("earbuds1")],
      pricingTiers: [{ minQty: 5, price: 3999 }],
      isFeatured: true,
    },
    {
      tenantSlug: "casehub",
      name: "Wired In-Ear Earphones with Mic (USB-C)",
      slug: "wired-usbc-earphones-mic",
      description: "USB-C connector. Hi-Res Audio certified. In-line mic with one-button control. Compatible with Android and iOS (with adapter).",
      price: 799,
      comparePrice: null,
      stock: 75,
      categorySlug: "earphones-headphones",
      images: [img("earbuds2")],
      pricingTiers: [{ minQty: 10, price: 699 }],
      isFeatured: false,
    },
  ];

  for (const p of products) {
    const tenantId = tenantIds[p.tenantSlug];
    const categoryId = catRecords[p.categorySlug];
    if (!tenantId || !categoryId) {
      console.warn(`Skipping ${p.name} — missing tenantId or categoryId`);
      continue;
    }

    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId, slug: p.slug } },
      update: {
        status: ProductStatus.ACTIVE,
        stock: p.stock,
        comparePrice: p.comparePrice ?? null,
      },
      create: {
        tenantId,
        categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? undefined,
        stock: p.stock,
        lowStockThreshold: 5,
        images: p.images,
        pricingTiers: p.pricingTiers ? JSON.parse(JSON.stringify(p.pricingTiers)) : undefined,
        isFeatured: p.isFeatured,
        status: ProductStatus.ACTIVE,
        metadata: undefined,
      },
    });
    console.log(`Seeded: product "${p.name}"`);
  }

  console.log("\n✅ Seed complete!");
  console.log("   Super admin : admin@nepthok.com / Admin@123456");
  console.log("   ChargeNepal : admin@chargenepal.com / Seller@123456");
  console.log("   CaseHub     : admin@casehub.com / Seller@123456");
  console.log("   PixelGuard  : admin@pixelguard.com / Seller@123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
