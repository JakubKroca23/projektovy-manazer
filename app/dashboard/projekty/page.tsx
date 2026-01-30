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
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/dashboard/ukoly/novy"
                        className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-all hover:border-cyan-500/50"
                    >
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                        <span>Přidat úkol</span>
                    </Link>

                    <Link
                        href="/dashboard/servisy/novy"
                        className="flex items-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-200 font-medium rounded-lg transition-all hover:border-red-500/50"
                    >
                        <Wrench className="w-4 h-4" />
                        <span>Nový servis</span>
                    </Link>

                    <Link
                        href="/dashboard/projekty/novy"
                        className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nový projekt</span>
                    </Link>
                </div>
            </div>

            {/* Content View Switcher */}
            <ProjectViews
                projects={(projects || []) as any[]}
                services={(services || []) as any[]}
                currentUserId={user?.id}
            />
        </div>
    )
}
