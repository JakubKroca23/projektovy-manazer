'use client'

import { Suspense } from 'react'
import ProjectViews from '@/components/projects/project-views'
import TopNavbar from '@/components/layout/top-navbar'

interface ProjectsClientPageProps {
    projects: any[]
    services: any[]
    user: any
}

export default function ProjectsClientPage({ projects, services, user }: ProjectsClientPageProps) {
    return (
        <div className="h-full flex flex-col">
            <TopNavbar user={user} />

            {/* Fullscreen timeline */}
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Načítání...</div>}>
                    <ProjectViews
                        projects={projects}
                        services={services}
                        currentUserId={user?.id}
                    />
                </Suspense>
            </div>
        </div>
    )
}
