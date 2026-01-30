'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, File as FileIcon, Download, Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

interface ProjectFilesProps {
    projectId: string
    readOnly?: boolean
}

export default function ProjectFiles({ projectId, readOnly = false }: ProjectFilesProps) {
    const [files, setFiles] = useState<any[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadFiles()
    }, [projectId])

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [notification])

    async function loadFiles() {
        try {
            const { data, error } = await supabase
                .storage
                .from('project-files')
                .list(projectId + '/', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                })

            if (error) {
                if (error.message.includes('bucket not found')) {
                    console.error('Bucket "project-files" not found.')
                } else {
                    console.error('Error loading files:', error.message)
                }
                return
            }

            setFiles(data || [])
        } catch (error) {
            console.error('Error loading files:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)
        setNotification(null)

        try {
            const timestamp = new Date().getTime()
            const reliableName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(`${projectId}/${reliableName}`, file)

            if (uploadError) {
                throw uploadError
            }

            setNotification({ type: 'success', message: 'Soubor byl úspěšně nahrán' })
            loadFiles()
        } catch (error: any) {
            setNotification({ type: 'error', message: 'Chyba: ' + error.message })
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function handleDelete(fileName: string) {
        if (!confirm('Opravdu smazat tento soubor?')) return

        try {
            const { error } = await supabase.storage
                .from('project-files')
                .remove([`${projectId}/${fileName}`])

            if (error) throw error

            setNotification({ type: 'success', message: 'Soubor byl smazán' })
            setFiles(files.filter(f => f.name !== fileName))
        } catch (error: any) {
            setNotification({ type: 'error', message: 'Chyba při mazání: ' + error.message })
        }
    }

    async function handleDownload(fileName: string) {
        try {
            const { data, error } = await supabase.storage
                .from('project-files')
                .createSignedUrl(`${projectId}/${fileName}`, 3600)

            if (error) throw error

            window.open(data.signedUrl, '_blank')
        } catch (error: any) {
            setNotification({ type: 'error', message: 'Chyba při stahování: ' + error.message })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center">
                    <FileIcon className="w-5 h-5 mr-2 text-blue-400" />
                    Soubory projektu
                </h3>
                {!readOnly && (
                    <label className={`
                        flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 
                        border border-blue-500/20 hover:border-blue-500/40 text-blue-400 rounded-lg 
                        cursor-pointer transition-all text-sm
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span>{uploading ? 'Nahrávám...' : 'Nahrát soubor'}</span>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            {/* Notification Banner */}
            {notification && (
                <div className={`
                    p-3 rounded-lg flex items-center text-sm animate-fade-in
                    ${notification.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}
                `}>
                    {notification.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                    {notification.message}
                </div>
            )}

            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden min-h-[100px]">
                {loading ? (
                    <div className="flex items-center justify-center h-24 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Načítám soubory...
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500 text-sm">
                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                        <p>Zatím žádné soubory</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center border border-white/5">
                                        <FileIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-200 truncate font-medium">{file.name.substring(file.name.indexOf('_') + 1)}</p>
                                        <p className="text-xs text-gray-500 flex items-center space-x-2">
                                            <span>{(file.metadata?.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <span>•</span>
                                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDownload(file.name)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                        title="Stáhnout"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    {!readOnly && (
                                        <button
                                            onClick={() => handleDelete(file.name)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                            title="Smazat"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
