'use client'

import { useState } from 'react'
import { Calendar, Table2 } from 'lucide-react'
import ProjectTimeline from '@/components/timeline/project-timeline'
import ProjectTable from '@/components/projects/project-table'

interface Project {
    id: string
    name: string
    status: string
    expected_start_date: string | null
    deadline: string | null
    created_at: string
    customer?: string
    project_manager?: string
    tasks?: {
        id: string
        title: string
        status: string
        due_date: string | null
        created_at: string
        start_date?: string | null
        job_id?: string | null
    }[]
    jobs?: {
        id: string
        name: string
        status: string
        deadline: string | null
        expected_completion_date: string | null
        created_at: string
        start_date?: string | null
    }[]
}

export default function ProjectViews({ projects }: { projects: Project[] }) {
    const [view, setView] = useState<'timeline' | 'table'>('timeline')

    return (
        <div className="space-y-6">
            {/* View Switcher */}
            <div className="flex items-center space-x-2 bg-white/5 w-fit p-1 rounded-lg border border-white/10">
                <button
                    onClick={() => setView('timeline')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'timeline'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Časová osa</span>
                </button>
                <button
                    onClick={() => setView('table')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'table'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Table2 className="w-4 h-4" />
                    <span>Tabulka</span>
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {view === 'timeline' ? (
                    <ProjectTimeline projects={projects} />
                ) : (
                    <ProjectTable projects={projects} />
                )}
            </div>
        </div>
    )
}
