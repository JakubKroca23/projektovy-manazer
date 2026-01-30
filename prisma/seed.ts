import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Vytvoření testovacích uživatelů
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@firma.cz" },
    update: {},
    create: {
      email: "admin@firma.cz",
      name: "Jan Novák",
      role: "ADMIN",
      password: "$2a$10$example", // TODO: Add proper hash
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@firma.cz" },
    update: {},
    create: {
      email: "manager@firma.cz",
      name: "Petra Svobodová",
      role: "MANAGER",
      password: "$2a$10$example",
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: "clen@firma.cz" },
    update: {},
    create: {
      email: "clen@firma.cz",
      name: "Tomáš Dvořák",
      role: "MEMBER",
      password: "$2a$10$example",
    },
  });

  // Vytvoření testovacích projektů
  const project1 = await prisma.project.create({
    data: {
      name: "Redesign firemního webu",
      description: "Kompletní redesign firemního webu s moderním designem a lepší UX",
      status: "IN_PROGRESS",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-06-30"),
      createdById: adminUser.id,
      members: {
        create: [
          { userId: adminUser.id, role: "OWNER" },
          { userId: managerUser.id, role: "MANAGER" },
          { userId: memberUser.id, role: "MEMBER" },
        ],
      },
      contracts: {
        create: [
          {
            name: "UI/UX Design",
            description: "Vytvoření wireframes, mockups a finálního designu",
            status: "IN_PROGRESS",
            startDate: new Date("2024-01-15"),
            endDate: new Date("2024-03-15"),
          },
          {
            name: "Frontend vývoj",
            description: "Implementace frontendu pomocí React a Next.js",
            status: "TODO",
            startDate: new Date("2024-03-01"),
            endDate: new Date("2024-05-15"),
          },
          {
            name: "Backend API",
            description: "Vytvoření REST API pro komunikaci s frontendem",
            status: "TODO",
            startDate: new Date("2024-02-15"),
            endDate: new Date("2024-04-30"),
          },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Mobilní aplikace pro zákazníky",
      description: "Aplikace pro iOS a Android pro snadnější přístup zákazníků",
      status: "PLANNING",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-12-31"),
      createdById: managerUser.id,
      members: {
        create: [
          { userId: managerUser.id, role: "OWNER" },
          { userId: memberUser.id, role: "MEMBER" },
        ],
      },
      contracts: {
        create: [
          {
            name: "Analýza požadavků",
            description: "Sběr a analýza požadavků od stakeholderů",
            status: "PLANNING",
            startDate: new Date("2024-03-01"),
            endDate: new Date("2024-04-15"),
          },
        ],
      },
    },
  });

  // Vytvoření úkolů pro zakázky
  for (const contract of project1.contracts) {
    if (contract.name === "UI/UX Design") {
      await prisma.task.createMany({
        data: [
          {
            name: "Výzkum konkurence",
            description: "Analýza designu konkurenčních webů",
            status: "COMPLETED",
            progress: 100,
            startDate: new Date("2024-01-15"),
            endDate: new Date("2024-01-25"),
            contractId: contract.id,
          },
          {
            name: "Vytvoření wireframes",
            description: "Návrh základní struktury a layoutu",
            status: "COMPLETED",
            progress: 100,
            startDate: new Date("2024-01-26"),
            endDate: new Date("2024-02-10"),
            contractId: contract.id,
          },
          {
            name: "Vizuální design",
            description: "Finální vizuální podoba aplikace",
            status: "IN_PROGRESS",
            progress: 60,
            startDate: new Date("2024-02-11"),
            endDate: new Date("2024-03-15"),
            contractId: contract.id,
          },
        ],
      });
    }
  }

  console.log("✅ Testovací data úspěšně vytvořena!");
  console.log(`👥 Uživatelé: ${await prisma.user.count()}`);
  console.log(`📁 Projekty: ${await prisma.project.count()}`);
  console.log(`📄 Zakázky: ${await prisma.contract.count()}`);
  console.log(`✅ Úkoly: ${await prisma.task.count()}`);
}

main()
  .catch((e) => {
    console.error("❌ Chyba při vytváření testovacích dat:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });