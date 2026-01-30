'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Calendar, User, Building2 } from 'lucide-react'

interface Project {
    id: string
    name: string
    status: string
    expected_start_date: string | null
    deadline: string | null
    created_at: string
    customer?: string
    project_manager?: string
}

export default function ProjectTable({ projects }: { projects: Project[] }) {
    const statusColors = {
        planning: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        active: 'bg-green-500/20 text-green-300 border-green-500/50',
        completed: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
        archived: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    } as const

    const statusLabels = {
        planning: 'Plánování',
        active: 'Aktivní',
        completed: 'Dokončeno',
        archived: 'Archivováno',
    } as const

    return (
        <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-6 py-4 font-medium text-gray-300">Projekt</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Stav</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Zákazník</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Vedoucí</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Termín</th>
                            <th className="px-6 py-4 font-medium text-gray-300"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <Link href={`/dashboard/projekty/${project.id}`} className="block group-hover:text-purple-400 transition-colors">
                                        <div className="font-medium text-white">{project.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">Vytvořeno {format(new Date(project.created_at), 'd. M. yyyy')}</div>
                                    </Link>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-300'}`}>
                                        {statusLabels[project.status as keyof typeof statusLabels] || project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {project.customer ? (
                                        <div className="flex items-center">
                                            <Building2 className="w-3 h-3 mr-2 text-gray-500" />
                                            {project.customer}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {project.project_manager ? (
                                        <div className="flex items-center">
                                            <User className="w-3 h-3 mr-2 text-gray-500" />
                                            {project.project_manager}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {project.deadline ? (
                                        <div className="flex items-center text-orange-300/80">
                                            <Calendar className="w-3 h-3 mr-2" />
                                            {format(new Date(project.deadline), 'd. M. yyyy', { locale: cs })}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/dashboard/projekty/${project.id}`}
                                        className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        Detail
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Žádné projekty k zobrazení.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
