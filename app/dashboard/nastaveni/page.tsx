'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Save } from 'lucide-react'

export default function NastaveniPage() {
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id)

        if (error) {
            setMessage({ type: 'error', text: 'Chyba při ukládání: ' + error.message })
        } else {
            setMessage({ type: 'success', text: 'Profil byl úspěšně aktualizován!' })
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Nastavení Profilu</h1>
                <p className="text-gray-400">Upravte své osobní údaje</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/50' : 'bg-red-500/20 text-red-200 border border-red-500/50'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                            Celé jméno
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Zadejte nové jméno"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            <span>{loading ? 'Ukládám...' : 'Uložit změny'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
