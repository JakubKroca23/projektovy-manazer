'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovyProjektPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('planning')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('Musíte být přihlášeni')
            setLoading(false)
            return
        }

        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                name,
                description,
                status,
                created_by: user.id,
            })
            .select()
            .single()

        if (projectError) {
            setError(projectError.message)
            setLoading(false)
            return
        }

        // Add creator as project owner
        await supabase.from('project_members').insert({
            project_id: project.id,
            user_id: user.id,
            role: 'owner',
        })

        router.push(`/dashboard/projekty/${project.id}`)
        router.refresh()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/projekty"
                    className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Zpět na projekty</span>
                </Link>
                <h1 className="text-3xl font-bold text-white">Nový projekt</h1>
            </div>

            {/* Form */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                            Název projektu *
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Např. Nový web pro firmu"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                            Popis
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            placeholder="Stručný popis projektu..."
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-200 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                            <option value="planning">Plánování</option>
                            <option value="active">Aktivní</option>
                            <option value="completed">Dokončeno</option>
                            <option value="archived">Archivováno</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Vytváření...' : 'Vytvořit projekt'}
                        </button>
                        <Link
                            href="/dashboard/projekty"
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg transition-all"
                        >
                            Zrušit
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
