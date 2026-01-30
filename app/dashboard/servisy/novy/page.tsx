'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NovyServisPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        const { error: dbError } = await supabase
            .from('services')
            .insert({
                name,
                description,
                start_date: startDate || null,
                end_date: endDate || null,
                created_by: user?.id
            })

        if (dbError) {
            setError(dbError.message)
            setLoading(false)
        } else {
            router.push('/dashboard/projekty')
            router.refresh()
        }
    }

    return (
        <div className="max-w-2xl mx-auto pb-12">
            <div className="mb-8">
                <Link href="/dashboard/projekty" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na přehled
                </Link>
                <h1 className="text-3xl font-bold text-white">Naplánovat servis</h1>
                <p className="text-gray-400 mt-2">Vytvořte novou servisní událost v kalendáři</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-xl border border-white/10">
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Název servisu *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Např. Garanční prohlídka Tatra..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Popis</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Detaily servisu..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">Začátek</label>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">Konec (Odhad)</label>
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 [color-scheme:dark]"
                        />
                    </div>
                </div>

                <div className="pt-4 flex items-center space-x-4">
                    <button type="submit" disabled={loading} className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                        {loading ? 'Ukládání...' : 'Vytvořit servis'}
                    </button>
                    <Link href="/dashboard/projekty" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-all">
                        Zrušit
                    </Link>
                </div>
            </form>
        </div>
    )
}
