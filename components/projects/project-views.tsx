'use client'

import { useState } from 'react'
import ProjectTimeline, { Service } from '@/components/timeline/project-timeline'

interface Project {
    id: string
    name: string
    status: string
    expected_start_date: string | null
    deadline: string | null
    created_at: string
    created_by?: string
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

export default function ProjectViews({ projects, services = [], currentUserId }: { projects: Project[], services?: Service[], currentUserId?: string }) {
    const [zoom, setZoom] = useState(1) // 1 = 100%
    const [currentYear, setCurrentYear] = useState(new Date())

    const handleYearChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentYear)
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
        setCurrentYear(newDate)
    }

    const handleExpandToggle = () => {
        // This will be handled in timeline component
    }

    return (
        <div className="h-full">
            <ProjectTimeline
                projects={projects}
                services={services}
                zoom={zoom}
                onZoomChange={setZoom}
                onExpandToggle={handleExpandToggle}
                currentYear={currentYear}
                onYearChange={handleYearChange}
            />
        </div>
    )
}
