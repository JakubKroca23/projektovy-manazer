import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Calendar, CheckSquare, Users, Clock, Plus, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import ProjectActions from '@/components/projects/project-actions'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Get project details
    const { data: project } = await supabase
        .from('projects')
        .select(`
      *,
      profiles:created_by (full_name)
    `)
        .eq('id', id)
        .single()

    if (!project) {
        notFound()
    }

    // Get tasks statistics
    const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)

    const { count: completedTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .eq('status', 'done')

    // Get team members
    const { data: members } = await supabase
        .from('project_members')
        .select(`
      role,
      profiles (
        id,
        full_name
      )
    `)
        .eq('project_id', id)
        .limit(5)

    // Get recent tasks
    const { data: recentTasks } = await supabase
        .from('tasks')
        .select(`
      *,
      profiles:assigned_to (full_name)
    `)
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(5)

    const progress = tasksCount ? Math.round((completedTasksCount || 0) / tasksCount * 100) : 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center space-x-4 mb-2">
                        <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
              ${project.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                project.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                            {project.status === 'active' ? 'Aktivní' :
                                project.status === 'completed' ? 'Dokončeno' : 'Plánování'}
                        </span>
                    </div>
                    <p className="text-gray-400 max-w-2xl">{project.description}</p>
                </div>
                <div className="flex space-x-3">
                    <ProjectActions projectId={project.id} projectName={project.name} />
                </div>
            </div>

            {/* Detail zakázky (CRM Data) */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">Detail zakázky</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Zákazník</span> <span className="text-white font-medium">{project.customer || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Sektor</span> <span className="text-white">{project.sector || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">OP-CRM</span> <span className="text-white">{project.op_crm || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Vedoucí</span> <span className="text-white">{project.project_manager || '-'}</span></div>
                    </div>
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Termín zahájení</span> <span className="text-white">{project.expected_start_date ? formatDate(project.expected_start_date) : '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Konečný termín</span> <span className="text-white text-orange-300">{project.deadline ? formatDate(project.deadline) : '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Počet kusů</span> <span className="text-white">{project.quantity || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Montážní firma</span> <span className="text-white">{project.assembly_company || '-'}</span></div>
                    </div>
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Fakturační firma</span> <span className="text-white">{project.billing_company || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Dodací adresa</span> <span className="text-white">{project.delivery_address || '-'}</span></div>
                        <div className="col-span-2"><span className="text-gray-400 block text-xs">Interní kódy</span>
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                <div>OPV: {project.op_opv_sro || '-'}</div>
                                <div>GRP: {project.op_group_zakaznik || '-'}</div>
                                <div>OV: {project.ov_group_sro || '-'}</div>
                                <div>ZAK: {project.zakazka_sro || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Poznámka</span> <p className="text-gray-300 text-xs mt-1">{project.note || '-'}</p></div>
                        <div><span className="text-gray-400 block text-xs">Požadovaná akce</span> <p className="text-yellow-400/80 text-xs mt-1">{project.required_action || '-'}</p></div>
                    </div>
                </div>
            </div>

            {/* Specifikace vozidla */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">Specifikace vozidla</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Konfigurace</span> <span className="text-white font-medium">{project.vehicle_config || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Značka</span> <span className="text-white">{project.vehicle_brand || '-'}</span></div>
                    </div>
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Typ nástavby</span> <span className="text-white">{project.body_type || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Jeřáb</span> <span className="text-white">{project.crane_type || '-'}</span></div>
                    </div>
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs">Podpěry</span> <span className="text-white">{project.outriggers_type || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs">Čerpadlo</span> <span className="text-white">{project.pump_type || '-'}</span></div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Postup projektu</h3>
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{progress}%</div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{completedTasksCount} z {tasksCount} úkolů hotovo</p>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Tým</h3>
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex -space-x-2 overflow-hidden mb-2">
                        {members?.map((member: any) => (
                            <div key={member.profiles.id} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white text-xs font-medium" title={member.profiles.full_name}>
                                {member.profiles.full_name?.charAt(0)}
                            </div>
                        ))}
                        {(members?.length || 0) > 5 && (
                            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white/10 flex items-center justify-center text-gray-400 text-xs">
                                +{(members?.length || 0) - 5}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        Vytvořil: {project.profiles?.full_name}
                    </p>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Termíny</h3>
                        <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Vytvořeno</span>
                            <span className="text-white">{formatDate(project.created_at)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Poslední aktivita</span>
                            <span className="text-white">{formatDate(project.updated_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tasks List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Nedávné úkoly</h2>
                        <Link href="/dashboard/ukoly" className="text-sm text-purple-400 hover:text-purple-300">
                            Zobrazit všechny
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentTasks?.map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${task.status === 'done' ? 'bg-green-500' :
                                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                                        }`} />
                                    <div>
                                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                        <p className="text-xs text-gray-500">Pro {task.profiles?.full_name || 'Unassigned'}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{formatDate(task.created_at)}</span>
                            </div>
                        ))}
                        {(!recentTasks || recentTasks.length === 0) && (
                            <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-lg">
                                Zatím žádné úkoly v tomto projektu.
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity / Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Rychlé akce</h2>
                    <div className="space-y-3">
                        <Link
                            href={`/dashboard/projekty/${project.id}/novy-ukol`}
                            className="w-full py-3 px-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 rounded-lg flex items-center justify-center space-x-2 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Přidat úkol</span>
                        </Link>
                        <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg flex items-center justify-center space-x-2 transition-all opacity-50 cursor-not-allowed">
                            <Users className="w-4 h-4" />
                            <span>Spravovat tým (Coming soon)</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
