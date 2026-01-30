import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, CheckSquare, Clock, MoreHorizontal, Plus, Users, Building2, User, Truck, Phone, MapPin, ClipboardList, PenTool, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProjectActions from '@/components/projects/project-actions'

import GenerateJobsButton from '@/components/projects/generate-jobs-button'
import ProjectFiles from '@/components/projects/project-files'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    // Basic validation of UUID format to prevent Postgres errors
    const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)

    if (!isValidUUID) {
        console.error(`Invalid Project ID: ${id}`)
        return (
            <div className="p-8 text-center text-gray-400">
                <h2 className="text-xl font-bold text-white mb-2">Chybný odkaz na projekt</h2>
                <p>ID projektu "{id}" není platné. Zkuste se vrátit na seznam projektů.</p>
                <Link href="/dashboard/projekty" className="inline-block mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    Zpět na projekty
                </Link>
            </div>
        )
    }

    const { data: project, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_members (
                role,
                profiles (
                    id,
                    full_name,
                    avatar_url
                )
            ),
            tasks (
                id,
                title,
                status,
                priority,
                assigned_to,
                due_date,
                created_at,
                profiles:assigned_to (full_name, avatar_url)
            ),
            jobs (
                id,
                name,
                order_number,
                status,
                deadline,
                completion_percentage
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Chyba při načítání projektu</h2>
                <p>{error.message}</p>
                <div className="mt-4 text-sm text-gray-400">
                    <p>Pokud vidíte chybu "relation public.jobs does not exist", spusťte migraci <code>0019_add_jobs_and_link_tasks.sql</code>.</p>
                </div>
            </div>
        )
    }

    if (!project) {
        return <div className="p-8 text-center text-gray-400">Projekt nenalezen.</div>
    }

    // Check permissions
    const isOwner = project.created_by === currentUserId || project.project_members.some((m: any) => m.profiles.id === currentUserId && (m.role === 'owner' || m.role === 'admin'))

    // Stats
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t: any) => t.status === 'done').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const activeJobs = project.jobs.filter((j: any) => j.status !== 'done' && j.status !== 'delivered' && j.status !== 'canceled').length

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs border ${project.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
                            project.status === 'completed' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' :
                                'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            }`}>
                            {project.status === 'active' ? 'Aktivní' :
                                project.status === 'completed' ? 'Dokončeno' : 'Plánování'}
                        </span>
                        <span>Vytvořeno {new Date(project.created_at).toLocaleDateString()}</span>
                        <span>{project.quantity} ks</span>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <GenerateJobsButton projectId={project.id} quantity={project.quantity} />
                    <Link
                        href={`/dashboard/projekty/${id}/zakazky/nova`}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nová zakázka</span>
                    </Link>
                    <ProjectActions projectId={project.id} projectName={project.name} isOwner={isOwner} />
                </div>
            </div>


            {/* Specifikace vozidla */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-purple-400" />
                        Specifikace vozidla
                    </h2>
                    <Link href={`/dashboard/projekty/${id}/upravit`} className="text-xs text-purple-400 hover:text-purple-300">
                        Upravit konfiguraci
                    </Link>
                </div>

                {/* VehicleBuilder removed as per user request */}

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Konfigurace</span> <span className="text-white font-medium">{project.vehicle_config || '-'}</span></div>
                        <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Značka</span> <span className="text-white">{project.vehicle_brand || '-'}</span></div>
                    </div>
                    <div className="space-y-3">
                        <div><span className="text-gray-400 block text-xs uppercase tracking-wider">Nástavby</span>
                            <div className="text-white flex flex-col">
                                {project.bodies && Array.isArray(project.bodies) && project.bodies.length > 0 ? (
                                    project.bodies.map((b: any, i: number) => (
                                        <span key={i}>{b?.type} ({((b?.width || 0) / 1000).toFixed(1)}m)</span>
                                    ))
                                ) : '-'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zakázky (Jobs) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Zakázky</h2>
                    <span className="text-sm text-gray-400">{project.jobs.length} celkem / {activeJobs} aktivní</span>
                </div>

                <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                                    <th className="px-6 py-3 font-medium">Název</th>
                                    <th className="px-6 py-3 font-medium">Obj. číslo</th>
                                    <th className="px-6 py-3 font-medium">Stav</th>
                                    <th className="px-6 py-3 font-medium">Termín</th>
                                    <th className="px-6 py-3 font-medium">Hotovo</th>
                                    <th className="px-6 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {project.jobs.map((job: any) => (
                                    <tr key={job.id} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-3 font-medium text-white">{job.name}</td>
                                        <td className="px-6 py-3 text-gray-300">{job.order_number || '-'}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${job.status === 'done' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                job.status === 'delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    job.status === 'canceled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                {job.status === 'in_production' ? 'Ve výrobě' :
                                                    job.status === 'planning' ? 'Plánování' :
                                                        job.status === 'done' ? 'Hotovo' :
                                                            job.status === 'delivered' ? 'Dodáno' : job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-300">
                                            {job.deadline ? new Date(job.deadline).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-500" style={{ width: `${job.completion_percentage}%` }}></div>
                                                </div>
                                                <span className="text-xs">{job.completion_percentage}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={`/dashboard/projekty/${id}/zakazky/${job.id}/upravit`}
                                                    className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Upravit zakázku"
                                                >
                                                    <PenTool className="w-4 h-4" />
                                                </Link>
                                                <button className="text-gray-500 hover:text-white p-1">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {project.jobs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Zatím žádné zakázky. Vytvořte první tlačítkem "Nová zakázka".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            {/* CRM Info */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Detail zakázky (CRM)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-400 uppercase mb-1">Zákazník</div>
                        <div className="font-medium text-white flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-purple-400" />
                            {project.customer || '-'}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-400 uppercase mb-1">Vedoucí projektu</div>
                        <div className="font-medium text-white flex items-center">
                            <User className="w-4 h-4 mr-2 text-cyan-400" />
                            {project.project_manager || '-'}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-400 uppercase mb-1">Termín dodání</div>
                        <div className="font-medium text-white flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-orange-400" />
                            {project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-400 uppercase mb-1">Stav projektu</div>
                        <div className="font-medium text-white flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-green-400" />
                            {progress}% Hotovo
                        </div>
                    </div>
                </div>

                {/* Advanced CRM Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Obchodní info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">OP-CRM:</span> <span className="text-white">{project.op_crm || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Sektor:</span> <span className="text-white">{project.sector || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Fakturační spol.:</span> <span className="text-white truncate max-w-[150px]">{project.billing_company || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Místo dodání:</span> <span className="text-white truncate max-w-[150px]">{project.delivery_address || '-'}</span></div>
                        </div>
                    </div>

                    <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Interní kódy</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">OP OPV s.r.o.:</span> <span className="text-white">{project.op_opv_sro || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">OP Group Zákazník:</span> <span className="text-white">{project.op_group_zakaznik || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">OV Group s.r.o.:</span> <span className="text-white">{project.ov_group_sro || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Zakázka s.r.o.:</span> <span className="text-white">{project.zakazka_sro || '-'}</span></div>
                        </div>
                    </div>

                    <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Popis práce</h3>
                        <p className="text-sm text-gray-300 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar">
                            {project.job_description || 'Bez popisu.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Soubory */}
            <ProjectFiles projectId={project.id} readOnly={!isOwner} />

            {/* Layout Grid - Tasks & Team */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Tasks */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Poslední úkoly</h2>
                        <Link href={`/dashboard/ukoly?project=${project.id}`} className="text-sm text-purple-400 hover:text-purple-300">Zobrazit všechny</Link>
                    </div>
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden">
                        {project.tasks.slice(0, 5).map((task: any) => (
                            <div key={task.id} className="flex items-center p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <div className={`w-2 h-2 rounded-full mr-4 ${task.priority === 'urgent' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                                    task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-medium truncate">{task.title}</h4>
                                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                        <span>{task.profiles?.full_name || 'Unassigned'}</span>
                                        {task.due_date && (
                                            <span className={new Date(task.due_date) < new Date() ? 'text-red-400' : ''}>
                                                Termín: {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${task.status === 'done' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        task.status === 'review' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {project.tasks.length === 0 && (
                            <div className="p-8 text-center text-gray-500">Zatím žádné úkoly</div>
                        )}
                    </div>
                </div>

                {/* Team Members */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Tým projektu</h2>
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-4 space-y-4">
                        {project.project_members.map((member: any) => (
                            <div key={member.profiles.id} className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                                    {member.profiles.avatar_url ? (
                                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full rounded-full" />
                                    ) : (
                                        member.profiles.full_name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-medium">{member.profiles.full_name}</div>
                                    <div className="text-xs text-gray-400 capitalize">{member.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
