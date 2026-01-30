'use client'

import { useState, useMemo } from 'react'
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, isWithinInterval, startOfYear, endOfYear, getMonth, getDate, getYear } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react'
import Link from 'next/link'

type ViewMode = 'year' | 'month'

interface Project {
    id: string
    name: string
    status: string
    expected_start_date: string | null
    deadline: string | null
    created_at: string
    project_manager?: string
    customer?: string
}

export default function ProjectTimeline({ projects }: { projects: Project[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>('year')
    const [currentDate, setCurrentDate] = useState(new Date())

    // Generování časové osy podle zoomu
    const timelineData = useMemo(() => {
        const yearStart = startOfYear(currentDate)
        const yearEnd = endOfYear(currentDate)

        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)

        if (viewMode === 'year') {
            const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })
            return {
                headers: months.map(d => format(d, 'MMMM', { locale: cs })),
                startDate: yearStart,
                totalDays: differenceInDays(yearEnd, yearStart) + 1,
                divisions: 12
            }
        } else {
            // Month view (detail)
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
            return {
                headers: days.map(d => format(d, 'd.', { locale: cs })),
                startDate: monthStart,
                totalDays: days.length,
                divisions: days.length
            }
        }
    }, [viewMode, currentDate])

    // Pomocná funkce pro výpočet pozice a šířky
    const getPositionStyle = (start: string | null, end: string | null, creation: string) => {
        const timelineStart = timelineData.startDate
        // Pokud nemá start date, bereme created_at
        const itemStart = start ? new Date(start) : new Date(creation)
        // Pokud nemá deadline, dáme mu defaultně 30 dní nebo do dneška
        const itemEnd = end ? new Date(end) : addDays(itemStart, 30)

        const startDiff = differenceInDays(itemStart, timelineStart)
        const duration = differenceInDays(itemEnd, itemStart)

        // Ošetření pro zobrazení mimo rozsah
        if (startDiff + duration < 0 || startDiff > timelineData.totalDays) {
            return { display: 'none' }
        }

        const leftPercent = (Math.max(0, startDiff) / timelineData.totalDays) * 100
        const widthPercent = (Math.min(duration, timelineData.totalDays - startDiff) / timelineData.totalDays) * 100

        return {
            left: `${leftPercent}%`,
            width: `${Math.max(widthPercent, 1)}%` // Minimum 1% width
        }
    }

    const navigation = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        if (viewMode === 'year') {
            newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        }
        setCurrentDate(newDate)
    }

    const statusColors = {
        planning: 'bg-blue-500 border-blue-400',
        active: 'bg-green-500 border-green-400',
        completed: 'bg-purple-500 border-purple-400',
        archived: 'bg-gray-500 border-gray-400',
    } as const

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigation('prev')} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold text-white min-w-[150px] text-center capitalize">
                        {viewMode === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy', { locale: cs })}
                    </h3>
                    <button onClick={() => navigation('next')} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex bg-black/20 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('year')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'year' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Rok
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Měsíc
                    </button>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">

                {/* Header Row */}
                <div className="flex border-b border-white/10 bg-white/5">
                    <div className="w-64 p-4 border-r border-white/10 shrink-0 font-medium text-gray-300">
                        Projekt
                    </div>
                    <div className="flex-1 relative h-12">
                        <div className="absolute inset-0 flex">
                            {timelineData.headers.map((header, i) => (
                                <div key={i} className="flex-1 border-r border-white/5 text-xs text-gray-400 flex items-center justify-center capitalize truncate px-1">
                                    {header}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Project Rows */}
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {projects.map(project => (
                        <div key={project.id} className="flex group hover:bg-white/[0.02] transition-colors relative">
                            {/* Project Info Column */}
                            <div className="w-64 p-4 border-r border-white/10 shrink-0 z-10 bg-[#1a1f2e]/95 backdrop-blur sticky left-0 group-hover:bg-[#1a1f2e]">
                                <Link href={`/dashboard/projekty/${project.id}`} className="block">
                                    <div className="font-medium text-white truncate hover:text-purple-400 transition-colors">{project.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                        {project.customer || 'Bez klienta'}
                                    </div>
                                    {project.deadline && (
                                        <div className="text-xs text-orange-400/80 mt-1 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {format(new Date(project.deadline), 'd.M.')}
                                        </div>
                                    )}
                                </Link>
                            </div>

                            {/* Gantt Bar Area */}
                            <div className="flex-1 relative h-20 min-w-[800px]">
                                {/* Grid Lines Background */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {Array.from({ length: timelineData.divisions }).map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-white/[0.03]"></div>
                                    ))}
                                </div>

                                {/* The Bar */}
                                <div className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full shadow-lg transition-all hover:h-10 hover:shadow-purple-500/20 cursor-pointer group/bar"
                                    style={getPositionStyle(project.expected_start_date, project.deadline, project.created_at)}
                                >
                                    <Link href={`/dashboard/projekty/${project.id}`} className={`block w-full h-full rounded-md opacity-80 hover:opacity-100 border ${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-600'}`}>
                                        {/* Tooltip on hover */}
                                        <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 text-white text-xs rounded border border-white/20 whitespace-nowrap z-20 pointer-events-none transition-opacity">
                                            {project.name}
                                            <div className="text-gray-400 text-[10px]">
                                                {format(new Date(project.expected_start_date || project.created_at), 'd.M.')} - {project.deadline ? format(new Date(project.deadline), 'd.M.') : '?'}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            Žádné projekty k zobrazení v tomto období.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-4 text-xs text-gray-500">
                <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div> Plánování</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div> Aktivní</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-purple-500 rounded mr-2"></div> Dokončeno</div>
            </div>
        </div>
    )
}
