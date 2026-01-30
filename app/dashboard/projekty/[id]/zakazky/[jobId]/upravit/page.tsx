'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

export default function UpravitZakazkuPage() {
    const router = useRouter()
    const { id: projectId, jobId } = useParams()

    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        order_number: '',
        status: 'planning',
        order_date: '',
        deadline: '',
        expected_completion_date: '',
        completion_percentage: 0,
        note: ''
    })

    useEffect(() => {
        const fetchJob = async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single()

            if (error) {
                setError('Nepodařilo se načíst zakázku: ' + error.message)
                setLoading(false)
                return
            }

            if (data) {
                setFormData({
                    name: data.name || '',
                    order_number: data.order_number || '',
                    status: data.status || 'planning',
                    order_date: data.order_date ? data.order_date.split('T')[0] : '',
                    deadline: data.deadline ? data.deadline.split('T')[0] : '',
                    expected_completion_date: data.expected_completion_date ? data.expected_completion_date.split('T')[0] : '',
                    completion_percentage: data.completion_percentage || 0,
                    note: data.note || ''
                })
            }
            setLoading(false)
        }
        fetchJob()
    }, [jobId, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        const { error: updateError } = await supabase
            .from('jobs')
            .update({
                name: formData.name,
                order_number: formData.order_number,
                status: formData.status,
                order_date: formData.order_date || null,
                deadline: formData.deadline || null,
                expected_completion_date: formData.expected_completion_date || null,
                completion_percentage: Number(formData.completion_percentage),
                note: formData.note
            })
            .eq('id', jobId)

        if (updateError) {
            setError(updateError.message)
            setSaving(false)
        } else {
            router.push(`/dashboard/projekty/${projectId}`)
            router.refresh()
        }
    }

    const handleDelete = async () => {
        if (!confirm('Opravdu chcete smazat tuto zakázku?')) return

        setSaving(true)
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId)

        if (error) {
            alert('Chyba při mazání: ' + error.message)
            setSaving(false)
        } else {
            router.push(`/dashboard/projekty/${projectId}`)
            router.refresh()
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Načítání...</div>

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <Link href={`/dashboard/projekty/${projectId}`} className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na detail projektu
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Upravit zakázku</h1>
                        <p className="text-gray-400 mt-2">Editace detailů zakázky</p>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Smazat zakázku"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
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
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Číslo objednávky</label>
                            <input type="text" name="order_number" value={formData.order_number} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Stav</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
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
                                <input type="date" name="order_date" value={formData.order_date} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 calendar-icon-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Termín dodání</label>
                                <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 calendar-icon-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Předpokládaný termín</label>
                                <input type="date" name="expected_completion_date" value={formData.expected_completion_date} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 calendar-icon-white" />
                            </div>
                        </div>
                    </div>

                    {/* Progress a Poznámka */}
                    <div className="border-t border-white/10 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">% Dokončeno</label>
                                <input type="number" name="completion_percentage" value={formData.completion_percentage} onChange={handleChange} min="0" max="100" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-200 mb-2">Poznámka</label>
                                <textarea name="note" value={formData.note} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{saving ? 'Ukládám...' : 'Uložit změny'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
