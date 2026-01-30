'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AccessoriesForm, { AccessoryItem } from '@/components/projects/accessories-form'
import VehicleBuilder, { VehicleData } from '@/components/projects/vehicle-builder'

export default function NovyProjektPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('planning')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [accessories, setAccessories] = useState<AccessoryItem[]>([])
    const [vehicleSpec, setVehicleSpec] = useState<VehicleData>({
        config: '',
        brand: '',
        bodies: []
    })

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
            // vehicle inputs removed from formData, take from state
            vehicle_config: vehicleSpec.config,
            vehicle_brand: vehicleSpec.brand,
            bodies: vehicleSpec.bodies, // Pass array directly
            // Optional: map first body to legacy column if needed
            body_type: vehicleSpec.bodies.length > 0 ? vehicleSpec.bodies[0].type : null,
            accessories: accessories // Pass object directly
        }

        // Use RPC call to bypass RLS issues
        const { data: result, error: projectError } = await supabase
            .rpc('create_new_project', {
                p_name: name,
                p_description: description,
                p_status: status,
                p_extra_fields: { ...extraFields, accessories: accessories, bodies: vehicleSpec.bodies } // Ensure bodies is passed
            })

        if (projectError) {
            setError(projectError.message)
            setLoading(false)
        } else {
            // Check if result has ID (it returns json {id: ...})
            const newProjectId = (result as { id: string }).id
            if (newProjectId) {
                router.push(`/dashboard/projekty/${newProjectId}`)
                router.refresh()
            } else {
                setError('Nepodařilo se získat ID nového projektu')
                setLoading(false)
            }
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Vytváření projektu...</div>
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <Link href="/dashboard/projekty" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na seznam
                </Link>
                <h1 className="text-3xl font-bold text-white">Nový projekt</h1>
                <p className="text-gray-400 mt-2">Vytvořte novou zakázku vyplněním formuláře níže</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6">
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
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Např. Zakázka MB Arocs" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Popis zakázky</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Stručný popis..." />
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

                {/* Klient a Logistika */}
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
                    <div className="py-2">
                        <VehicleBuilder
                            initialData={vehicleSpec}
                            onChange={setVehicleSpec}
                        />
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
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Počet kusů</label>
                            <input type="number" name="quantity" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Požadovaná akce</label>
                            <input type="text" name="required_action" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 border-yellow-500/30 text-yellow-200" placeholder="Co je třeba udělat..." />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Poznámka</label>
                            <textarea name="note" rows={2} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
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
                        {loading ? 'Vytváření...' : 'Vytvořit projekt'}
                    </button>
                    <Link href="/dashboard/projekty" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg transition-all">
                        Zrušit
                    </Link>
                </div>
            </form>
        </div>
    )
}
