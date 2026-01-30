'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, startOfYear, endOfYear, isBefore, isAfter } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, GripVertical, ChevronDown, ChevronRight as ChevronRightIcon, Truck, Wrench } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'



interface Task {
    id: string
    title: string
    status: string
    due_date: string | null
    created_at: string
    start_date?: string | null
    job_id?: string | null
}

interface Job {
    id: string
    name: string
    status: string
    deadline: string | null
    expected_completion_date: string | null
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
    jobs?: Job[]
}

export interface Service {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    status: string
    created_at: string
}

export default function ProjectTimeline({ projects: initialProjects, services: initialServices = [] }: { projects: Project[], services?: Service[] }) {
    const [projects, setProjects] = useState(initialProjects)
    const [services, setServices] = useState(initialServices) // Use state for optimistic updates
    const [zoom, setZoom] = useState(1) // 1 = 100%
    const [currentDate, setCurrentDate] = useState(new Date())

    // Default expanded all
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
        return new Set(initialProjects.map(p => p.id))
    })
    const [expandedJobs, setExpandedJobs] = useState<Set<string>>(() => {
        const jobs = new Set<string>()
        initialProjects.forEach(p => p.jobs?.forEach(j => jobs.add(j.id)))
        return jobs
    })
    const [showServices, setShowServices] = useState(true)

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false)
    const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null)
    const [dragItemType, setDragItemType] = useState<'project' | 'job' | 'task' | 'service' | null>(null)
    const [dragItemId, setDragItemId] = useState<string | null>(null)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragInitialDates, setDragInitialDates] = useState<{ start: Date, end: Date } | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        setProjects(initialProjects)
    }, [initialProjects])

    useEffect(() => {
        setServices(initialServices)
    }, [initialServices])

    // Generování časové osy
    const timelineData = useMemo(() => {
        const yearStart = startOfYear(currentDate)
        const yearEnd = endOfYear(currentDate)

        // Always Year View Logic (Zoomable)
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })
        return {
            headers: months.map(d => format(d, 'MMMM', { locale: cs })),
            startDate: yearStart,
            endDate: yearEnd,
            totalDays: differenceInDays(yearEnd, yearStart) + 1,
        }
    }, [currentDate])

    const getPosition = (start: string | null, end: string | null, created: string) => {
        const timelineStart = timelineData.startDate
        const itemStart = start ? new Date(start) : new Date(created)
        const itemEnd = end ? new Date(end) : addDays(itemStart, 1) // Default duration 1 day if undefined

        const startDiff = differenceInDays(itemStart, timelineStart)
        const duration = differenceInDays(itemEnd, itemStart)

        // Display check
        if (differenceInDays(itemEnd, timelineData.startDate) < 0) return null
        if (differenceInDays(itemStart, timelineData.endDate!) > 0) return null

        const leftPercent = (startDiff / timelineData.totalDays) * 100
        const widthPercent = (Math.max(duration, 1) / timelineData.totalDays) * 100

        return {
            left: `${leftPercent}%`,
            width: `${Math.max(widthPercent, 0.5)}%`
        }
    }

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent, itemId: string, itemType: 'project' | 'job' | 'task' | 'service', type: 'move' | 'resize-start' | 'resize-end') => {
        e.preventDefault()
        e.stopPropagation()

        let item: { start: string | null | undefined, end: string | null, created: string } | null = null

        if (itemType === 'service') {
            const service = services.find(s => s.id === itemId)
            if (service) {
                item = { start: service.start_date, end: service.end_date, created: service.created_at }
            }
        } else if (itemType === 'project') {
            const project = projects.find(p => p.id === itemId)
            if (project) {
                item = { start: project.expected_start_date, end: project.deadline, created: project.created_at }
            }
        } else if (itemType === 'job') {
            for (const p of projects) {
                const job = p.jobs?.find(j => j.id === itemId)
                if (job) {
                    item = {
                        start: job.start_date || job.created_at,
                        end: job.expected_completion_date || job.deadline,
                        created: job.created_at
                    }
                    break
                }
            }
        } else {
            // Task
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
        const end = item.end ? new Date(item.end) : addDays(start, 1)

        setDragInitialDates({ start, end })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragItemId || !dragInitialDates || !containerRef.current || !dragItemType) return

        const deltaPixels = e.clientX - dragStartX
        const containerWidth = containerRef.current.offsetWidth
        const pixelsPerDay = containerWidth / timelineData.totalDays
        const deltaDays = Math.round(deltaPixels / pixelsPerDay)

        if (deltaDays === 0 && dragType === 'move') return

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

        if (dragItemType === 'service') {
            setServices(prev => prev.map(s =>
                s.id === dragItemId ? { ...s, start_date: newStartIso, end_date: newEndIso } : s
            ))
            return
        }

        setProjects(prev => prev.map(p => {
            if (dragItemType === 'project' && p.id === dragItemId) {
                return { ...p, expected_start_date: newStartIso, deadline: newEndIso }
            }

            if (dragItemType === 'job') {
                return {
                    ...p,
                    jobs: p.jobs?.map(j => {
                        if (j.id === dragItemId) {
                            return { ...j, start_date: newStartIso, expected_completion_date: newEndIso }
                        }
                        return j
                    })
                }
            }

            if (dragItemType === 'task') {
                return {
                    ...p,
                    tasks: p.tasks?.map(t => {
                        if (t.id === dragItemId) {
                            return { ...t, start_date: newStartIso, due_date: newEndIso }
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

        if (dragItemType === 'service') {
            const service = services.find(s => s.id === dragItemId)
            if (service) {
                await supabase.from('services').update({
                    start_date: service.start_date,
                    end_date: service.end_date
                }).eq('id', dragItemId)
                router.refresh()
            }
        } else if (dragItemType === 'project') {
            const project = projects.find(p => p.id === dragItemId)
            if (project) {
                await supabase.from('projects').update({
                    expected_start_date: project.expected_start_date,
                    deadline: project.deadline
                }).eq('id', dragItemId)
                router.refresh()
            }
        } else if (dragItemType === 'job') {
            // ... (same as before)
            let jobToUpdate: Job | undefined
            for (const p of projects) {
                jobToUpdate = p.jobs?.find(j => j.id === dragItemId)
                if (jobToUpdate) break
            }
            if (jobToUpdate) {
                await supabase.from('jobs').update({
                    start_date: jobToUpdate.start_date,
                    expected_completion_date: jobToUpdate.expected_completion_date,
                }).eq('id', dragItemId)
                router.refresh()
            }
        } else if (dragItemType === 'task') {
            // ...
            let taskToUpdate: Task | undefined
            for (const p of projects) {
                taskToUpdate = p.tasks?.find(t => t.id === dragItemId)
                if (taskToUpdate) break
            }
            if (taskToUpdate) {
                await supabase.from('tasks').update({
                    start_date: taskToUpdate.start_date,
                    due_date: taskToUpdate.due_date
                }).eq('id', dragItemId)
                router.refresh()
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

    const toggleJob = (id: string) => {
        const newSet = new Set(expandedJobs)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpandedJobs(newSet)
    }

    const navigation = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
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
                        {format(currentDate, 'yyyy')}
                    </h3>
                    <button onClick={() => navigation('next')} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            if (expandedProjects.size > 0 || showServices) {
                                setExpandedProjects(new Set())
                                setExpandedJobs(new Set())
                                setShowServices(false)
                            } else {
                                setExpandedProjects(new Set(projects.map(p => p.id)))
                                const jobs = new Set<string>()
                                projects.forEach(p => p.jobs?.forEach(j => jobs.add(j.id)))
                                setExpandedJobs(jobs)
                                setShowServices(true)
                            }
                        }}
                        className="text-xs text-gray-400 hover:text-white ml-4 border border-white/10 px-2 py-1 rounded"
                    >
                        {expandedProjects.size > 0 || showServices ? 'Sbalit vše' : 'Rozbalit vše'}
                    </button>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-black/20 rounded-lg p-1 space-x-2 px-3">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Zoom</span>
                        <input
                            type="range"
                            min="100"
                            max="500"
                            value={zoom * 100}
                            onChange={(e) => setZoom(Number(e.target.value) / 100)}
                            className="w-32 accent-purple-600 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-gray-400 min-w-[3ch]">{Math.round(zoom * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">

                {/* Main Scrollable Area */}
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto custom-scrollbar">

                    {/* Header Row - Sticky Top */}
                    <div className="flex border-b border-white/10 bg-[#1a1f2e] h-12 sticky top-0 z-50 min-w-full w-fit">
                        <div className="w-72 p-3 border-r border-white/10 shrink-0 font-medium text-gray-300 flex items-center pl-4 sticky left-0 bg-[#1a1f2e] z-50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
                            Projekt / Zakázka / Servis
                        </div>
                        <div className="flex-1 relative overflow-hidden" style={{ minWidth: `${zoom * 100}%` }}>
                            {/* Only ref the content that changes width */}
                            <div className="absolute inset-0 flex" ref={containerRef}>
                                {timelineData.headers.map((header, i) => (
                                    <div key={i} className="flex-1 border-r border-white/5 text-xs text-gray-400 flex items-center justify-center capitalize truncate px-1">
                                        {header}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Services Section */}
                    {services.length > 0 && (
                        <div className="border-b border-white/5 bg-red-900/10 min-w-full w-fit">
                            <div className="flex group hover:bg-white/[0.02] transition-colors relative h-10 bg-white/[0.02]">
                                <div className="w-72 p-2 pl-2 border-r border-white/10 shrink-0 z-40 bg-[#1a1f2e] sticky left-0 flex items-center space-x-2 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                                    <button onClick={() => setShowServices(!showServices)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                                        {showServices ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                    </button>
                                    <Wrench className="w-4 h-4 text-red-500" />
                                    <span className="font-bold text-red-400 truncate">SERVISY</span>
                                </div>
                                <div className="flex-1 relative" style={{ minWidth: `${zoom * 100}%` }}>
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {Array.from({ length: timelineData.totalDays }).map((_, i) => <div key={i} className="flex-1 border-r border-white/[0.03]"></div>)}
                                    </div>

                                    {/* Render collapsed services on the timeline track */}
                                    {!showServices && services.map(service => {
                                        const style = getPosition(service.start_date, service.end_date, service.created_at)
                                        if (!style) return null
                                        return (
                                            <div
                                                key={service.id}
                                                className="absolute top-2.5 h-5 rounded-sm bg-red-600/60 border border-red-500/50 hover:bg-red-600 z-10 cursor-pointer"
                                                style={style}
                                                title={service.name}
                                                onClick={() => setShowServices(true)}
                                            />
                                        )
                                    })}
                                </div>
                            </div>

                            {showServices && services.map(service => {
                                const style = getPosition(service.start_date, service.end_date, service.created_at)
                                return (
                                    <div key={service.id} className="flex group hover:bg-white/[0.02] transition-colors relative h-8 bg-black/20">
                                        <div className="w-72 p-2 pl-8 border-r border-white/10 shrink-0 z-30 bg-[#161b28] sticky left-0 flex items-center shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                                            <span className="truncate text-sm text-gray-300 hover:text-white transition-colors block">
                                                {service.name}
                                            </span>
                                        </div>
                                        <div className="flex-1 relative" style={{ minWidth: `${zoom * 100}%` }}>
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {Array.from({ length: timelineData.totalDays }).map((_, i) => <div key={i} className="flex-1 border-r border-white/[0.03]"></div>)}
                                            </div>
                                            {style && (
                                                <div className={`absolute top-1.5 h-5 rounded-sm border transition-shadow cursor-move group/servicetbar ${isDragging && dragItemType === 'service' && dragItemId === service.id ? 'ring-1 ring-white z-30 bg-red-600' : 'bg-red-600/60 border-red-500/50 hover:bg-red-600'}`}
                                                    style={style} onMouseDown={(e) => handleMouseDown(e, service.id, 'service', 'move')}>
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20" onMouseDown={(e) => handleMouseDown(e, service.id, 'service', 'resize-start')} />
                                                    <div className="px-2 text-[10px] text-red-100 truncate w-full h-full flex items-center pointer-events-none uppercase font-bold tracking-wider">{service.status}</div>
                                                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20" onMouseDown={(e) => handleMouseDown(e, service.id, 'service', 'resize-end')} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Projects... */}
                    {projects.map(project => {
                        const style = getPosition(project.expected_start_date, project.deadline, project.created_at)
                        const isExpanded = expandedProjects.has(project.id)

                        const projectTasks = project.tasks?.filter(t => !t.job_id) || []
                        const projectJobs = project.jobs || []

                        return (
                            <div key={project.id} className="border-b border-white/5 min-w-full w-fit">
                                {/* Project Row - same as before */}
                                <div className="flex group hover:bg-white/[0.02] transition-colors relative h-12 bg-white/[0.02]">
                                    <div className="w-72 p-2 pl-2 border-r border-white/10 shrink-0 z-40 bg-[#1a1f2e] sticky left-0 flex items-center space-x-2 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                                        <button onClick={() => toggleProject(project.id)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                        </button>
                                        <Link href={`/dashboard/projekty/${project.id}`} className="truncate font-bold text-white hover:text-purple-400 transition-colors block flex-1">
                                            {project.name}
                                        </Link>
                                    </div>

                                    {/* Timeline Area (Project) */}
                                    <div className="flex-1 relative" style={{ minWidth: `${zoom * 100}%` }}>
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {Array.from({ length: timelineData.totalDays }).map((_, i) => (
                                                <div key={i} className="flex-1 border-r border-white/[0.03]"></div>
                                            ))}
                                        </div>
                                        {style && (
                                            <div
                                                className={`absolute top-2 h-8 rounded-md shadow-lg transition-shadow border cursor-move group/bar ${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-600'} ${isDragging && dragItemType === 'project' && dragItemId === project.id ? 'ring-2 ring-white z-30' : 'z-10'}`}
                                                style={style}
                                                onMouseDown={(e) => handleMouseDown(e, project.id, 'project', 'move')}
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-md z-20"
                                                    onMouseDown={(e) => handleMouseDown(e, project.id, 'project', 'resize-start')} />
                                                <div className="px-2 py-1 text-xs text-white truncate pointer-events-none w-full h-full flex items-center font-bold">
                                                    {project.name}
                                                </div>
                                                <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-md z-20"
                                                    onMouseDown={(e) => handleMouseDown(e, project.id, 'project', 'resize-end')} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <>
                                        {/* Project Tasks */}
                                        {projectTasks.map(task => {
                                            const taskStyle = getPosition(task.start_date || null, task.due_date, task.created_at)
                                            return (
                                                <div key={task.id} className="flex group hover:bg-white/[0.02] transition-colors relative h-8 bg-black/20">
                                                    <div className="w-72 p-2 pl-8 border-r border-white/10 shrink-0 z-30 bg-[#161b28] sticky left-0 flex items-center shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                                                        <span className="truncate text-sm text-gray-400 hover:text-white transition-colors block">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 relative" style={{ minWidth: `${zoom * 100}%` }}>
                                                        <div className="absolute inset-0 flex pointer-events-none">
                                                            {Array.from({ length: timelineData.totalDays }).map((_, i) => <div key={i} className="flex-1 border-r border-white/[0.03]"></div>)}
                                                        </div>
                                                        {taskStyle && (
                                                            <div className={`absolute top-1.5 h-5 rounded-sm border transition-shadow cursor-move group/taskbar ${isDragging && dragItemType === 'task' && dragItemId === task.id ? 'ring-1 ring-white z-30 bg-cyan-600' : 'bg-cyan-600/50 border-cyan-500/50 hover:bg-cyan-600'}`}
                                                                style={taskStyle} onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'move')}>
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20" onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'resize-start')} />
                                                                <div className="px-2 text-[10px] text-cyan-100 truncate w-full h-full flex items-center pointer-events-none">{task.status}</div>
                                                                <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20" onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'resize-end')} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* Jobs */}
                                        {projectJobs.map(job => {
                                            const jobExpanded = expandedJobs.has(job.id)
                                            const jobTasks = project.tasks?.filter(t => t.job_id === job.id) || []
                                            const jobStyle = getPosition(job.start_date || job.created_at, job.expected_completion_date || job.deadline, job.created_at)

                                            return (
                                                <div key={job.id}>
                                                    {/* Job Row */}
                                                    <div className="flex group hover:bg-white/[0.02] transition-colors relative h-10 bg-white/[0.05]">
                                                        <div className="w-72 p-2 pl-6 border-r border-white/10 shrink-0 z-40 bg-[#181d2b] sticky left-0 flex items-center space-x-2 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                                                            <button onClick={() => toggleJob(job.id)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                                                                {jobExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                                                            </button>
                                                            <Truck className="w-3 h-3 text-orange-400" />
                                                            <span className="truncate text-sm font-medium text-white hover:text-purple-400 transition-colors block flex-1">
                                                                {job.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 relative" style={{ minWidth: `${zoom * 100}%` }}>
                                                            <div className="absolute inset-0 flex pointer-events-none">
                                                                {Array.from({ length: timelineData.totalDays }).map((_, i) => <div key={i} className="flex-1 border-r border-white/[0.03]"></div>)}
                                                            </div>
                                                            {jobStyle && (
                                                                <div className={`absolute top-1.5 h-7 rounded shadow transition-shadow border cursor-move group/jobbar ${isDragging && dragItemType === 'job' && dragItemId === job.id ? 'ring-2 ring-white z-30 bg-orange-600' : 'bg-orange-600/60 border-orange-500/50 hover:bg-orange-600'}`}
                                                                    style={jobStyle} onMouseDown={(e) => handleMouseDown(e, job.id, 'job', 'move')}
                                                                >
                                                                    <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l z-20" onMouseDown={(e) => handleMouseDown(e, job.id, 'job', 'resize-start')} />
                                                                    <div className="px-2 py-1 text-xs text-orange-100 truncate pointer-events-none w-full h-full flex items-center">{job.name}</div>
                                                                    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r z-20" onMouseDown={(e) => handleMouseDown(e, job.id, 'job', 'resize-end')} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Job Tasks */}
                                                    {jobExpanded && jobTasks.map(task => {
                                                        const taskStyle = getPosition(task.start_date || null, task.due_date, task.created_at)
                                                        return (
                                                            <div key={task.id} className="flex group hover:bg-white/[0.02] transition-colors relative h-8 bg-black/20">
                                                                <div className="w-72 p-2 pl-12 border-r border-white/10 shrink-0 z-30 bg-[#161b28] sticky left-0 flex items-center shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                                                                    <span className="truncate text-sm text-gray-400 hover:text-white transition-colors block">
                                                                        {task.title}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 relative" style={{ minWidth: `${zoom * 100}%` }}>
                                                                    <div className="absolute inset-0 flex pointer-events-none">
                                                                        {Array.from({ length: timelineData.totalDays }).map((_, i) => <div key={i} className="flex-1 border-r border-white/[0.03]"></div>)}
                                                                    </div>
                                                                    {taskStyle && (
                                                                        <div className={`absolute top-1.5 h-5 rounded-sm border transition-shadow cursor-move group/taskbar ${isDragging && dragItemType === 'task' && dragItemId === task.id ? 'ring-1 ring-white z-30 bg-cyan-600' : 'bg-cyan-600/50 border-cyan-500/50 hover:bg-cyan-600'}`}
                                                                            style={taskStyle} onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'move')}>
                                                                            <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20" onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'resize-start')} />
                                                                            <div className="px-2 text-[10px] text-cyan-100 truncate w-full h-full flex items-center pointer-events-none">{task.status}</div>
                                                                            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/40 z-20" onMouseDown={(e) => handleMouseDown(e, task.id, 'task', 'resize-end')} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end space-x-4 text-xs text-gray-500">
                <div className="flex items-center"><div className="w-3 h-3 bg-red-600 rounded mr-2"></div> Servis</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div> Projekt (Plánování)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div> Projekt (Aktivní)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-orange-600/60 rounded mr-2"></div> Zakázka (Vozidlo)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-cyan-600/50 rounded mr-2"></div> Úkol</div>
            </div>
        </div>
    )
}
