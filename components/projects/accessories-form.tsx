'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export interface AccessoryItem {
    id: string
    category: string // PŘÍSLUŠENSTVÍ (column 1)
    description: string
    supplier: string // KDO DODÁVÁ
    assembler: string // KDO MONTUJE
    note: string
}

const DEFAULT_ITEMS: AccessoryItem[] = [
    { id: '1', category: 'BLATNÍKY', description: '', supplier: 'MB', assembler: 'MB', note: '' },
    { id: '2', category: 'ZÁSTĚRKY DO BLATNÍKŮ', description: '', supplier: 'MB', assembler: 'MB', note: '' },
    { id: '3', category: 'BOČNÍ PODJEZDOVÉ ZÁBRANY', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '4', category: 'ZADNÍ PODJEZDOVÁ ZÁBRANA', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '5', category: 'DRŽÁK REZERVY', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '6', category: 'ČERPADLO', description: '', supplier: 'HIAB', assembler: 'HIAB', note: 'SAP 84' },
    { id: '7', category: 'SKŘÍNĚ NA NÁŘADÍ', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '8', category: 'NÁDOBA NA VODU', description: '', supplier: 'NE', assembler: 'NE', note: 'nebude' },
    { id: '9', category: 'MEZIRÁM', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '10', category: 'NÁDRŽ', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '11', category: 'UŽIVATELSKÉ ZÁSUVKY', description: 'Body connector X227, sales code E4D', supplier: 'MB', assembler: 'MB', note: '' },
    { id: '12', category: 'ÚPRAVA RÁMU PODVOZKU', description: '', supplier: 'Tischer', assembler: 'Tischer', note: 'posunutí nádrže kvůli prostoru pro opěry' },
    { id: '13', category: 'KAMERY', description: '', supplier: 'MB', assembler: 'MB', note: 'Couvací z výroby' },
    { id: '14', category: 'PRACOVNÍ SVĚTLA', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '15', category: 'MAJÁK', description: '', supplier: 'Tischer', assembler: 'Tischer', note: '' },
    { id: '16', category: 'START/STOP OTÁČKY', description: '', supplier: 'Contsystem', assembler: 'Contsystem', note: 'nastavení, oživení' },
]

export default function AccessoriesForm({
    initialData,
    onChange
}: {
    initialData?: AccessoryItem[],
    onChange: (data: AccessoryItem[]) => void
}) {
    const [items, setItems] = useState<AccessoryItem[]>(initialData && initialData.length > 0 ? initialData : DEFAULT_ITEMS)

    // Sync changes to parent
    useEffect(() => {
        onChange(items)
    }, [items, onChange]) // Be careful with infinite loop here if onChange is not stable.
    // Actually, calling onChange inside useEffect which depends on items is correct for 1-way flow, but if parent re-renders and passes different initialData...
    // Let's just rely on local state and call onChange. The parent should not update initialData frequently.

    const handleChange = (id: string, field: keyof AccessoryItem, value: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const addNewRow = () => {
        const newItem: AccessoryItem = {
            id: crypto.randomUUID(),
            category: '',
            description: '',
            supplier: 'Tischer',
            assembler: 'Tischer',
            note: ''
        }
        setItems(prev => [...prev, newItem])
    }

    const removeRow = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }

    return (
        <div className="space-y-4 overflow-x-auto">
            <div className="min-w-[800px]">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-white/10 text-gray-200 border-b border-white/20">
                            <th className="p-3 border-r border-white/10 w-1/4">PŘÍSLUŠENSTVÍ</th>
                            <th className="p-3 border-r border-white/10 w-1/4">POPIS</th>
                            <th className="p-3 border-r border-white/10 w-1/8">KDO DODÁVÁ</th>
                            <th className="p-3 border-r border-white/10 w-1/8">KDO MONTUJE</th>
                            <th className="p-3 border-white/10 w-1/4">POZNÁMKA</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02]">
                                <td className="p-2 border-r border-white/10">
                                    <input
                                        type="text"
                                        value={item.category}
                                        onChange={(e) => handleChange(item.id, 'category', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-white font-medium placeholder-gray-600"
                                        placeholder="Název..."
                                    />
                                </td>
                                <td className="p-2 border-r border-white/10">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-300"
                                    />
                                </td>
                                <td className="p-2 border-r border-white/10">
                                    <input
                                        type="text"
                                        value={item.supplier}
                                        onChange={(e) => handleChange(item.id, 'supplier', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-300 text-center"
                                    />
                                </td>
                                <td className="p-2 border-r border-white/10">
                                    <input
                                        type="text"
                                        value={item.assembler}
                                        onChange={(e) => handleChange(item.id, 'assembler', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-300 text-center"
                                    />
                                </td>
                                <td className="p-2 border-r border-white/10">
                                    <input
                                        type="text"
                                        value={item.note}
                                        onChange={(e) => handleChange(item.id, 'note', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-300"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    {/* Only allow deleting if it's not one of the core default items OR allow checked deletion? Let's allow all for flexibility */}
                                    <button
                                        type="button"
                                        onClick={() => removeRow(item.id)}
                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={addNewRow}
                        className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Přidat řádek</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
