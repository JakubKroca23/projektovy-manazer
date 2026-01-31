'use client'

import { useState, useEffect } from 'react'
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

export default function ProjectViews({ projects, services = [], currentUserId, currentYear: currentYearProp }: { projects: Project[], services?: Service[], currentUserId?: string, currentYear?: number }) {
    const [zoom, setZoom] = useState(1) // 1 = 100%

    // Convert currentYear number to Date object
    const [currentYear, setCurrentYear] = useState(() => {
        if (currentYearProp) {
            const date = new Date()
            date.setFullYear(currentYearProp)
            return date
        }
        return new Date()
    })

    // Update currentYear when prop changes
    useEffect(() => {
        if (currentYearProp) {
            const date = new Date()
            date.setFullYear(currentYearProp)
            setCurrentYear(date)
        }
    }, [currentYearProp]) // Depend on currentYearProp

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
