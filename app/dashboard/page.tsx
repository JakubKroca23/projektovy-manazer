import { createClient } from '@/lib/supabase/server'
import { FolderKanban, CheckSquare, Users, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get projects count
    const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .or(`created_by.eq.${user?.id},id.in.(select project_id from project_members where user_id = ${user?.id})`)

    // Get tasks count
    const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)

    // Get active tasks count
    const { count: activeTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .eq('status', 'in_progress')

    // Get recent projects
    const { data: recentProjects } = await supabase
        .from('projects')
        .select('*, profiles!created_by(full_name)')
        .or(`created_by.eq.${user?.id},id.in.(select project_id from project_members where user_id = ${user?.id})`)
        .order('created_at', { ascending: false })
        .limit(5)

    const stats = [
        { name: 'Celkem projektů', value: projectsCount || 0, icon: FolderKanban, color: 'from-purple-600 to-purple-400' },
        { name: 'Moje úkoly', value: tasksCount || 0, icon: CheckSquare, color: 'from-cyan-600 to-cyan-400' },
        { name: 'Aktivní úkoly', value: activeTasksCount || 0, icon: TrendingUp, color: 'from-pink-600 to-pink-400' },
        { name: 'Členové týmu', value: 12, icon: Users, color: 'from-orange-600 to-orange-400' },
    ]

    const statusColors = {
        planning: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        active: 'bg-green-500/20 text-green-300 border-green-500/50',
        completed: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
        archived: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    }

    const statusLabels = {
        planning: 'Plánování',
        active: 'Aktivní',
        completed: 'Dokončeno',
        archived: 'Archivováno',
    }

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                    Vítejte zpět! 👋
                </h1>
                <p className="text-gray-400">
                    Tady je přehled vašich projektů a úkolů
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-200 group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">{stat.name}</p>
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
                <Link
                    href="/dashboard/projekty/novy"
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nový projekt</span>
                </Link>
                <Link
                    href="/dashboard/ukoly"
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg transition-all duration-200"
                >
                    Zobrazit úkoly
                </Link>
            </div>

            {/* Recent Projects */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Nedávné projekty</h2>
                    <Link
                        href="/dashboard/projekty"
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                    >
                        Zobrazit vše →
                    </Link>
                </div>

                {recentProjects && recentProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/projekty/${project.id}`}
                                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 group-hover:scale-110 transition-transform">
                                        <FolderKanban className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status as keyof typeof statusColors]
                                            }`}
                                    >
                                        {statusLabels[project.status as keyof typeof statusLabels]}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                    {project.description || 'Bez popisu'}
                                </p>
                                <div className="flex items-center text-xs text-gray-500">
                                    <Users className="w-4 h-4 mr-1" />
                                    <span>Vytvořil {project.profiles?.full_name || 'Neznámý'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                        <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Zatím žádné projekty</h3>
                        <p className="text-gray-400 mb-6">Začněte vytvořením svého prvního projektu</p>
                        <Link
                            href="/dashboard/projekty/novy"
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Vytvořit projekt</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
