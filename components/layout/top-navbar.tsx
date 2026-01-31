'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, Sun, Moon, LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from './theme-provider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TopNavbarProps {
    user: any
    currentYear?: number
    onYearChange?: (direction: 'prev' | 'next') => void
}

export default function TopNavbar({ user, currentYear, onYearChange }: TopNavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { theme, toggleTheme } = useTheme()
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const navItems = [
        { name: 'Přehled', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projekty', href: '/dashboard/projekty', icon: FolderKanban },
        { name: 'Úkoly', href: '/dashboard/ukoly', icon: CheckSquare },
        { name: 'Tým', href: '/dashboard/tym', icon: Users },
        { name: 'Nastavení', href: '/dashboard/nastaveni', icon: Settings },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Top Bar */}
            <div className="h-12 bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-white/10 flex items-center px-4 gap-4 relative z-50 transition-colors">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    {/* Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {/* Logo/Title */}
                    <Link href="/dashboard" className="font-bold text-lg text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        Projektový Manager
                    </Link>

                    {/* Year Navigation (if provided) */}
                    {currentYear && onYearChange && (
                        <div className="flex items-center bg-gray-100 dark:bg-black/20 rounded-lg px-2 py-1 ml-2">
                            <button
                                onClick={() => onYearChange('prev')}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[60px] text-center">
                                {currentYear}
                            </span>
                            <button
                                onClick={() => onYearChange('next')}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors text-gray-600 dark:text-gray-400"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Center Section - Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Hledat projekty, úkoly..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-1.5 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                        title={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                            {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200 hidden sm:block">
                            {user?.full_name || user?.email}
                        </span>
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Odhlásit se"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Collapsible Menu Panel */}
            {isMenuOpen && (
                <div className="bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-white/10 shadow-lg transition-colors">
                    <nav className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active
                                                ? 'bg-purple-600 text-white shadow-lg'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </nav>
                </div>
            )}
        </>
    )
}
