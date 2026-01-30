'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'

export default function GenerateJobsButton({ projectId, quantity }: { projectId: string, quantity: number }) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleGenerate = async () => {
        if (quantity < 1) {
            alert('Projekt nemá definovaný počet kusů (Quantity). Upravte projekt a zadejte počet.')
            return
        }

        if (!confirm(`Opravdu chcete hromadně vygenerovat ${quantity} zakázek (Vozidlo 1 - ${quantity})?`)) return

        setLoading(true)

        const jobs = Array.from({ length: quantity }, (_, i) => ({
            project_id: projectId,
            name: `Vozidlo ${i + 1}`,
            status: 'planning',
            completion_percentage: 0
        }))

        const { error } = await supabase.from('jobs').insert(jobs)

        if (error) {
            console.error('Error generating jobs:', error)
            alert('Chyba při generování zakázek: ' + error.message)
        } else {
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <Copy className="w-4 h-4" />
            )}
            <span>Generovat ({quantity || 0} ks)</span>
        </button>
    )
}
