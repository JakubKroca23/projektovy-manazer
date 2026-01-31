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
        setCurrentYear(prev => direction === 'next' ? prev + 1 : prev - 1)
    }

    return (
        <div className="h-full flex flex-col">
            {/* Year navigation specific to projects timeline */}
            <div className="h-12 bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-white/10 flex items-center justify-center px-4">
                <div className="flex items-center bg-gray-100 dark:bg-black/20 rounded-lg px-2 py-1">
                    <button
                        onClick={() => handleYearChange('prev')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400"
                    >
                        ←
                    </button>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[60px] text-center">
                        {currentYear}
                    </span>
                    <button
                        onClick={() => handleYearChange('next')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400"
                    >
                        →
                    </button>
                </div>
            </div>

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
