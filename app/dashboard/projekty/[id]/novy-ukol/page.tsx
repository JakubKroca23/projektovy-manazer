'use client'

import { useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Flag } from 'lucide-react'
import Link from 'next/link'

export default function NovyUkolPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('medium')
    const [dueDate, setDueDate] = useState('')
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

        // Use RPC to bypass RLS issues
        const { error: taskError } = await supabase
            .rpc('create_new_task', {
                p_project_id: projectId,
                p_title: title,
                p_description: description,
                p_priority: priority,
                p_due_date: dueDate ? new Date(dueDate).toISOString() : null,
            })

        if (taskError) {
            setError(taskError.message)
            setLoading(false)
        } else {
            router.push(`/dashboard/projekty/${projectId}`)
            router.refresh()
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/dashboard/projekty/${projectId}`}
                    className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Zpět na projekt</span>
                </Link>
                <h1 className="text-3xl font-bold text-white">Nový úkol</h1>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                            Název úkolu *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Co je potřeba udělat?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                            Popis
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Detaily úkolu..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Priorita
                            </label>
                            <div className="relative">
                                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                                >
                                    <option value="low" className="bg-slate-900">Nízká</option>
                                    <option value="medium" className="bg-slate-900">Střední</option>
                                    <option value="high" className="bg-slate-900">Vysoká</option>
                                    <option value="urgent" className="bg-slate-900">Urgentní</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Termín
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex space-x-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg"
                        >
                            {loading ? 'Vytváření...' : 'Vytvořit úkol'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
