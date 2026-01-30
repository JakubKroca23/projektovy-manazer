"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const CreateContractSchema = z.object({
  name: z.string().min(1, "Název zakázky je povinný").max(100),
  description: z.string().optional(),
  projectId: z.string().min(1, "ID projektu je povinné"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PLANNING", "TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]).default("PLANNING"),
})

export async function createContract(formData: FormData) {
  const validatedFields = CreateContractSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    projectId: formData.get("projectId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("contracts").insert({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
      project_id: validatedFields.data.projectId,
      start_date: validatedFields.data.startDate,
      end_date: validatedFields.data.endDate,
      status: validatedFields.data.status,
    })

    if (error) throw error

    revalidatePath(`/dashboard/projekty/${validatedFields.data.projectId}`)
    return { success: true, data }
  } catch (error) {
    console.error("Chyba při vytváření zakázky:", error)
    return {
      error: { general: ["Nepodařilo se vytvořit zakázku. Zkuste to prosím znovu."] },
    }
  }
}

export async function getContracts() {
  try {
    const supabase = await createClient()
    const { data: contracts, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return contracts || []
  } catch (error) {
    console.error("Chyba při načítání zakázek:", error)
    return []
  }
}

export async function getContractById(id: string) {
  try {
    const supabase = await createClient()
    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return contract
  } catch (error) {
    console.error("Chyba při načítání zakázky:", error)
    return null
  }
}

export async function updateContract(id: string, formData: FormData) {
  const validatedFields = CreateContractSchema.omit({ projectId: true }).safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("contracts")
      .update({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        start_date: validatedFields.data.startDate,
        end_date: validatedFields.data.endDate,
        status: validatedFields.data.status,
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath(`/dashboard/zakazky/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Chyba při úpravě zakázky:", error)
    return {
      error: { general: ["Nepodařilo se upravit zakázku. Zkuste to prosím znovu."] },
    }
  }
}

export async function deleteContract(id: string, projectId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("contracts").delete().eq("id", id)

    if (error) throw error

    revalidatePath(`/dashboard/projekty/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Chyba při mazání zakázky:", error)
    return {
      error: { general: ["Nepodařilo se smazat zakázku. Zkuste to prosím znovu."] },
    }
  }
}
