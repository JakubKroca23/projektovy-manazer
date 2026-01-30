'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, startOfYear, endOfYear, isBefore, isAfter } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, GripVertical, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ViewMode = 'year' | 'month'

interface Task {
    id: string
    title: string
    status: string
    due_date: string | null
    created_at: string
    start_date?: string | null
}

interface Project {
    id: string
    name: string
    status: string
    expected_start_date: string | null
    deadline: string | null
    created_at: string
    customer?: string
    tasks?: Task[]
}

export default function ProjectTimeline({ projects: initialProjects }: { projects: Project[] }) {
    const [projects, setProjects] = useState(initialProjects)
    const [viewMode, setViewMode] = useState<ViewMode>('year')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false)
    const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null)
    const [dragItemType, setDragItemType] = useState<'project' | 'task' | null>(null)
    const [dragItemId, setDragItemId] = useState<string | null>(null)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragInitialDates, setDragInitialDates] = useState<{ start: Date, end: Date } | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        setProjects(initialProjects)
    }, [initialProjects])

    // Generování časové osy
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
                endDate: yearEnd,
                totalDays: differenceInDays(yearEnd, yearStart) + 1,
            }
        } else {
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
            return {
                headers: days.map(d => format(d, 'd.', { locale: cs })),
                startDate: monthStart,
                endDate: monthEnd,
                totalDays: days.length,
            }
        }
    }, [viewMode, currentDate])

    const getPosition = (start: string | null, end: string | null, created: string) => {
        const timelineStart = timelineData.startDate
        const itemStart = start ? new Date(start) : new Date(created)
        const itemEnd = end ? new Date(end) : addDays(itemStart, 30) // Default duration if no end date

        const startDiff = differenceInDays(itemStart, timelineStart)
        const duration = differenceInDays(itemEnd, itemStart)

        // Basic clamping for display
        if (differenceInDays(itemEnd, timelineData.startDate) < 0) return null // Ends before view
        if (differenceInDays(itemStart, timelineData.endDate!) > 0) return null // Starts after view

        const leftPercent = (startDiff / timelineData.totalDays) * 100
        const widthPercent = (Math.max(duration, 1) / timelineData.totalDays) * 100

        return {
            left: `${leftPercent}%`,
            width: `${Math.max(widthPercent, 0.5)}%`
        }
    }

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent, itemId: string, itemType: 'project' | 'task', type: 'move' | 'resize-start' | 'resize-end') => {
        e.preventDefault()
        e.stopPropagation()

        let item: { start: string | null | undefined, end: string | null, created: string } | null = null

        if (itemType === 'project') {
            const project = projects.find(p => p.id === itemId)
            if (project) {
                item = { start: project.expected_start_date, end: project.deadline, created: project.created_at }
            }
        } else {
            // Find task inside projects
            for (const p of projects) {
                const task = p.tasks?.find(t => t.id === itemId)
                if (task) {
                    item = { start: task.start_date, end: task.due_date, created: task.created_at }
                    break
                }
            }
        }

        if (!item) return

        setIsDragging(true)
        setDragType(type)
        setDragItemType(itemType)
        setDragItemId(itemId)
        setDragStartX(e.clientX)

        const start = item.start ? new Date(item.start) : new Date(item.created)
        const end = item.end ? new Date(item.end) : addDays(start, 30) // Default logic match getPosition

        setDragInitialDates({ start, end })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragItemId || !dragInitialDates || !containerRef.current || !dragItemType) return

        const deltaPixels = e.clientX - dragStartX
        const containerWidth = containerRef.current.offsetWidth
        const pixelsPerDay = containerWidth / timelineData.totalDays
        const deltaDays = Math.round(deltaPixels / pixelsPerDay)

        if (deltaDays === 0) return

        // Calculate new dates
        let newStart = new Date(dragInitialDates.start)
        let newEnd = new Date(dragInitialDates.end)

        if (dragType === 'move') {
            newStart = addDays(newStart, deltaDays)
            newEnd = addDays(newEnd, deltaDays)
        } else if (dragType === 'resize-start') {
            newStart = addDays(newStart, deltaDays)
            if (differenceInDays(newEnd, newStart) < 1) newStart = addDays(newEnd, -1)
        } else if (dragType === 'resize-end') {
            newEnd = addDays(newEnd, deltaDays)
            if (differenceInDays(newEnd, newStart) < 1) newEnd = addDays(newStart, 1)
        }

        const newStartIso = newStart.toISOString()
        const newEndIso = newEnd.toISOString()

        setProjects(prev => prev.map(p => {
            if (dragItemType === 'project' && p.id === dragItemId) {
                return {
                    ...p,
                    expected_start_date: newStartIso,
                    deadline: newEndIso
                }
            } else if (dragItemType === 'task') {
                return {
                    ...p,
                    tasks: p.tasks?.map(t => {
                        if (t.id === dragItemId) {
                            return {
                                ...t,
                                start_date: newStartIso,
                                due_date: newEndIso
                            }
                        }
                        return t
                    })
                }
            }
            return p
        }))
    }

    const handleMouseUp = async () => {
        if (!isDragging || !dragItemId || !dragItemType) return

        if (dragItemType === 'project') {
            const project = projects.find(p => p.id === dragItemId)
            if (project) {
                const { error } = await supabase
                    .from('projects')
                    .update({
                        expected_start_date: project.expected_start_date,
                        deadline: project.deadline
                    })
                    .eq('id', dragItemId)
                if (error) console.error('Update failed', error)
                else router.refresh()
            }
        } else {
            // Find the task
            let taskToUpdate: Task | undefined
            for (const p of projects) {
                taskToUpdate = p.tasks?.find(t => t.id === dragItemId)
                if (taskToUpdate) break
            }

            if (taskToUpdate) {
                const { error } = await supabase
                    .from('tasks')
                    .update({
                        start_date: taskToUpdate.start_date,
                        due_date: taskToUpdate.due_date
                    })
                    .eq('id', dragItemId)
                if (error) console.error('Task Update failed', error)
                else router.refresh()
            }
        }

        setIsDragging(false)
        setDragType(null)
        setDragItemType(null)
        setDragItemId(null)
        setDragInitialDates(null)
    }

    const toggleProject = (id: string) => {
        const newSet = new Set(expandedProjects)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpandedProjects(newSet)
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
        <div className="space-y-4 select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
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
                    <button onClick={() => setViewMode('year')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'year' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Rok</button>
                    <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Měsíc</button>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">

                {/* Header Row */}
                <div className="flex border-b border-white/10 bg-white/5 h-12">
                    <div className="w-64 p-3 border-r border-white/10 shrink-0 font-medium text-gray-300 flex items-center">
                        Projekt / Úkol
                    </div>
                    <div className="flex-1 relative overflow-hidden" ref={containerRef}>
                        <div className="absolute inset-0 flex">
                            {timelineData.headers.map((header, i) => (
                                <div key={i} className="flex-1 border-r border-white/5 text-xs text-gray-400 flex items-center justify-center capitalize truncate px-1">
                                    {header}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rows */}
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    {projects.map(project => {
                        const style = getPosition(project.expected_start_date, project.deadline, project.created_at)
                        const isExpanded = expandedProjects.has(project.id)

                        return (
                            <div key={project.id} className="border-b border-white/5">
                                {/* Project Row */}
                                <div className="flex group hover:bg-white/[0.02] transition-colors relative h-12 bg-white/[0.02]">
                                    <div className="w-64 p-2 pl-4 border-r border-white/10 shrink-0 z-20 bg-[#1a1f2e] sticky left-0 flex items-center space-x-2">
                                        <button onClick={() => toggleProject(project.id)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                        </button>
                                        <Link href={`/dashboard/projekty/${project.id}`} className="truncate font-medium text-white hover:text-purple-400 transition-colors block flex-1">
                                            {project.name}
                                        </Link>
                                    </div>

                                    {/* Timeline Area */}
                                    <div className="flex-1 relative min-w-[300px]">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {Array.from({ length: timelineData.totalDays }).map((_, i) => (
                                                <div key={i} className="flex-1 border-r border-white/[0.03]"></div>
                                            ))}
                                        </div>

                                        {/* Project Bar */}
                                        {style && (
                                            <div
                                                className={`absolute top-2 h-8 rounded-md shadow-lg transition-shadow border cursor-move group/bar ${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-600'} ${isDragging && dragItemType === 'project' && dragItemId === project.id ? 'ring-2 ring-white z-30' : 'z-10'}`}
                                                style={style}
                                                onMouseDown={(e) => handleMouseDown(e, project.id, 'project', 'move')}
                                            >
                                                {/* Resize Handles */}
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-md z-20"
                                                    onMouseDown={(e) => handleMouseDown(e, project.id, 'project', 'resize-start')}
                                                />
                                                <div className="px-2 py-1 text-xs text-white truncate pointer-events-none w-full h-full flex items-center">
                                                    {project.name}
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-md z-20"
                                                    onMouseDown={(e) => handleMouseDown(e, project.id, 'project', 'resize-end')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tasks Sub-rows */}
                                {isExpanded && project.tasks && project.tasks.map(task => {
                                    const taskStyle = getPosition(task.start_date || null, task.due_date, task.created_at)
                                    return (
                                        <div key={task.id} className="flex group hover:bg-white/[0.02] transition-colors relative h-8 bg-black/20">
                                            <div className="w-64 p-2 pl-12 border-r border-white/10 shrink-0 z-10 bg-[#161b28] sticky left-0 flex items-center">
                                                <span className="truncate text-sm text-gray-400 hover:text-white transition-colors block">
                                                    {task.title}
                                                </span>
                                            </div>
                                            <div className="flex-1 relative min-w-[300px]">
                                                {/* Grid Lines */}
                                                <div className="absolute inset-0 flex pointer-events-none">
                                                    {Array.from({ length: timelineData.totalDays }).map((_, i) => (
                                                        <div key={i} className="flex-1 border-r border-white/[0.03]"></div>
                                                    ))}
                                                </div>

                                                {taskStyle && (
                                                    <div
                                                        className={`absolute top-1.5 h-5 rounded-sm border transition-shadow cursor-move group/taskbar ${isDragging && dragItemType === 'task' && dragItemId === task.id ? 'ring-1 ring-white z-30 bg-cyan-600' : 'bg-cyan-600/50 border-cyan-500/50 hover:bg-cyan-600'}`}
                                                        style={taskStyle}
                                                        onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'move')}
                                                    >
                                                        {/* Resize Handles for Tasks */}
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20"
                                                            onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'resize-start')}
                                                        />

                                                        <div className="px-2 text-[10px] text-cyan-100 truncate w-full h-full flex items-center pointer-events-none">
                                                            {task.status}
                                                        </div>

                                                        <div
                                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20"
                                                            onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'resize-end')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="text-xs text-gray-500 flex justify-between">
                <div>Tažením myši posunete termín projektu. Tažením okrajů změníte délku trvání.</div>
            </div>
        </div>
    )
}
