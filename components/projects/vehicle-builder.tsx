'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, MoveHorizontal, ArrowLeftRight, Settings2 } from 'lucide-react'

export interface BodyItem {
    id: string
    type: string
    description: string
    x: number // Relative position (0-1000)
    width: number // Relative width
    height: number // Relative height
}

export interface VehicleData {
    config: string
    brand: string
    bodies: BodyItem[]
    axlePositions?: number[] // Relative positions (0-1000)
}

const BODY_TYPES = ['Sklápěč', 'Valník', 'Kontejnerový nosič', 'Cisterna', 'Skříňová', 'Domíchávač', 'Jeřáb', 'Hydraulická ruka', 'Jiná']

// Constants for visualization scale
const VIEW_WIDTH = 800
const VIEW_HEIGHT = 300
const CHASSIS_Y = 180
const GROUND_Y = 220
const CAB_X = 50
const SCALE_PIXELS_PER_METER = 80 // Approx visual scale

export default function VehicleBuilder({
    initialData,
    onChange
}: {
    initialData: VehicleData,
    onChange: (data: VehicleData) => void
}) {
    // Merge initial data with defaults if missing positions
    const [data, setData] = useState<VehicleData>(() => {
        // Default axle positions based on config if not provided
        const axles = initialData.axlePositions || getDefaultAxlePositions(initialData.config)
        return { ...initialData, axlePositions: axles }
    })

    // Update parent only when data actually changes (debounced if needed, but simple update here)
    useEffect(() => {
        onChange(data)
    }, [data, onChange])

    // Update axle positions when config changes
    useEffect(() => {
        if (!data.axlePositions || data.axlePositions.length === 0) {
            setData(prev => ({ ...prev, axlePositions: getDefaultAxlePositions(prev.config) }))
        } else {
            // Check if we need to sync axle count with config
            const count = getAxleCount(data.config)
            if (data.axlePositions.length !== count) {
                setData(prev => ({ ...prev, axlePositions: getDefaultAxlePositions(prev.config) }))
            }
        }
    }, [data.config])


    const addBody = () => {
        // Find free space or place at end
        const lastBody = data.bodies[data.bodies.length - 1]
        const startX = lastBody ? lastBody.x + lastBody.width + 10 : 250

        setData(prev => ({
            ...prev,
            bodies: [...prev.bodies, {
                id: crypto.randomUUID(),
                type: 'Valník',
                description: '',
                x: startX,
                width: 300,
                height: 80
            }]
        }))
    }

    const removeBody = (id: string) => {
        setData(prev => ({
            ...prev,
            bodies: prev.bodies.filter(b => b.id !== id)
        }))
    }

    const updateBody = (id: string, field: keyof BodyItem, value: any) => {
        setData(prev => ({
            ...prev,
            bodies: prev.bodies.map(b => b.id === id ? { ...b, [field]: value } : b)
        }))
    }

    // Drag & Drop Logic
    const svgRef = useRef<SVGSVGElement>(null)
    const [dragging, setDragging] = useState<{
        type: 'axle' | 'body-move' | 'body-resize',
        id: string | number,
        startX: number,
        initialVal: number
    } | null>(null)

    const handleSvgMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !svgRef.current) return

        const svgRect = svgRef.current.getBoundingClientRect()
        const scaleX = VIEW_WIDTH / svgRect.width
        const deltaX = (e.clientX - dragging.startX) * scaleX

        if (dragging.type === 'axle') {
            const index = dragging.id as number
            const newPos = Math.max(50, Math.min(750, dragging.initialVal + deltaX)) // Constraints

            const newAxles = [...(data.axlePositions || [])]
            newAxles[index] = newPos
            setData(prev => ({ ...prev, axlePositions: newAxles }))
        }
        else if (dragging.type === 'body-move') {
            const id = dragging.id as string
            const newPos = dragging.initialVal + deltaX
            updateBody(id, 'x', newPos)
        }
        else if (dragging.type === 'body-resize') {
            const id = dragging.id as string
            const newWidth = Math.max(50, dragging.initialVal + deltaX)
            updateBody(id, 'width', newWidth)
        }
    }

    const handleSvgMouseUp = () => {
        setDragging(null)
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Konfigurace podvozku</label>
                    <div className="relative">
                        <select
                            value={data.config}
                            onChange={(e) => setData(prev => ({ ...prev, config: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pl-11"
                        >
                            <option value="" className="text-gray-900">Vyberte konfig...</option>
                            {['4x2', '4x4', '6x2', '6x4', '6x6', '8x4', '8x6', '8x8'].map(opt => (
                                <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                            ))}
                        </select>
                        <Settings2 className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
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

            {/* Interactive Diagram */}
            <div className="border border-white/10 rounded-xl bg-gradient-to-b from-[#1a1f2e] to-[#0f1219] p-2 relative overflow-hidden shadow-inner group select-none">
                <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400/50 flex flex-col pointer-events-none">
                    <span>INTERACTIVE SCHEMATIC_VIEW</span>
                    <span className="text-[10px] text-gray-500">DRAG AXLES TO ADJUST WHEELBASE</span>
                    <span className="text-[10px] text-gray-500">DRAG BODIES TO MOVE / RESIZE</span>
                </div>

                <svg
                    ref={svgRef}
                    width="100%"
                    height="350"
                    viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                    className="max-w-4xl mx-auto cursor-default"
                    onMouseMove={handleSvgMouseMove}
                    onMouseUp={handleSvgMouseUp}
                    onMouseLeave={handleSvgMouseUp}
                >
                    <defs>
                        <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4a5568" />
                            <stop offset="50%" stopColor="#2d3748" />
                            <stop offset="100%" stopColor="#1a202c" />
                        </linearGradient>
                        <linearGradient id="cabGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3182ce" />
                            <stop offset="100%" stopColor="#2c5282" />
                        </linearGradient>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.05" />
                        </pattern>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                            <feOffset dx="2" dy="2" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.5" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Ground */}
                    <path d={`M 20 ${GROUND_Y + 24} L ${VIEW_WIDTH - 20} ${GROUND_Y + 24}`} stroke="#4a5568" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />

                    {/* Chassis Rail */}
                    <g filter="url(#shadow)">
                        <rect
                            x={CAB_X + 20}
                            y={CHASSIS_Y}
                            width={VIEW_WIDTH - 120}
                            height="18"
                            rx="2"
                            fill="url(#chassisGrad)"
                            stroke="#4a5568"
                            strokeWidth="1"
                        />
                        {/* Chassis details */}
                        <path d={`M ${CAB_X + 20} ${CHASSIS_Y + 9} L ${VIEW_WIDTH - 50} ${CHASSIS_Y + 9}`} stroke="black" strokeWidth="1" opacity="0.3" />
                    </g>

                    {/* Cabin (More detailed) */}
                    <g filter="url(#shadow)" transform={`translate(${CAB_X}, ${CHASSIS_Y - 90})`}>
                        {/* Main shape */}
                        <path
                            d="M 0 90 L 0 20 Q 0 0 20 0 L 80 0 Q 90 0 95 10 L 100 90 L 80 110 L 20 110 Z"
                            fill="url(#cabGrad)"
                            stroke="#2b6cb0"
                            strokeWidth="2"
                        />
                        {/* Windows */}
                        <path d="M 5 35 L 5 15 Q 5 10 15 10 L 35 10 L 35 35 Z" fill="#ebf8ff" stroke="#bee3f8" strokeWidth="1" opacity="0.8" />
                        <path d="M 40 35 L 40 10 L 75 10 L 80 35 Z" fill="#ebf8ff" stroke="#bee3f8" strokeWidth="1" opacity="0.8" />

                        {/* Grill & Lights */}
                        <rect x="5" y="60" width="90" height="20" rx="2" fill="#1a202c" opacity="0.4" />
                        <rect x="5" y="85" width="20" height="10" rx="2" fill="#ecc94b" /> {/* Headlight */}
                        <rect x="75" y="85" width="20" height="10" rx="2" fill="#ecc94b" />

                        {/* Door outline */}
                        <path d="M 38 10 L 38 90 L 85 90 L 85 35 L 40 35" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3" />
                        {/* Handle */}
                        <rect x="42" y="60" width="8" height="2" fill="black" opacity="0.5" />
                    </g>
                    {/* Brand Label */}
                    <text x={CAB_X + 50} y={CHASSIS_Y - 40} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" opacity="0.9" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{data.brand}</text>


                    {/* Axles & Wheels */}
                    {data.axlePositions?.map((x, i) => (
                        <g
                            key={`axle-${i}`}
                            style={{ cursor: 'ew-resize' }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                setDragging({ type: 'axle', id: i, startX: e.clientX, initialVal: x })
                            }}
                        >
                            {/* Visual Axle connection to chassis */}
                            <line x1={x} y1={CHASSIS_Y + 10} x2={x} y2={GROUND_Y} stroke="#2d3748" strokeWidth="8" />

                            {/* Wheel group */}
                            <g transform={`translate(${x}, ${GROUND_Y})`}>
                                {/* Tire */}
                                <circle r="26" fill="#1a202c" stroke="#171923" strokeWidth="2" />
                                {/* Rim */}
                                <circle r="16" fill="#cbd5e0" stroke="#718096" strokeWidth="1" />
                                {/* Hub */}
                                <circle r="6" fill="#4a5568" />
                                {/* Bolts */}
                                {Array.from({ length: 6 }).map((_, bi) => {
                                    const angle = (bi * 60) * Math.PI / 180
                                    return <circle key={bi} cx={Math.cos(angle) * 10} cy={Math.sin(angle) * 10} r="1.5" fill="#2d3748" />
                                })}
                            </g>

                            {/* Drag Handle Indicator */}
                            <g className="opacity-0 hover:opacity-100 transition-opacity">
                                <circle cx={x} cy={GROUND_Y} r="30" fill="white" opacity="0.1" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                                <text x={x} y={GROUND_Y + 45} textAnchor="middle" fill="white" fontSize="9" className="pointer-events-none">POSUVNÁ NÁPRAVA</text>
                            </g>
                        </g>
                    ))}

                    {/* Bodies Visualization */}
                    {data.bodies.map((body, i) => {
                        const isSelected = dragging?.type.startsWith('body') && dragging.id === body.id

                        return (
                            <g key={body.id} transform={`translate(${body.x}, ${CHASSIS_Y - body.height})`}>
                                {/* Main Body Shape */}
                                <rect
                                    width={body.width}
                                    height={body.height}
                                    fill={getBodyColor(body.type)}
                                    stroke="white"
                                    strokeWidth={isSelected ? 2 : 0}
                                    strokeOpacity="0.5"
                                    opacity="0.9"
                                    filter="url(#shadow)"
                                    style={{ cursor: 'move' }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setDragging({ type: 'body-move', id: body.id, startX: e.clientX, initialVal: body.x })
                                    }}
                                />

                                {/* Detail Graphics based on Type */}
                                <BodyGraphics type={body.type} width={body.width} height={body.height} />

                                {/* Resize Handle (Right edge) */}
                                <rect
                                    x={body.width - 10}
                                    y={0}
                                    width={20}
                                    height={body.height}
                                    fill="white"
                                    opacity={0}
                                    className="hover:opacity-20 cursor-ew-resize"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setDragging({ type: 'body-resize', id: body.id, startX: e.clientX, initialVal: body.width })
                                    }}
                                />

                                {/* Dimension Label */}
                                <g transform={`translate(${body.width / 2}, -10)`}>
                                    <rect x="-30" y="-12" width="60" height="14" rx="2" fill="black" opacity="0.7" />
                                    <text textAnchor="middle" fill="white" fontSize="10" dy="-1">{Math.round(body.width * 10)} mm</text>
                                </g>

                                <text x={body.width / 2} y={body.height / 2} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" style={{ textShadow: '0 1px 2px black' }} pointerEvents="none">
                                    {body.type.toUpperCase()}
                                </text>
                            </g>
                        )
                    })}

                    {/* Dimensions / Koty */}
                    <g>
                        {/* Wheelbase dimensions */}
                        {data.axlePositions && data.axlePositions.length > 1 && (
                            (() => {
                                const p1 = data.axlePositions[0]
                                const p2 = data.axlePositions[1]
                                // Draw simple line below
                                const dimY = GROUND_Y + 50
                                return (
                                    <g>
                                        <line x1={p1} y1={dimY} x2={p2} y2={dimY} stroke="#718096" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                                        <text x={(p1 + p2) / 2} y={dimY - 5} textAnchor="middle" fill="#a0aec0" fontSize="10">{Math.round((p2 - p1) * 10)} mm</text>
                                        <line x1={p1} y1={GROUND_Y + 30} x2={p1} y2={dimY + 5} stroke="#718096" strokeWidth="0.5" strokeDasharray="2 2" />
                                        <line x1={p2} y1={GROUND_Y + 30} x2={p2} y2={dimY + 5} stroke="#718096" strokeWidth="0.5" strokeDasharray="2 2" />
                                    </g>
                                )
                            })()
                        )}
                    </g>
                </svg>
            </div>

            {/* List of Bodies */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-200">Seznam nástaveb</label>
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
                    <div key={body.id} className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/10 items-start group hover:border-purple-500/30 transition-colors">
                        <div className="p-2 bg-black/20 rounded flex items-center justify-center h-full">
                            <MoveHorizontal className="w-4 h-4 text-gray-500" />
                        </div>
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
                        <div className="flex flex-col space-y-2">
                            <button
                                type="button"
                                onClick={() => removeBody(body.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Helpers

function getAxleCount(config: string) {
    if (!config) return 2
    return config.startsWith('4') ? 2 : config.startsWith('6') ? 3 : config.startsWith('8') ? 4 : 2
}

function getDefaultAxlePositions(config: string) {
    // Front axle at 100
    const count = getAxleCount(config)
    const positions = [100]

    if (count === 2) {
        positions.push(450)
    } else if (count === 3) {
        positions.push(400)
        positions.push(480)
    } else if (count === 4) {
        positions.push(180) // 2nd Front
        positions.push(450)
        positions.push(530)
    }
    return positions
}

function getBodyColor(type: string) {
    if (type.includes('Sklápěč')) return '#48bb78' // Green
    if (type.includes('Cisterna')) return '#cbd5e0' // Silver
    if (type.includes('Jeřáb') || type.includes('ruka')) return '#ed8936' // Orange
    if (type.includes('Kontejner')) return '#ecc94b' // Yellow
    if (type.includes('Skříňová')) return '#4299e1' // Blue
    return '#a0aec0' // Gray default
}

function BodyGraphics({ type, width, height }: { type: string, width: number, height: number }) {
    if (type.includes('Sklápěč')) {
        return (
            <path d={`M 0 0 L ${width} 0 L ${width - 10} ${height} L 5 ${height} Z`} fill="white" fillOpacity="0.2" />
        )
    }
    if (type.includes('Cisterna')) {
        return (
            <rect x="0" y="0" width={width} height={height} rx={height / 2} fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1" />
        )
    }
    if (type.includes('Jeřáb') || type.includes('ruka')) {
        return (
            <g>
                <path d={`M ${width / 2} ${height} L ${width / 2} 10 L ${width} 0`} stroke="white" strokeWidth="4" fill="none" opacity="0.5" />
                <circle cx={width / 2} cy={height - 10} r="5" fill="white" opacity="0.5" />
            </g>
        )
    }
    // Cross bracing for others
    return (
        <path d={`M 0 0 L ${width} ${height} M ${width} 0 L 0 ${height}`} stroke="white" strokeWidth="1" opacity="0.1" />
    )
}
