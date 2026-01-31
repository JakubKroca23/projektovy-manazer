import { createClient } from '@/lib/supabase/server'
import { Plus, Wrench, CheckSquare } from 'lucide-react'
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
            created_by,
            expected_start_date,
            deadline,
            tasks (
                id,
                title,
                status,
                due_date,
                created_at,
                start_date,
                job_id
            ),
            jobs (
                id,
                name,
                status,
                deadline,
                expected_completion_date,
                created_at,
                start_date
            )
        `)
        .order('created_at', { ascending: false })

    // Get all services
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .order('start_date', { ascending: true })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Plánování zakázek</h1>
                    <p className="text-gray-400">Přehled všech projektů a servisních akcí</p>
                </div>
            </div>

            {/* Content View Switcher */}
            <ProjectViews
                projects={(projects || []) as any[]}
                services={(services || []) as any[]}
                currentUserId={user?.id}
            />
        </div >
    )
}
