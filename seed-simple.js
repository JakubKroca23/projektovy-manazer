import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Simple seed without PrismaClient instantiation issues
async function main() {
  console.log("🌱 Starting database seeding...");
  
  try {
    const prisma = new PrismaClient();
    
    // Hash the passwords
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Clean up existing data
    await prisma.taskComment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.fileUpload.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    
    console.log("🧹 Cleaned up existing data");
    
    // Create users
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@firma.cz",
        name: "Jan Novák",
        role: 0, // ADMIN
      },
    });

    const managerUser = await prisma.user.create({
      data: {
        email: "manager@firma.cz",
        name: "Petra Svobodová",
        role: 1, // MANAGER
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: "clen@firma.cz",
        name: "Tomáš Dvořák",
        role: 2, // MEMBER
      },
    });

    console.log("👥 Created users");
    
    // Create projects
    const project1 = await prisma.project.create({
      data: {
        name: "Redesign firemního webu",
        description: "Kompletní redesign firemního webu s moderním designem a lepší UX",
        status: 2, // IN_PROGRESS
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        createdById: adminUser.id,
      },
    });

    const project2 = await prisma.project.create({
      data: {
        name: "Mobilní aplikace pro zákazníky",
        description: "Aplikace pro iOS a Android pro snadnější přístup zákazníků",
        status: 0, // PLANNING
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-12-31"),
        createdById: managerUser.id,
      },
    });

    console.log("📁 Created projects");
    
    // Add project members
    await prisma.projectMember.createMany({
      data: [
        { userId: adminUser.id, projectId: project1.id, role: 0 }, // OWNER
        { userId: managerUser.id, projectId: project1.id, role: 1 }, // MANAGER
        { userId: memberUser.id, projectId: project1.id, role: 2 }, // MEMBER
        { userId: managerUser.id, projectId: project2.id, role: 0 }, // OWNER
        { userId: memberUser.id, projectId: project2.id, role: 2 }, // MEMBER
      ],
    });

    console.log("👥 Added project members");
    
    // Create contracts
    const contract1 = await prisma.contract.create({
      data: {
        name: "UI/UX Design",
        description: "Vytvoření wireframes, mockups a finálního designu",
        status: 2, // IN_PROGRESS
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-03-15"),
        projectId: project1.id,
      },
    });

    const contract2 = await prisma.contract.create({
      data: {
        name: "Frontend vývoj",
        description: "Implementace frontendu pomocí React a Next.js",
        status: 1, // TODO
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-05-15"),
        projectId: project1.id,
      },
    });

    const contract3 = await prisma.contract.create({
      data: {
        name: "Backend API",
        description: "Vytvoření REST API pro komunikaci s frontendem",
        status: 1, // TODO
        startDate: new Date("2024-02-15"),
        endDate: new Date("2024-04-30"),
        projectId: project1.id,
      },
    });

    console.log("📄 Created contracts");
    
    // Create tasks
    await prisma.task.createMany({
      data: [
        {
          name: "Výzkum konkurence",
          description: "Analýza designu konkurenčních webů",
          status: 4, // COMPLETED
          progress: 100,
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-01-25"),
          contractId: contract1.id,
        },
        {
          name: "Vytvoření wireframes",
          description: "Návrh základní struktury a layoutu",
          status: 4, // COMPLETED
          progress: 100,
          startDate: new Date("2024-01-26"),
          endDate: new Date("2024-02-10"),
          contractId: contract1.id,
        },
        {
          name: "Vizuální design",
          description: "Finální vizuální podoba aplikace",
          status: 2, // IN_PROGRESS
          progress: 60,
          startDate: new Date("2024-02-11"),
          endDate: new Date("2024-03-15"),
          contractId: contract1.id,
        },
        {
          name: "Analýza požadavků",
          description: "Sběr a analýza požadavků od stakeholderů",
          status: 0, // PLANNING
          progress: 20,
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-04-15"),
          contractId: contract2.id,
        },
        {
          name: "Návrh API architektury",
          description: "Design REST API endpoints a databáze",
          status: 1, // TODO
          progress: 0,
          startDate: new Date("2024-02-15"),
          endDate: new Date("2024-03-01"),
          contractId: contract3.id,
        },
      ],
    });

    console.log("✅ Created tasks");
    
    console.log("\n🎉 Testovací data úspěšně vytvořena!");
    console.log(`👥 Uživatelé: 3`);
    console.log(`📁 Projekty: 2`);
    console.log(`📄 Zakázky: 3`);
    console.log(`✅ Úkoly: 5`);
    console.log("\n🔑 Přihlašovací údaje:");
    console.log("admin@firma.cz (heslo: password123) - Admin");
    console.log("manager@firma.cz (heslo: password123) - Manager");
    console.log("clen@firma.cz (heslo: password123) - Member");
    
  } catch (error) {
    console.error("❌ Chyba při vytváření testovacích dat:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    // No need to disconnect, Prisma handles it
  });