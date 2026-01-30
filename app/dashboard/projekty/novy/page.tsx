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

        // Create FormData from the event target to get all input values easily
        const formData = new FormData(e.target as HTMLFormElement)

        // Construct the extra fields object from formData
        const extraFields = {
            op_crm: formData.get('op_crm'),
            sector: formData.get('sector'),
            customer: formData.get('customer'),
            billing_company: formData.get('billing_company'),
            delivery_address: formData.get('delivery_address'),
            quantity: formData.get('quantity'),
            expected_start_date: formData.get('expected_start_date'),
            deadline: formData.get('deadline'),
            // completion_percentage: formData.get('completion_percentage'), // Manual entry if needed
            required_action: formData.get('required_action'),
            note: formData.get('note'),
            assembly_company: formData.get('assembly_company'),
            job_description: description, // Mapping job_description to description field or separate if needed (DB has both now, we can use description for main text)
            project_manager: formData.get('project_manager'),
            op_opv_sro: formData.get('op_opv_sro'),
            op_group_zakaznik: formData.get('op_group_zakaznik'),
            ov_group_sro: formData.get('ov_group_sro'),
            zakazka_sro: formData.get('zakazka_sro'),
        }

        // Use RPC call to bypass RLS issues
        const { data: result, error: projectError } = await supabase
            .rpc('create_new_project', {
                p_name: name,
                p_description: description,
                p_status: status,
                p_extra_fields: extraFields
            })

        if (projectError) {
            setError(projectError.message)
            setLoading(false)
            return
        }

        // RPC returns an object with ID
        const projectId = (result as any).id

        router.push(`/dashboard/projekty/${projectId}`)
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

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Základní informace */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Základní informace</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-200 mb-2">Název projektu *</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Např. Zakázka A123" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-200 mb-2">Popis zakázky</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Detailní popis..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">OP-CRM</label>
                                <input type="text" name="op_crm" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Sektor</label>
                                <input type="text" name="sector" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Klient a Adresy */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Klient a Logistika</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Zákazník</label>
                                <input type="text" name="customer" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Fakturační firma</label>
                                <input type="text" name="billing_company" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-200 mb-2">Dodací adresa</label>
                                <input type="text" name="delivery_address" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Montážní firma</label>
                                <input type="text" name="assembly_company" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Vedoucí projektu</label>
                                <input type="text" name="project_manager" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Termíny a Stav */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Termíny a Stav</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Předpoklad zahájení</label>
                                <input type="date" name="expected_start_date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Konečný termín</label>
                                <input type="date" name="deadline" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Aktuální stav</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="planning">Plánování</option>
                                    <option value="active">Aktivní</option>
                                    <option value="completed">Dokončeno</option>
                                    <option value="archived">Archivováno</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Počet kusů</label>
                                <input type="number" name="quantity" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Interní kódy */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Interní kódy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">OP_OPV_SRO</label>
                                <input type="text" name="op_opv_sro" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">OP_GROUP_ZAKAZNIK</label>
                                <input type="text" name="op_group_zakaznik" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">OV_GROUP_SRO</label>
                                <input type="text" name="ov_group_sro" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">ZAKAZKA_SRO</label>
                                <input type="text" name="zakazka_sro" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-4 border-t border-white/10">
                        <button type="submit" disabled={loading} className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Vytváření...' : 'Vytvořit zakázku'}
                        </button>
                        <Link href="/dashboard/projekty" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg transition-all">
                            Zrušit
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
