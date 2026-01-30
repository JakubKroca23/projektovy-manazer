'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AccessoriesForm, { AccessoryItem } from '@/components/projects/accessories-form'
import VehicleBuilder, { VehicleData } from '@/components/projects/vehicle-builder'

export default function NovyProjektPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'planning',
        op_crm: '',
        project_manager: '',
        sector: '',
        customer: '',
        billing_company: '',
        delivery_address: '',
        quantity: '',
        expected_start_date: '',
        deadline: '',
        required_action: '',
        note: '',
        assembly_company: '',
        op_opv_sro: '',
        op_group_zakaznik: '',
        ov_group_sro: '',
        zakazka_sro: ''
    })

    // Vehicle Spec State from Builder
    const [vehicleSpec, setVehicleSpec] = useState<VehicleData>({
        config: '',
        brand: '',
        bodies: [],
        axlePositions: [],
        chassisLength: 800
    })

    const [accessories, setAccessories] = useState<AccessoryItem[]>([])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Construct axle data object
        const axleData = {
            positions: vehicleSpec.axlePositions,
            chassisLength: vehicleSpec.chassisLength
        }

        const extraFields = {
            op_crm: formData.op_crm,
            project_manager: formData.project_manager,
            sector: formData.sector,
            customer: formData.customer,
            billing_company: formData.billing_company,
            delivery_address: formData.delivery_address,
            quantity: formData.quantity,
            expected_start_date: formData.expected_start_date,
            deadline: formData.deadline,
            required_action: formData.required_action,
            note: formData.note,
            assembly_company: formData.assembly_company,
            op_opv_sro: formData.op_opv_sro,
            op_group_zakaznik: formData.op_group_zakaznik,
            ov_group_sro: formData.ov_group_sro,
            zakazka_sro: formData.zakazka_sro,

            // Vehicle Spec
            vehicle_config: vehicleSpec.config,
            vehicle_brand: vehicleSpec.brand,
            bodies: vehicleSpec.bodies,
            axlePositions: axleData, // Store object as JSONB

            // Accessories
            accessories: accessories
        }

        const { error } = await supabase.rpc('create_new_project', {
            p_name: formData.name,
            p_description: formData.description,
            p_status: formData.status,
            p_extra_fields: extraFields
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard/projekty')
            router.refresh()
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <Link href="/dashboard/projekty" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na přehled
                </Link>
                <h1 className="text-3xl font-bold text-white">Nový projekt</h1>
                <p className="text-gray-400 mt-2">Vytvořte novou zakázku a nakonfigurujte vozidlo</p>
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
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Např. Tatra Phoenix 6x6 Sklápěč" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Popis zakázky</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Detaily zakázky..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">OP-CRM</label>
                            <input type="text" name="op_crm" value={formData.op_crm} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Sektor</label>
                            <select name="sector" value={formData.sector} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                <option value="" className="text-gray-900">Vyberte sektor...</option>
                                <option value="Civil" className="text-gray-900">Civil</option>
                                <option value="Army" className="text-gray-900">Army</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Specifikace vozidla (Builder) */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Konfigurátor vozidla</h3>
                    <div className="py-2">
                        <VehicleBuilder
                            initialData={{
                                config: '',
                                brand: '',
                                bodies: [],
                                chassisLength: 800
                            }}
                            onChange={setVehicleSpec}
                        />
                    </div>

                    <div className="pt-4">
                        <label className="block text-base font-medium text-white mb-4">Podrobný popis příslušenství</label>
                        <div className="bg-black/30 rounded-lg p-1 overflow-hidden border border-white/10">
                            <AccessoriesForm onChange={setAccessories} />
                        </div>
                    </div>
                </div>

                {/* Klient a Logistika */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Klient a Logistika</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Zákazník</label>
                            <input type="text" name="customer" value={formData.customer} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Fakturační firma</label>
                            <input type="text" name="billing_company" value={formData.billing_company} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Dodací adresa</label>
                            <input type="text" name="delivery_address" value={formData.delivery_address} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Montážní firma</label>
                            <input type="text" name="assembly_company" value={formData.assembly_company} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Vedoucí projektu</label>
                            <select name="project_manager" value={formData.project_manager} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                <option value="" className="text-gray-900">Vyberte vedoucího...</option>
                                <option value="Ing. Jan Novák" className="text-gray-900">Ing. Jan Novák</option>
                                <option value="Petr Svoboda" className="text-gray-900">Petr Svoboda</option>
                                <option value="Ing. Marie Černá" className="text-gray-900">Ing. Marie Černá</option>
                                <option value="David Procházka" className="text-gray-900">David Procházka</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Termíny a Stav */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Termíny a Stav</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Předpoklad zahájení</label>
                            <input type="date" name="expected_start_date" value={formData.expected_start_date} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Konečný termín</label>
                            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Aktuální stav</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="planning">Plánování</option>
                                <option value="active">Aktivní</option>
                                <option value="completed">Dokončeno</option>
                                <option value="archived">Archivováno</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">Počet kusů</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Požadovaná akce</label>
                            <input type="text" name="required_action" value={formData.required_action} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 border-yellow-500/30 text-yellow-200" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-200 mb-2">Poznámka</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Interní kódy */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Interní kódy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">OP_OPV_SRO</label>
                            <input type="text" name="op_opv_sro" value={formData.op_opv_sro} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">OP_GROUP_ZAKAZNIK</label>
                            <input type="text" name="op_group_zakaznik" value={formData.op_group_zakaznik} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">OV_GROUP_SRO</label>
                            <input type="text" name="ov_group_sro" value={formData.ov_group_sro} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">ZAKAZKA_SRO</label>
                            <input type="text" name="zakazka_sro" value={formData.zakazka_sro} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4 pt-4 border-t border-white/10">
                    <button type="submit" disabled={loading} className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Vytvořit projekt' : 'Vytvořit projekt'}
                    </button>
                    <Link href="/dashboard/projekty" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg transition-all">
                        Zrušit
                    </Link>
                </div>
            </form>
        </div>
    )
}
