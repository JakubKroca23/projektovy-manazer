'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Projekty', href: '/dashboard/projekty', icon: FolderKanban },
    { name: 'Úkoly', href: '/dashboard/ukoly', icon: CheckSquare },
    { name: 'Tým', href: '/dashboard/tym', icon: Users },
    { name: 'Nastavení', href: '/dashboard/nastaveni', icon: Settings },
]

export default function Sidebar({ user }: { user: any }) {
    const pathname = usePathname()

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-white/10 backdrop-blur-xl bg-white/5">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    ProjectHub
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-white border border-purple-500/50'
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white font-semibold">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user?.role || 'member'}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
