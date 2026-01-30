'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'

export default function NovaZakazkaPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string

    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            project_id: projectId,
            name: formData.get('name') as string,
            order_number: formData.get('order_number') as string,
            order_date: formData.get('order_date') || null,
            deadline: formData.get('deadline') || null,
            expected_completion_date: formData.get('expected_completion_date') || null,
            status: formData.get('status') as string,
            completion_percentage: Number(formData.get('completion_percentage')) || 0,
            note: formData.get('note') as string,
        }

        const { error: insertError } = await supabase
            .from('jobs')
            .insert(data)

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
        } else {
            router.push(`/dashboard/projekty/${projectId}`)
            router.refresh()
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <Link href={`/dashboard/projekty/${projectId}`} className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na detail projektu
                </Link>
                <h1 className="text-3xl font-bold text-white">Nová zakázka</h1>
                <p className="text-gray-400 mt-2">Vytvořte novou zakázku pod tímto projektem (např. konkrétní vozidlo)</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">

                    {/* Základní údaje */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Název zakázky *</label>
                            <input type="text" name="name" required placeholder="Např. Vozidlo 1, Sklápěč 005..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Číslo objednávky</label>
                            <input type="text" name="order_number" placeholder="Interní číslo..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Stav</label>
                            <select name="status" defaultValue="planning" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                <option value="planning" className="text-gray-900">Plánování</option>
                                <option value="in_production" className="text-gray-900">Ve výrobě</option>
                                <option value="done" className="text-gray-900">Hotovo</option>
                                <option value="delivered" className="text-gray-900">Dodáno</option>
                                <option value="canceled" className="text-gray-900">Zrušeno</option>
                            </select>
                        </div>
                    </div>

                    {/* Termíny */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-lg font-medium text-white mb-4">Termíny</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Datum objednání</label>
                                <input type="date" name="order_date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 calendar-icon-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Termín dodání</label>
                                <input type="date" name="deadline" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 calendar-icon-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Předpokládaný termín</label>
                                <input type="date" name="expected_completion_date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 calendar-icon-white" />
                            </div>
                        </div>
                    </div>

                    {/* Progress a Poznámka */}
                    <div className="border-t border-white/10 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">% Dokončeno</label>
                                <input type="number" name="completion_percentage" min="0" max="100" defaultValue="0" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-200 mb-2">Poznámka</label>
                                <textarea name="note" rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{loading ? 'Ukládám...' : 'Vytvořit zakázku'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
