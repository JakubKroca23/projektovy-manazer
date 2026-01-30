"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateContractSchema = z.object({
  name: z.string().min(1, "Název zakázky je povinný").max(100),
  description: z.string().optional(),
  projectId: z.string().min(1, "ID projektu je povinné"),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  status: z.enum(["PLANNING", "TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]).default("PLANNING"),
});

export async function createContract(formData: FormData) {
  const validatedFields = CreateContractSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    projectId: formData.get("projectId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const contract = await prisma.contract.create({
      data: validatedFields.data,
      include: {
        project: true,
        tasks: true,
      },
    });

    revalidatePath(`/dashboard/projekty/${validatedFields.data.projectId}`);
    return { success: true, data: contract };
  } catch (error) {
    console.error("Chyba při vytváření zakázky:", error);
    return {
      error: { general: ["Nepodařilo se vytvořit zakázku. Zkuste to prosím znovu."] },
    };
  }
}

export async function getContracts() {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        project: true,
        tasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return contracts;
  } catch (error) {
    console.error("Chyba při načítání zakázek:", error);
    return [];
  }
}

export async function getContractById(id: string) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        project: true,
        tasks: true,
      },
    });

    return contract;
  } catch (error) {
    console.error("Chyba při načítání zakázky:", error);
    return null;
  }
}

export async function updateContract(id: string, formData: FormData) {
  const validatedFields = CreateContractSchema.omit({ projectId: true }).safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const contract = await prisma.contract.update({
      where: { id },
      data: validatedFields.data,
      include: {
        project: true,
        tasks: true,
      },
    });

    revalidatePath(`/dashboard/zakazky/${id}`);
    return { success: true, data: contract };
  } catch (error) {
    console.error("Chyba při úpravě zakázky:", error);
    return {
      error: { general: ["Nepodařilo se upravit zakázku. Zkuste to prosím znovu."] },
    };
  }
}

export async function deleteContract(id: string, projectId: string) {
  try {
    await prisma.contract.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/projekty/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Chyba při mazání zakázky:", error);
    return {
      error: { general: ["Nepodařilo se smazat zakázku. Zkuste to prosím znovu."] },
    };
  }
}