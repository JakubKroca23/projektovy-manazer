"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const CreateTaskSchema = z.object({
  name: z.string().min(1, "Název úkolu je povinný").max(100),
  description: z.string().optional(),
  contractId: z.string().min(1, "ID zakázky je povinné"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PLANNING", "TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]).default("TODO"),
  progress: z.number().min(0).max(100).default(0),
})

export async function createTask(formData: FormData) {
  const validatedFields = CreateTaskSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    contractId: formData.get("contractId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    progress: parseInt(formData.get("progress") as string) || 0,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("tasks").insert({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
      contract_id: validatedFields.data.contractId,
      start_date: validatedFields.data.startDate,
      end_date: validatedFields.data.endDate,
      status: validatedFields.data.status,
      progress: validatedFields.data.progress,
    })

    if (error) throw error

    revalidatePath(`/dashboard/zakazky/${validatedFields.data.contractId}`)
    return { success: true, data }
  } catch (error) {
    console.error("Chyba při vytváření úkolu:", error)
    return {
      error: { general: ["Nepodařilo se vytvořit úkol. Zkuste to prosím znovu."] },
    }
  }
}

export async function getTasks() {
  try {
    const supabase = await createClient()
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return tasks || []
  } catch (error) {
    console.error("Chyba při načítání úkolů:", error)
    return []
  }
}

export async function getTasksByContract(contractId: string) {
  try {
    const supabase = await createClient()
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return tasks || []
  } catch (error) {
    console.error("Chyba při načítání úkolů zakázky:", error)
    return []
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
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("tasks")
      .update({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        start_date: validatedFields.data.startDate,
        end_date: validatedFields.data.endDate,
        status: validatedFields.data.status,
        progress: validatedFields.data.progress,
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath(`/dashboard/ukoly/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Chyba při úpravě úkolu:", error)
    return {
      error: { general: ["Nepodařilo se upravit úkol. Zkuste to prosím znovu."] },
    }
  }
}

export async function updateTaskProgress(id: string, progress: number) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("tasks")
      .update({
        progress: Math.max(0, Math.min(100, progress)),
        status: progress === 100 ? "COMPLETED" : undefined,
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath(`/dashboard/ukoly/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Chyba při aktualizaci postupu úkolu:", error)
    return {
      error: { general: ["Nepodařilo se aktualizovat postup úkolu."] },
    }
  }
}

export async function deleteTask(id: string, contractId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) throw error

    revalidatePath(`/dashboard/zakazky/${contractId}`)
    return { success: true }
  } catch (error) {
    console.error("Chyba při mazání úkolu:", error)
    return {
      error: { general: ["Nepodařilo se smazat úkol. Zkuste to prosím znovu."] },
    }
  }
}
