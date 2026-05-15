import "dotenv/config";
import { PrismaClient, UserRole } from "@nepthok/database";
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
