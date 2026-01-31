'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Save, Bell, Eye, Briefcase, Database, Download, Trash2 } from 'lucide-react'

export default function NastaveniPage() {
    const [fullName, setFullName] = useState('')
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [inAppAlerts, setInAppAlerts] = useState(true)
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(1)
    const [defaultView, setDefaultView] = useState('timeline')
    const [autoExpandProjects, setAutoExpandProjects] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profile) {
            setFullName(profile.full_name || '')
            // Load other settings from profile metadata or separate table
            if (profile.settings) {
                const settings = profile.settings
                setEmailNotifications(settings.emailNotifications ?? true)
                setInAppAlerts(settings.inAppAlerts ?? true)
                setDateFormat(settings.dateFormat || 'DD/MM/YYYY')
                setFirstDayOfWeek(settings.firstDayOfWeek ?? 1)
                setDefaultView(settings.defaultView || 'timeline')
                setAutoExpandProjects(settings.autoExpandProjects ?? true)
            }
        }
    }

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const settings = {
            emailNotifications,
            inAppAlerts,
            dateFormat,
            firstDayOfWeek,
            defaultView,
            autoExpandProjects
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                settings
            })
            .eq('id', user.id)

        if (error) {
            setMessage({ type: 'error', text: 'Chyba při ukládání: ' + error.message })
        } else {
            setMessage({ type: 'success', text: 'Nastavení bylo úspěšně uloženo!' })
            router.refresh()
        }
        setLoading(false)
    }

    const handleExportData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Export user data as JSON
        const { data: projects } = await supabase.from('projects').select('*').eq('created_by', user.id)
        const { data: tasks } = await supabase.from('tasks').select('*').eq('created_by', user.id)

        const exportData = { projects, tasks, exportDate: new Date().toISOString() }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `projektovy-manazer-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 max-w-4xl pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Nastavení</h1>
                <p className="text-gray-400">Spravujte své preference a nastavení účtu</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/50' : 'bg-red-500/20 text-red-200 border border-red-500/50'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-6">
                {/* Profile Section */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <User className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Profil</h2>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">Celé jméno</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Vaše jméno"
                        />
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Bell className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white">Notifikace</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-200">E-mailové notifikace</span>
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                                className="w-5 h-5 accent-purple-600"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-200">Upozornění v aplikaci</span>
                            <input
                                type="checkbox"
                                checked={inAppAlerts}
                                onChange={(e) => setInAppAlerts(e.target.checked)}
                                className="w-5 h-5 accent-purple-600"
                            />
                        </label>
                    </div>
                </div>

                {/* Display Preferences */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Eye className="w-5 h-5 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Zobrazení</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Formát data</label>
                            <select
                                value={dateFormat}
                                onChange={(e) => setDateFormat(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">První den týdne</label>
                            <select
                                value={firstDayOfWeek}
                                onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value={1}>Pondělí</option>
                                <option value={0}>Neděle</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Workspace Settings */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Briefcase className="w-5 h-5 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">Pracovní prostředí</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Výchozí zobrazení</label>
                            <select
                                value={defaultView}
                                onChange={(e) => setDefaultView(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="timeline">Časová osa</option>
                                <option value="table">Tabulka</option>
                            </select>
                        </div>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-200">Automaticky rozbalit projekty</span>
                            <input
                                type="checkbox"
                                checked={autoExpandProjects}
                                onChange={(e) => setAutoExpandProjects(e.target.checked)}
                                className="w-5 h-5 accent-purple-600"
                            />
                        </label>
                    </div>
                </div>

                {/* Data Management */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Database className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Správa dat</h2>
                    </div>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleExportData}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 rounded-lg transition-all w-full"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportovat data</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Opravdu chcete smazat účet? Tato akce je nevratná!')) {
                                    // Implementation for account deletion
                                    alert('Funkce smazání účtu bude brzy dostupná')
                                }
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-200 rounded-lg transition-all w-full"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Smazat účet</span>
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg"
                    >
                        <Save className="w-5 h-5" />
                        <span>{loading ? 'Ukládám...' : 'Uložit všechna nastavení'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
