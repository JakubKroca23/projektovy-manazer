'use client'

import { useState } from 'react'
import ProjectViews from '@/components/projects/project-views'
import TopNavbar from '@/components/layout/top-navbar'

interface ProjectsClientPageProps {
    projects: any[]
    services: any[]
    user: any
}

export default function ProjectsClientPage({ projects, services, user }: ProjectsClientPageProps) {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    const handleYearChange = (direction: 'prev' | 'next') => {
        setCurrentYear((prev: number) => direction === 'next' ? prev + 1 : prev - 1)
    }

    return (
        <div className="h-full flex flex-col">
            {/* TopNavbar with year navigation and timeline legend */}
            <TopNavbar
                user={user}
                currentYear={currentYear}
                onYearChange={handleYearChange}
                showLegend={true}
            />

            {/* Fullscreen timeline */}
            <div className="flex-1 overflow-hidden">
                <ProjectViews
                    projects={projects}
                    services={services}
                    currentUserId={user?.id}
                    currentYear={currentYear}
                />
            </div>
        </div>
    )
}
