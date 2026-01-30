'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Truck } from 'lucide-react'

export interface BodyItem {
    id: string
    type: string
    description: string
}

export interface VehicleData {
    config: string
    brand: string
    bodies: BodyItem[]
}

const BODY_TYPES = ['Sklápěč', 'Valník', 'Kontejnerový nosič', 'Cisterna', 'Skříňová', 'Domíchávač', 'Jeřáb', 'Hydraulická ruka', 'Jiná']

export default function VehicleBuilder({
    initialData,
    onChange
}: {
    initialData: VehicleData,
    onChange: (data: VehicleData) => void
}) {
    const [data, setData] = useState<VehicleData>(initialData)

    useEffect(() => {
        onChange(data)
    }, [data, onChange])

    const addBody = () => {
        setData(prev => ({
            ...prev,
            bodies: [...prev.bodies, { id: crypto.randomUUID(), type: 'Valník', description: '' }]
        }))
    }

    const removeBody = (id: string) => {
        setData(prev => ({
            ...prev,
            bodies: prev.bodies.filter(b => b.id !== id)
        }))
    }

    const updateBody = (id: string, field: keyof BodyItem, value: string) => {
        setData(prev => ({
            ...prev,
            bodies: prev.bodies.map(b => b.id === id ? { ...b, [field]: value } : b)
        }))
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Konfigurace podvozku</label>
                    <select
                        value={data.config}
                        onChange={(e) => setData(prev => ({ ...prev, config: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
                        <option value="" className="text-gray-900">Vyberte konfig...</option>
                        {['4x2', '4x4', '6x2', '6x4', '6x6', '8x4', '8x6', '8x8'].map(opt => (
                            <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Značka vozidla</label>
                    <select
                        value={data.brand}
                        onChange={(e) => setData(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
                        <option value="" className="text-gray-900">Vyberte značku...</option>
                        {['Tatra', 'Mercedes-Benz', 'Volvo', 'Scania', 'MAN', 'DAF', 'Iveco', 'Renault'].map(opt => (
                            <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Nástavby */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-200">Nástavby a vybavení</label>
                    <button
                        type="button"
                        onClick={addBody}
                        className="flex items-center space-x-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Přidat nástavbu</span>
                    </button>
                </div>

                {data.bodies.length === 0 && (
                    <div className="text-center p-4 border border-dashed border-white/10 rounded-lg text-gray-500 text-sm">
                        Žádné nástavby. Klikněte na tlačítko pro přidání.
                    </div>
                )}

                {data.bodies.map((body, index) => (
                    <div key={body.id} className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/10 items-start group">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Typ</label>
                                <select
                                    value={body.type}
                                    onChange={(e) => updateBody(body.id, 'type', e.target.value)}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                    {BODY_TYPES.map(t => <option key={t} value={t} className="text-gray-900">{t}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Specifikace / Model</label>
                                <input
                                    type="text"
                                    value={body.description}
                                    onChange={(e) => updateBody(body.id, 'description', e.target.value)}
                                    placeholder="Např. model, nosnost, objem..."
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeBody(body.id)}
                            className="mt-6 p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Diagram */}
            <div className="border border-white/10 rounded-xl bg-[#1a1f2e] p-6 relative overflow-hidden">
                <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400/50">VEHICLE SCHEMATIC_VIEW_01</div>
                <div className="flex justify-center items-center py-8">
                    <VehicleDiagram config={data.config} bodies={data.bodies} brand={data.brand} />
                </div>
            </div>
        </div>
    )
}

function VehicleDiagram({ config, bodies, brand }: { config: string, bodies: BodyItem[], brand: string }) {
    // Config parsing
    // 4x2 = 2 axles usually
    // 6x.. = 3 axles
    // 8x.. = 4 axles
    const axles = config.startsWith('4') ? 2 : config.startsWith('6') ? 3 : config.startsWith('8') ? 4 : 2

    // Scale and positioning
    const width = 600
    const height = 200
    const groundY = 160
    const chassisY = 120
    const wheelRadius = 24

    // Axle positions
    const getAxlePositions = (count: number) => {
        const positions = []
        // Front axle always around x=100
        positions.push(100)

        if (count === 2) {
            positions.push(450) // Rear
        } else if (count === 3) {
            positions.push(400) // Rear 1
            positions.push(480) // Rear 2
        } else if (count === 4) {
            positions.push(180) // Front 2
            positions.push(400) // Rear 1
            positions.push(480) // Rear 2
        }
        return positions
    }

    const axlePositions = getAxlePositions(axles)

    return (
        <svg width="100%" height="250" viewBox={`0 0 ${width} ${height}`} className="max-w-2xl">
            <defs>
                <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4a5568" />
                    <stop offset="100%" stopColor="#2d3748" />
                </linearGradient>
                <linearGradient id="cabGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
            </defs>

            {/* Ground */}
            <line x1="20" y1={groundY + wheelRadius} x2={width - 20} y2={groundY + wheelRadius} stroke="#4a5568" strokeWidth="2" strokeDasharray="10 5" opacity="0.5" />

            {/* Chassis */}
            <rect
                x="60"
                y={chassisY}
                width={width - 100}
                height="15"
                rx="2"
                fill="url(#chassisGrad)"
                stroke="#718096"
                strokeWidth="1"
            />

            {/* Cabin */}
            <path
                d={`M 50 ${chassisY} L 50 60 Q 50 40 70 40 L 130 40 L 130 ${chassisY} Z`}
                fill="url(#cabGrad)"
                stroke="#a3bffa"
                strokeWidth="2"
            />
            {/* Window */}
            <path d="M 60 70 L 60 55 Q 60 50 70 50 L 120 50 L 120 70 Z" fill="#ebf8ff" opacity="0.3" />
            {/* Brand Label */}
            <text x="90" y="100" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" opacity="0.8">{brand}</text>


            {/* Wheels */}
            {axlePositions.map((x, i) => (
                <g key={i}>
                    <circle cx={x} cy={groundY} r={wheelRadius} fill="#1a202c" stroke="#4a5568" strokeWidth="4" />
                    <circle cx={x} cy={groundY} r={wheelRadius - 10} fill="#2d3748" />
                    <circle cx={x} cy={groundY} r={4} fill="#718096" />
                </g>
            ))}

            {/* Bodies Visualization */}
            {bodies.map((body, i) => {
                // Simple logic to stack or place bodies
                // Crane usually behind cab
                // Tipper/Box at rear

                const isCrane = body.type.toLowerCase().includes('jeřáb') || body.type.toLowerCase().includes('ruka') || body.type.toLowerCase().includes('crane')

                let renderBody = null

                if (isCrane) {
                    renderBody = (
                        <g transform={`translate(150, ${chassisY})`}>
                            {/* Crane Base */}
                            <rect x="0" y="-30" width="30" height="30" fill="#f6ad55" stroke="#dd6b20" />
                            {/* Crane Arm */}
                            <path d="M 15 -30 L 15 -80 L 80 -60" fill="none" stroke="#f6ad55" strokeWidth="6" strokeLinecap="round" />
                            <circle cx="15" cy="-30" r="5" fill="#4a5568" />
                            <circle cx="15" cy="-80" r="4" fill="#4a5568" />
                        </g>
                    )
                } else if (body.type.includes('Sklápěč')) {
                    renderBody = (
                        <g transform={`translate(190, ${chassisY})`}>
                            <path d="M 0 -10 L 300 -10 L 290 -60 L 10 -60 Z" fill="#48bb78" stroke="#2f855a" opacity="0.8" />
                            <text x="150" y="-35" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">SKLÁPĚČ</text>
                        </g>
                    )
                } else if (body.type.includes('Cisterna')) {
                    renderBody = (
                        <g transform={`translate(190, ${chassisY})`}>
                            <rect x="0" y="-60" width="300" height="50" rx="20" fill="#cbd5e0" stroke="#718096" />
                            <text x="150" y="-30" textAnchor="middle" fill="#2d3748" fontSize="12" fontWeight="bold">NAFTA/VODA</text>
                        </g>
                    )
                } else {
                    // Default Box / Valník
                    renderBody = (
                        <g transform={`translate(190, ${chassisY})`}>
                            <rect x="0" y="-60" width="300" height="50" fill="#4299e1" stroke="#2b6cb0" opacity="0.8" />
                            <text x="150" y="-30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{body.type.toUpperCase()}</text>
                        </g>
                    )
                }

                return <g key={i}>{renderBody}</g>
            })}
        </svg>
    )
}
