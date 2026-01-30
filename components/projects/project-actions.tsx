'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Edit, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProjectActions({ projectId, projectName }: { projectId: string, projectName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (!confirm(`Opravdu chcete smazat projekt "${projectName}"? Tato akce je nevratná.`)) return

        setIsDeleting(true)
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)

        if (error) {
            alert('Chyba při mazání projektu: ' + error.message)
            setIsDeleting(false)
        } else {
            router.push('/dashboard/projekty')
            router.refresh()
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                router.push(`/dashboard/projekty/${projectId}/upravit`)
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Upravit projekt</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                        >
                            {isDeleting ? (
                                <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            <span>{isDeleting ? 'Mazání...' : 'Smazat projekt'}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
