'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TaskActions({ taskId, taskTitle }: { taskId: string, taskTitle: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (!confirm(`Opravdu chcete smazat úkol "${taskTitle}"?`)) return

        setIsDeleting(true)
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) {
            alert('Chyba při mazání úkolu: ' + error.message)
            setIsDeleting(false)
        } else {
            setIsOpen(false)
            router.refresh()
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Možnosti"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-40 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                alert('Editace zatím není implementována')
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                        >
                            <Edit className="w-3 h-3" />
                            <span>Upravit</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                        >
                            {isDeleting ? (
                                <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="w-3 h-3" />
                            )}
                            <span>Smazat</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
