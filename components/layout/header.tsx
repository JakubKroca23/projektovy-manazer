'use client'

import { Bell, Search, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Header({ user }: { user: any }) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-20">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Search */}
                <div className="flex-1 max-w-2xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Hledat projekty, úkoly..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4 ml-6">
                    {/* Notifications */}
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
                        <Bell className="w-5 h-5 text-gray-300" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Odhlásit</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
