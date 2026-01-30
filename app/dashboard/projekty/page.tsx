import { createClient } from '@/lib/supabase/server'
import { Plus, FolderKanban, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ProjektyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all projects (RLS automatically filters to user's projects)
    const { data: projects } = await supabase
        .from('projects')
        .select(`
      *,
      profiles:created_by(full_name),
      project_members(count),
      tasks(count)
    `)
        .order('created_at', { ascending: false })

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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Projekty</h1>
                    <p className="text-gray-400">Spravujte všechny své projekty na jednom místě</p>
                </div>
                <Link
                    href="/dashboard/projekty/novy"
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nový projekt</span>
                </Link>
            </div>

            {/* Projects grid */}
            {projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                        <Link
                            key={project.id}
                            href={`/dashboard/projekty/${project.id}`}
                            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 group-hover:scale-110 transition-transform">
                                    <FolderKanban className="w-6 h-6 text-purple-400" />
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status as keyof typeof statusColors]
                                        }`}
                                >
                                    {statusLabels[project.status as keyof typeof statusLabels]}
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                {project.description || 'Bez popisu'}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-1" />
                                        <span>{project.project_members?.[0]?.count || 0}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        <span>{project.tasks?.[0]?.count || 0}</span>
                                    </div>
                                </div>
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
    )
}
