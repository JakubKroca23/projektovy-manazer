import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import ProjectViews from '@/components/projects/project-views'

export default async function ProjektyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all projects via simple select (RLS handles security now)
    const { data: projects } = await supabase
        .from('projects')
        .select(`
      id,
      name,
      status,
      created_at,
      expected_start_date,
      deadline,
      customer,
      project_manager,
      tasks (
        id,
        title,
        status,
        due_date,
        created_at
      )
    `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Plánování zakázek</h1>
                    <p className="text-gray-400">Přehled všech projektů v čase nebo v tabulce</p>
                </div>
                <Link
                    href="/dashboard/projekty/novy"
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nová zakázka</span>
                </Link>
            </div>

            {/* Content View Switcher */}
            <ProjectViews projects={(projects || []) as any[]} />
        </div>
    )
}
