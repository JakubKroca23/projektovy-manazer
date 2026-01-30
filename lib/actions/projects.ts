"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema pro validaci projektu
const CreateProjectSchema = z.object({
  name: z.string().min(1, "Název projektu je povinný").max(100),
  description: z.string().optional(),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : null),
});

export async function createProject(formData: FormData) {
  const validatedFields = CreateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const project = await prisma.project.create({
      data: {
        ...validatedFields.data,
        createdById: "user-1", // TODO: Replace with actual user ID
        members: {
          create: {
            userId: "user-1", // TODO: Replace with actual user ID
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/projekty");
    redirect("/dashboard/projekty");
    return { success: true, data: project };
  } catch (error) {
    console.error("Chyba při vytváření projektu:", error);
    return {
      error: { general: ["Nepodařilo se vytvořit projekt. Zkuste to prosím znovu."] },
    };
  }
}

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        contracts: {
          include: {
            tasks: true,
          },
        },
        _count: {
          select: {
            contracts: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  } catch (error) {
    console.error("Chyba při načítání projektů:", error);
    return [];
  }
}

export async function getProjectById(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        contracts: {
          include: {
            tasks: true,
          },
        },
      },
    });

    return project;
  } catch (error) {
    console.error("Chyba při načítání projektu:", error);
    return null;
  }
}