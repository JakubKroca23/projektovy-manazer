"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Schema pro validaci projektu
const CreateProjectSchema = z.object({
  name: z.string().min(1, "Název projektu je povinný").max(100),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function createProject(formData: FormData) {
  const validatedFields = CreateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: { general: ["Musíte být přihlášeni"] } }
    }

    const { data, error } = await supabase.from("projects").insert({
      name: validatedFields.data.name,
      description: validatedFields.data.description,
      start_date: validatedFields.data.startDate,
      end_date: validatedFields.data.endDate,
      created_by: user.id,
      status: "PLANNING",
    })

    if (error) throw error

    revalidatePath("/dashboard/projekty")
    redirect("/dashboard/projekty")
    return { success: true, data }
  } catch (error) {
    console.error("Chyba při vytváření projektu:", error)
    return {
      error: { general: ["Nepodařilo se vytvořit projekt. Zkuste to prosím znovu."] },
    }
  }
}

export async function getProjects() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return projects || []
  } catch (error) {
    console.error("Chyba při načítání projektů:", error)
    return []
  }
}

export async function getProjectById(id: string) {
  try {
    const supabase = await createClient()

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return project
  } catch (error) {
    console.error("Chyba při načítání projektu:", error)
    return null
  }
}
