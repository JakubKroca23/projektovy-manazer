'use client'

import TopNavbar from './top-navbar'

interface DashboardClientWrapperProps {
    user: any
    children: React.ReactNode
}

export default function DashboardClientWrapper({ user, children }: DashboardClientWrapperProps) {
    return (
        <>
            <TopNavbar user={user} />
            {children}
        </>
    )
}
