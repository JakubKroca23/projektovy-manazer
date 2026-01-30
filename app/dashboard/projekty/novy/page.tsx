'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import AccessoriesForm, { AccessoryItem } from '@/components/projects/accessories-form'

export default function NovyProjektPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('planning')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [accessories, setAccessories] = useState<AccessoryItem[]>([])
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
        // Helper to get value or null
        const getVal = (key: string) => {
            const val = formData.get(key)
            return val && val.toString().trim() !== '' ? val : null
        }

        // Construct the extra fields object from formData
        const extraFields = {
            op_crm: getVal('op_crm'),
            sector: getVal('sector'),
            customer: getVal('customer'),
            billing_company: getVal('billing_company'),
            delivery_address: getVal('delivery_address'),
            quantity: getVal('quantity'),
            expected_start_date: getVal('expected_start_date'),
            deadline: getVal('deadline'),
            // completion_percentage: getVal('completion_percentage'),
            required_action: getVal('required_action'),
            note: getVal('note'),
            assembly_company: getVal('assembly_company'),
            job_description: description,
            project_manager: getVal('project_manager'),
            op_opv_sro: getVal('op_opv_sro'),
            op_group_zakaznik: getVal('op_group_zakaznik'),
            ov_group_sro: getVal('ov_group_sro'),
            zakazka_sro: getVal('zakazka_sro'),
            vehicle_config: getVal('vehicle_config'),
            vehicle_brand: getVal('vehicle_brand'),
            body_type: getVal('body_type'),
            crane_type: getVal('crane_type'),
            outriggers_type: getVal('outriggers_type'),
            pump_type: getVal('pump_type'),
        }

        // Use RPC call to bypass RLS issues
        const { data: result, error: projectError } = await supabase
            .rpc('create_new_project', {
                p_name: name,
                p_description: description,
                p_status: status,
                p_extra_fields: { ...extraFields, accessories: accessories } // Pass object directly
            })

        if (projectError) {
            setError(projectError.message)
            setLoading(false)
            return
        }

        // RPC returns an object with ID
        console.log('RPC Result:', result)
        const projectId = (result as any)?.id

        if (!projectId) {
            setError('Nepodařilo se získat ID nového projektu. Zkuste to znovu.')
            setLoading(false)
            return
        }

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
                                <select name="sector" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                    <option value="" className="text-gray-900">Vyberte sektor...</option>
                                    <option value="Civil" className="text-gray-900">Civil</option>
                                    <option value="Army" className="text-gray-900">Army</option>
                                </select>
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
                                <select name="project_manager" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                    <option value="" className="text-gray-900">Vyberte vedoucího...</option>
                                    <option value="Ing. Jan Novák" className="text-gray-900">Ing. Jan Novák</option>
                                    <option value="Petr Svoboda" className="text-gray-900">Petr Svoboda</option>
                                    <option value="Ing. Marie Černá" className="text-gray-900">Ing. Marie Černá</option>
                                    <option value="David Procházka" className="text-gray-900">David Procházka</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Specifikace vozidla */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Specifikace vozidla</h3>
                        {/* ... existing vehicle fields ... */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Konfigurace podvozku</label>
                                <select name="vehicle_config" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                    <option value="" className="text-gray-900">Vyberte konfig...</option>
                                    {['4x2', '4x4', '6x2', '6x4', '6x6', '8x4', '8x6', '8x8'].map(opt => (
                                        <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Značka vozidla</label>
                                <select name="vehicle_brand" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                    <option value="" className="text-gray-900">Vyberte značku...</option>
                                    {['Tatra', 'Mercedes-Benz', 'Volvo', 'Scania', 'MAN', 'DAF', 'Iveco', 'Renault'].map(opt => (
                                        <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Typ nástavby</label>
                                <select name="body_type" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                    <option value="" className="text-gray-900">Vyberte typ...</option>
                                    {['Sklápěč', 'Valník', 'Kontejnerový nosič', 'Cisterna', 'Skříňová', 'Domíchávač', 'Jeřáb', 'Jiná'].map(opt => (
                                        <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Typ jeřábu</label>
                                <input type="text" name="crane_type" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Např. Fassi F110" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Typ podpěr</label>
                                <input type="text" name="outriggers_type" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Např. Přední hydraulické" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">Čerpadlo</label>
                                <input type="text" name="pump_type" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Typ hydraulického čerpadla" />
                            </div>
                        </div>

                        {/* Accessories Table */}
                        <div className="pt-4">
                            <label className="block text-base font-medium text-white mb-4">Podrobný popis příslušenství (dle specifikace)</label>
                            <div className="bg-black/30 rounded-lg p-1 overflow-hidden border border-white/10">
                                <AccessoriesForm onChange={setAccessories} />
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
