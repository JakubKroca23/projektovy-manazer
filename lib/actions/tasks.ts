"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateTaskSchema = z.object({
  name: z.string().min(1, "Název úkolu je povinný").max(100),
  description: z.string().optional(),
  contractId: z.string().min(1, "ID zakázky je povinné"),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  status: z.enum(["PLANNING", "TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]).default("TODO"),
  progress: z.number().min(0).max(100).default(0),
});

export async function createTask(formData: FormData) {
  const validatedFields = CreateTaskSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    contractId: formData.get("contractId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    progress: parseInt(formData.get("progress") as string) || 0,
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const task = await prisma.task.create({
      data: validatedFields.data,
      include: {
        contract: {
          include: {
            project: true,
          },
        },
      },
    });

    revalidatePath(`/dashboard/zakazky/${validatedFields.data.contractId}`);
    return { success: true, data: task };
  } catch (error) {
    console.error("Chyba při vytváření úkolu:", error);
    return {
      error: { general: ["Nepodařilo se vytvořit úkol. Zkuste to prosím znovu."] },
    };
  }
}

export async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        contract: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks;
  } catch (error) {
    console.error("Chyba při načítání úkolů:", error);
    return [];
  }
}

export async function getTasksByContract(contractId: string) {
  try {
    const tasks = await prisma.task.findMany({
      where: { contractId },
      include: {
        contract: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return tasks;
  } catch (error) {
    console.error("Chyba při načítání úkolů zakázky:", error);
    return [];
  }
}

export async function updateTask(id: string, formData: FormData) {
  const validatedFields = CreateTaskSchema.omit({ contractId: true }).safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    progress: parseInt(formData.get("progress") as string) || 0,
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: validatedFields.data,
      include: {
        contract: {
          include: {
            project: true,
          },
        },
      },
    });

    revalidatePath(`/dashboard/ukoly/${id}`);
    return { success: true, data: task };
  } catch (error) {
    console.error("Chyba při úpravě úkolu:", error);
    return {
      error: { general: ["Nepodařilo se upravit úkol. Zkuste to prosím znovu."] },
    };
  }
}

export async function updateTaskProgress(id: string, progress: number) {
  try {
    const task = await prisma.task.update({
      where: { id },
      data: { 
        progress: Math.max(0, Math.min(100, progress)),
        status: progress === 100 ? "COMPLETED" : undefined
      },
    });

    revalidatePath(`/dashboard/ukoly/${id}`);
    return { success: true, data: task };
  } catch (error) {
    console.error("Chyba při aktualizaci postupu úkolu:", error);
    return {
      error: { general: ["Nepodařilo se aktualizovat postup úkolu."] },
    };
  }
}

export async function deleteTask(id: string, contractId: string) {
  try {
    await prisma.task.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/zakazky/${contractId}`);
    return { success: true };
  } catch (error) {
    console.error("Chyba při mazání úkolu:", error);
    return {
      error: { general: ["Nepodařilo se smazat úkol. Zkuste to prosím znovu."] },
    };
  }
}