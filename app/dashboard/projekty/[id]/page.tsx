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
                        <span>{progress}% Hotovo</span>
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

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column - Project Info (Sticky?) */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Integrated Project Info Card */}
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
                        <div className="p-4 bg-white/5">
                            <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                                <span className="flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-cyan-400" /> Přehled projektu</span>
                                <Link href={`/dashboard/projekty/${id}/upravit`} className="text-xs text-gray-400 hover:text-white flex items-center bg-white/5 px-2 py-1 rounded">
                                    <PenTool className="w-3 h-3 mr-1" /> Upravit
                                </Link>
                            </h2>
                        </div>

                        {/* CRM - Quick Stats */}
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 uppercase mb-1">Termín</div>
                                <div className="text-white font-medium flex items-center text-sm">
                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase mb-1">Manažer</div>
                                <div className="text-white font-medium flex items-center text-sm">
                                    <User className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                                    {project.project_manager || '-'}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {project.job_description && (
                            <div className="p-4">
                                <div className="text-xs text-gray-500 uppercase mb-2">Popis práce</div>
                                <p className="text-sm text-gray-300 leading-relaxed text-justify">
                                    {project.job_description}
                                </p>
                            </div>
                        )}

                        {/* Vehicle Spec Summary */}
                        <div className="p-4">
                            <div className="text-xs text-gray-500 uppercase mb-2 flex items-center">
                                <Truck className="w-3 h-3 mr-1" /> Specifikace vozidla
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                    <span className="text-gray-400">Konfigurace</span>
                                    <span className="text-white font-medium">{project.vehicle_config || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-1">
                                    <span className="text-gray-400">Značka</span>
                                    <span className="text-white font-medium">{project.vehicle_brand || '-'}</span>
                                </div>
                                <div className="pt-1">
                                    <span className="text-gray-400 block mb-1">Nástavby</span>
                                    <div className="flex flex-wrap gap-1">
                                        {project.bodies && Array.isArray(project.bodies) && project.bodies.length > 0 ? (
                                            project.bodies.map((b: any, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 text-xs">
                                                    {b?.type}
                                                </span>
                                            ))
                                        ) : <span className="text-gray-500">-</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Address */}
                        <div className="p-4">
                            <div className="text-xs text-gray-500 uppercase mb-2">Zákazník</div>
                            <div className="flex items-start mb-3">
                                <Building2 className="w-4 h-4 mr-2 text-purple-400 mt-0.5" />
                                <div>
                                    <div className="text-white font-medium text-sm">{project.customer || 'Nespecifikován'}</div>
                                    <div className="text-xs text-gray-400">{project.billing_company}</div>
                                </div>
                            </div>
                            {project.delivery_address && (
                                <div className="flex items-start">
                                    <MapPin className="w-4 h-4 mr-2 text-red-400 mt-0.5" />
                                    <div className="text-gray-300 text-xs">{project.delivery_address}</div>
                                </div>
                            )}
                        </div>

                        {/* Internal Codes (Collapsible aesthetic via simple list) */}
                        <div className="p-4 bg-black/20">
                            <div className="text-xs text-gray-600 uppercase mb-2 font-bold">Interní kódy</div>
                            <div className="space-y-1 text-xs text-gray-400">
                                <div className="flex justify-between"><span>OP-CRM:</span> <span className="text-gray-300 font-mono">{project.op_crm || '-'}</span></div>
                                <div className="flex justify-between"><span>OP OPV:</span> <span className="text-gray-300 font-mono">{project.op_opv_sro || '-'}</span></div>
                                <div className="flex justify-between"><span>Zakázka:</span> <span className="text-gray-300 font-mono">{project.zakazka_sro || '-'}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Team Members Widget */}
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden p-4">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2 text-green-400" /> Tým projektu
                        </h3>
                        <div className="space-y-3">
                            {project.project_members.map((member: any) => (
                                <div key={member.profiles.id} className="flex items-center justify-between group">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs text-white border border-white/10">
                                            {member.profiles.avatar_url ? (
                                                <img src={member.profiles.avatar_url} alt="" className="w-full h-full rounded-full" />
                                            ) : (
                                                member.profiles.full_name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white text-sm font-medium">{member.profiles.full_name}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize bg-white/5 px-2 py-0.5 rounded group-hover:bg-white/10 transition-colors">
                                        {member.role}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Area - Operational (2 Cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Zakázky Table - Primary operational view */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <LayoutGrid className="w-5 h-5 mr-2 text-cyan-400" /> Zakázky
                            </h2>
                            <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-400 border border-white/5">
                                {activeJobs} aktivní / {project.jobs.length} celkem
                            </span>
                        </div>

                        <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4 font-medium">Název</th>
                                            <th className="px-6 py-4 font-medium">Obj. číslo</th>
                                            <th className="px-6 py-4 font-medium">Stav</th>
                                            <th className="px-6 py-4 font-medium">Termín</th>
                                            <th className="px-6 py-4 font-medium">Progres</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {project.jobs.map((job: any) => (
                                            <tr key={job.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 font-medium text-white">{job.name}</td>
                                                <td className="px-6 py-4 text-gray-400 text-xs font-mono">{job.order_number || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${job.status === 'done' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
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
                                                <td className="px-6 py-4 text-gray-300 text-xs">
                                                    {job.deadline ? new Date(job.deadline).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div className={`h-full ${job.completion_percentage === 100 ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${job.completion_percentage}%` }}></div>
                                                        </div>
                                                        <span className="text-xs w-8 text-right">{job.completion_percentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/dashboard/projekty/${id}/zakazky/${job.id}/upravit`}
                                                            className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                                            title="Upravit zakázku"
                                                        >
                                                            <PenTool className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {project.jobs.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <ClipboardList className="w-10 h-10 mb-3 opacity-20" />
                                                        <p>Zatím žádné zakázky</p>
                                                        <p className="text-xs mt-1">Vytvořte první tlačítkem "Nová zakázka"</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>


                    {/* Files & Recent Tasks Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Project Files */}
                        <div>
                            <ProjectFiles projectId={project.id} readOnly={!isOwner} />
                        </div>

                        {/* Recent Tasks */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <CheckSquare className="w-5 h-5 mr-2 text-pink-400" /> Úkoly
                                </h3>
                                <Link href={`/dashboard/ukoly?project=${project.id}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                                    Všechny ({totalTasks})
                                </Link>
                            </div>

                            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden min-h-[100px]">
                                {project.tasks.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {project.tasks.slice(0, 5).map((task: any) => (
                                            <div key={task.id} className="p-3 hover:bg-white/5 transition-colors flex items-start group">
                                                <div className={`mt-1.5 w-2 h-2 rounded-full mr-3 flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                                                    task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                                                    }`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm text-gray-200 font-medium truncate">{task.title}</div>
                                                    <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                                                        <span>{task.profiles?.full_name?.split(' ')[0] || 'Unassigned'}</span>
                                                        {task.due_date && <span className="text-gray-600">•</span>}
                                                        {task.due_date && (
                                                            <span className={new Date(task.due_date) < new Date() ? 'text-red-400' : ''}>
                                                                {new Date(task.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                                                    {task.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        Žádné úkoly
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
