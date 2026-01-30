'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, MoveHorizontal, Settings2, ArrowRightFromLine, ArrowUpToLine, Shield } from 'lucide-react'

export interface BodyItem {
    id: string
    type: string
    description: string
    x: number // Relative position (0-1000)
    width: number // Relative width
    height: number // Relative height
    extensions?: number // Pro hydraulickou ruku (1-8)
}

export interface VehicleData {
    config: string
    brand: string
    bodies: BodyItem[]
    axlePositions?: number[] // Relative positions
    chassisLength?: number // Celková délka rámu
}

const BODY_TYPES = ['Sklápěč', 'Valník', 'Kontejnerový nosič', 'Cisterna', 'Skříňová', 'Domíchávač', 'Jeřáb', 'Hydraulická ruka', 'Odtahovka']

// Constants for visualization scale
const VIEW_WIDTH = 900
const VIEW_HEIGHT = 400
const CHASSIS_Y = 250
const GROUND_Y = 290
const CAB_X = 50

export default function VehicleBuilder({
    initialData,
    onChange
}: {
    initialData: VehicleData,
    onChange: (data: VehicleData) => void
}) {
    // State initialization
    const [data, setData] = useState<VehicleData>(() => {
        const axles = initialData.axlePositions && initialData.axlePositions.length > 0
            ? initialData.axlePositions
            : getDefaultAxlePositions(initialData.config)

        return {
            ...initialData,
            axlePositions: axles,
            chassisLength: initialData.chassisLength || 800 // Default chassis length
        }
    })

    // Propagate changes
    useEffect(() => {
        onChange(data)
    }, [data, onChange])

    // Sync axle count with config
    useEffect(() => {
        if (!data.axlePositions) return

        const needed = getAxleCount(data.config)
        if (data.axlePositions.length !== needed) {
            const defaults = getDefaultAxlePositions(data.config)
            // Try to keep chassis length reasonable
            setData(prev => ({ ...prev, axlePositions: defaults }))
        }
    }, [data.config])


    const addBody = () => {
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
                height: 80,
                extensions: 1
            }]
        }))
    }

    const removeBody = (id: string) => {
        setData(prev => ({ ...prev, bodies: prev.bodies.filter(b => b.id !== id) }))
    }

    const updateBody = (id: string, field: keyof BodyItem, value: any) => {
        setData(prev => ({
            ...prev,
            bodies: prev.bodies.map(b => b.id === id ? { ...b, [field]: value } : b)
        }))
    }

    // Drag & Drop State
    const svgRef = useRef<SVGSVGElement>(null)
    const [dragging, setDragging] = useState<{
        type: 'axle' | 'body-move' | 'body-resize-w' | 'body-resize-h' | 'chassis-resize',
        id: string | number,
        startX: number,
        mouseY?: number,
        initialVal: number, // X or Width or Length
        initialYVal?: number // For Height
    } | null>(null)

    const handleSvgMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !svgRef.current || !data.axlePositions) return

        const svgRect = svgRef.current.getBoundingClientRect()
        const scaleX = VIEW_WIDTH / svgRect.width
        const scaleY = VIEW_HEIGHT / svgRect.height
        const deltaX = (e.clientX - dragging.startX) * scaleX
        const deltaY = dragging.mouseY ? (e.clientY - dragging.mouseY) * scaleY : 0

        if (dragging.type === 'axle') {
            const index = dragging.id as number
            // Logic: Move rear bogie together
            const isRear = index >= (data.config.startsWith('8') ? 2 : 1) // 8xX has 2 front axles logic simplified

            const newAxles = [...data.axlePositions]
            const currentPos = newAxles[index]
            let newPos = dragging.initialVal + deltaX

            // Constraints
            newPos = Math.max(100, Math.min(data.chassisLength! - 40, newPos))

            const moveDelta = newPos - currentPos

            if (isRear) {
                // Move all rear axles by same delta
                const frontCount = data.config.startsWith('8') ? 2 : 1
                for (let i = frontCount; i < newAxles.length; i++) {
                    newAxles[i] += moveDelta
                }
            } else {
                newAxles[index] = newPos
            }

            setData(prev => ({ ...prev, axlePositions: newAxles }))
        }
        else if (dragging.type === 'chassis-resize') {
            const newLen = Math.max((data.axlePositions[data.axlePositions.length - 1] || 0) + 50, dragging.initialVal + deltaX)
            setData(prev => ({ ...prev, chassisLength: newLen }))
        }
        else if (dragging.type === 'body-move') {
            const id = dragging.id as string
            const newPos = dragging.initialVal + deltaX
            updateBody(id, 'x', newPos)
        }
        else if (dragging.type === 'body-resize-w') {
            const id = dragging.id as string
            const newWidth = Math.max(30, dragging.initialVal + deltaX)
            updateBody(id, 'width', newWidth)
        }
        else if (dragging.type === 'body-resize-h') {
            const id = dragging.id as string
            // Dragging UP means negative deltaY, increasing height
            const newHeight = Math.max(30, (dragging.initialYVal || 100) - deltaY)
            updateBody(id, 'height', newHeight)
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
                    <select
                        value={data.config}
                        onChange={(e) => setData(prev => ({ ...prev, config: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    >
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

            {/* Interactive Diagram */}
            <div className="border border-white/10 rounded-xl bg-[#13161c] p-2 relative overflow-hidden shadow-2xl group select-none">
                <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400/50 flex flex-col pointer-events-none z-10">
                    <span>ADVANCED VEHICLE CONFIGURATOR</span>
                    <span className="text-[10px] text-gray-500 mt-1">AXLES: Move Rear Group together</span>
                    <span className="text-[10px] text-gray-500">BODIES: Drag Edge to Resize W/H</span>
                </div>

                <svg
                    ref={svgRef}
                    width="100%"
                    height="400"
                    viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                    className="max-w-5xl mx-auto cursor-default"
                    onMouseMove={handleSvgMouseMove}
                    onMouseUp={handleSvgMouseUp}
                    onMouseLeave={handleSvgMouseUp}
                >
                    <defs>
                        <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2d3748" />
                            <stop offset="50%" stopColor="#1a202c" />
                            <stop offset="100%" stopColor="#000" />
                        </linearGradient>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.03" />
                        </pattern>
                        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="1" dy="2" result="offsetblur" />
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
                    <path d={`M 0 ${GROUND_Y + 28} L ${VIEW_WIDTH} ${GROUND_Y + 28}`} stroke="#2d3748" strokeWidth="1" />

                    {/* Chassis Rail */}
                    <g filter="url(#dropShadow)">
                        {/* Main Rail */}
                        <path
                            d={`M ${CAB_X + 20} ${CHASSIS_Y} L ${data.chassisLength} ${CHASSIS_Y} L ${data.chassisLength} ${CHASSIS_Y + 20} L ${CAB_X + 25} ${CHASSIS_Y + 20} Z`}
                            fill="url(#chassisGrad)"
                            stroke="#4a5568"
                            strokeWidth="1"
                        />
                        {/* Rear Overhang Handle */}
                        <g
                            transform={`translate(${data.chassisLength}, ${CHASSIS_Y + 10})`}
                            style={{ cursor: 'ew-resize' }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                setDragging({ type: 'chassis-resize', id: 'chassis', startX: e.clientX, initialVal: data.chassisLength || 800 })
                            }}
                        >
                            <circle r="8" fill="red" opacity="0.5" className="hover:opacity-100 transition-opacity" />
                            <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="white" strokeWidth="1.5" />
                        </g>
                        {/* Overhang Dimension */}
                        {data.axlePositions && data.axlePositions.length > 0 && (
                            <text x={data.chassisLength! + 10} y={CHASSIS_Y} fill="gray" fontSize="10" className="pointer-events-none">
                                Převis: {Math.round((data.chassisLength! - data.axlePositions[data.axlePositions.length - 1]) / SCALE_PIXELS_PER_METER * 1000)} mm
                            </text>
                        )}
                    </g>

                    {/* Cabin */}
                    <CabinVisual brand={data.brand} x={CAB_X} y={CHASSIS_Y} />

                    {/* Axles */}
                    {data.axlePositions?.map((x, i) => (
                        <g
                            key={`axle-${i}`}
                            style={{ cursor: 'ew-resize' }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                setDragging({ type: 'axle', id: i, startX: e.clientX, initialVal: x })
                            }}
                        >
                            <line x1={x} y1={CHASSIS_Y + 15} x2={x} y2={GROUND_Y} stroke="#1a202c" strokeWidth="12" />
                            <g transform={`translate(${x}, ${GROUND_Y})`}>
                                <circle r="28" fill="#171923" stroke="#000" strokeWidth="2" />
                                <circle r="18" fill="#a0aec0" stroke="#718096" strokeWidth="1" /> {/* Rim */}
                                <circle r="5" fill="#2d3748" /> {/* Hub */}
                                {/* Wheel Details */}
                                {Array.from({ length: 8 }).map((_, bi) => (
                                    <circle key={bi} cx={Math.cos(bi * Math.PI / 4) * 12} cy={Math.sin(bi * Math.PI / 4) * 12} r="1.5" fill="#4a5568" />
                                ))}
                            </g>
                        </g>
                    ))}

                    {/* Bodies */}
                    {data.bodies.map((body) => {
                        const isSelected = dragging?.type.startsWith('body') && dragging.id === body.id
                        return (
                            <g key={body.id} transform={`translate(${body.x}, ${CHASSIS_Y})`}>
                                {/* Render wrapper moving UP by height */}
                                <g transform={`translate(0, -${body.height})`}>

                                    {/* Body Visuals */}
                                    <BodyVisuals type={body.type} width={body.width} height={body.height} extensions={body.extensions} />

                                    {/* Move Handler (Center) */}
                                    <rect
                                        x="0" y="0" width={body.width} height={body.height}
                                        fill="transparent"
                                        style={{ cursor: 'move' }}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            setDragging({ type: 'body-move', id: body.id, startX: e.clientX, initialVal: body.x })
                                        }}
                                    />

                                    {/* Resize Width Handle (Right) */}
                                    <rect
                                        x={body.width - 10} y="0" width={15} height={body.height}
                                        fill="white" opacity="0" className="hover:opacity-20 cursor-ew-resize"
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setDragging({ type: 'body-resize-w', id: body.id, startX: e.clientX, initialVal: body.width })
                                        }}
                                    />
                                    {/* Resize Height Handle (Top) */}
                                    <rect
                                        x="0" y="-5" width={body.width} height={10}
                                        fill="white" opacity="0" className="hover:opacity-20 cursor-ns-resize"
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setDragging({
                                                type: 'body-resize-h',
                                                id: body.id,
                                                startX: e.clientX,
                                                mouseY: e.clientY,
                                                initialVal: body.width, // unused
                                                initialYVal: body.height
                                            })
                                        }}
                                    />

                                    {/* Labels */}
                                    <text x={body.width / 2} y={body.height / 2} textAnchor="middle" fill="white" fontWeight="bold" opacity="0.8" pointerEvents="none" style={{ textShadow: '0 1px 2px black' }}>
                                        {body.type.toUpperCase()}
                                    </text>
                                    {/* Dimensions */}
                                    <text x={body.width / 2} y="-15" textAnchor="middle" fill="#718096" fontSize="10">{Math.round(body.width / SCALE_PIXELS_PER_METER * 1000)} mm</text>
                                    <text x="-15" y={body.height / 2} textAnchor="middle" fill="#718096" fontSize="10" transform={`rotate(-90, -15, ${body.height / 2})`}>{Math.round(body.height / SCALE_PIXELS_PER_METER * 1000)} mm</text>
                                </g>
                            </g>
                        )
                    })}

                    {/* Wheelbase Dimensions */}
                    {data.axlePositions && data.axlePositions.length > 1 && (
                        <WheelbaseDimension axles={data.axlePositions} />
                    )}

                </svg>
            </div>

            {/* List and Config */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-lg font-semibold text-white">Konfigurace nástaveb</h3>
                    <button onClick={addBody} className="flex items-center space-x-2 text-sm bg-purple-600 px-3 py-1.5 rounded hover:bg-purple-500 transition-colors text-white">
                        <Plus className="w-4 h-4" />
                        <span>Přidat komponentu</span>
                    </button>
                </div>

                {data.bodies.map(body => (
                    <div key={body.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Typ nástavby</label>
                                <select
                                    value={body.type}
                                    onChange={(e) => updateBody(body.id, 'type', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                >
                                    {BODY_TYPES.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Popis / Model</label>
                                <input
                                    value={body.description}
                                    onChange={(e) => updateBody(body.id, 'description', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                    placeholder="Specifikace..."
                                />
                            </div>

                            {/* Specific Controls */}
                            {body.type === 'Hydraulická ruka' && (
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Počet výsuvů (1-8)</label>
                                    <input
                                        type="number" min="1" max="8"
                                        value={body.extensions || 1}
                                        onChange={(e) => updateBody(body.id, 'extensions', parseInt(e.target.value))}
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                    />
                                </div>
                            )}

                            <div className="flex items-center space-x-2 md:col-span-3 pt-2">
                                <span className="text-xs text-gray-500">Pozice: {Math.round(body.x)} | Délka: {Math.round(body.width)} | Výška: {Math.round(body.height)}</span>
                            </div>
                        </div>
                        <button onClick={() => removeBody(body.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Visual Components ---

const SCALE_PIXELS_PER_METER = 80

function CabinVisual({ brand, x, y }: { brand: string, x: number, y: number }) {
    // Tatra (Phoenix/Force - typically cabover but distinct)
    if (brand === 'Tatra') {
        return (
            <g transform={`translate(${x}, ${y - 110})`} filter="url(#dropShadow)">
                <path d="M 0 110 L 0 20 L 10 5 L 80 5 L 90 20 L 90 90 L 80 110 Z" fill="#b91c1c" stroke="white" strokeWidth="1" /> {/* Tatra Redish */}
                <path d="M 5 35 L 5 20 L 30 20 L 30 50 L 5 35" fill="#333" opacity="0.8" />
                <rect x="5" y="70" width="80" height="20" rx="2" fill="black" opacity="0.6" />
                <text x="45" y="60" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">TATRA</text>
            </g>
        )
    }
    // Mercedes / Actros
    if (brand === 'Mercedes-Benz') {
        return (
            <g transform={`translate(${x}, ${y - 120})`} filter="url(#dropShadow)">
                <path d="M 0 120 L 0 10 L 85 10 L 90 30 L 90 100 L 85 120 Z" fill="#cbd5e0" stroke="#718096" strokeWidth="1" />
                {/* Grill Lines */}
                <line x1="10" y1="80" x2="80" y2="80" stroke="black" strokeWidth="2" opacity="0.3" />
                <line x1="12" y1="90" x2="78" y2="90" stroke="black" strokeWidth="2" opacity="0.3" />
                <line x1="15" y1="100" x2="75" y2="100" stroke="black" strokeWidth="2" opacity="0.3" />
                {/* Windows */}
                <path d="M 5 40 L 5 20 L 40 20 L 40 45 Z" fill="#1a202c" opacity="0.7" />
                <path d="M 45 45 L 45 20 L 80 20 L 85 45 Z" fill="#1a202c" opacity="0.7" />
            </g>
        )
    }
    // Volvo (Slash)
    if (brand === 'Volvo') {
        return (
            <g transform={`translate(${x}, ${y - 115})`} filter="url(#dropShadow)">
                <path d="M 0 115 L 0 10 L 85 10 L 95 40 L 95 100 L 85 115 Z" fill="#2b6cb0" stroke="#4299e1" strokeWidth="1" />
                {/* Slash */}
                <line x1="10" y1="100" x2="80" y2="60" stroke="#ecc94b" strokeWidth="3" />
                <circle cx="45" cy="80" r="6" fill="#ecc94b" />
                {/* Windows */}
                <path d="M 5 40 L 5 20 L 80 20 L 90 45 L 5 45" fill="#1a202c" opacity="0.6" />
            </g>
        )
    }
    // Default Box
    return (
        <g transform={`translate(${x}, ${y - 100})`} filter="url(#dropShadow)">
            <path d="M 0 100 L 0 10 Q 0 0 10 0 L 80 0 Q 90 0 90 10 L 90 100 Z" fill="#4a5568" stroke="white" strokeWidth="1" />
            <rect x="5" y="10" width="80" height="30" rx="2" fill="#1a202c" opacity="0.6" />
            <text x="45" y="70" textAnchor="middle" fill="white" fontSize="9" opacity="0.5">{brand || 'CAB'}</text>
        </g>
    )
}

function BodyVisuals({ type, width, height, extensions = 1 }: { type: string, width: number, height: number, extensions?: number }) {
    // Shared Shadow Filter applied to parent

    if (type === 'Valník') {
        return (
            <g>
                <rect width={width} height={height} fill="#a0aec0" fillOpacity="0.3" stroke="white" strokeWidth="2" />
                {/* Sides */}
                <rect x="0" y={height - 20} width={width} height="20" fill="#4a5568" />
                <line x1="0" y1={height - 20} x2={width} y2={height - 20} stroke="white" strokeWidth="1" />
                {/* Posts */}
                <rect x="0" y="0" width="5" height={height} fill="#2d3748" />
                <rect x={width / 2} y="0" width="5" height={height} fill="#2d3748" />
                <rect x={width - 5} y="0" width="5" height={height} fill="#2d3748" />
            </g>
        )
    }

    if (type === 'Sklápěč') {
        return (
            <g>
                <path d={`M 0 0 L ${width} 0 L ${width - 10} ${height} L 10 ${height} Z`} fill="#48bb78" fillOpacity="0.6" stroke="white" strokeWidth="1" />
                {/* Ribs */}
                <line x1={width / 3} y1="0" x2={width / 3 + 5} y2={height} stroke="white" strokeOpacity="0.3" />
                <line x1={width * 2 / 3} y1="0" x2={width * 2 / 3 - 5} y2={height} stroke="white" strokeOpacity="0.3" />
                {/* Piston Hint */}
                <line x1={width / 2} y1={height} x2={width / 2 - 20} y2={height + 20} stroke="#2d3748" strokeWidth="4" />
            </g>
        )
    }

    if (type === 'Hydraulická ruka') {
        return (
            <g>
                {/* Base */}
                <rect x={width / 2 - 20} y={height - 20} width="40" height="20" fill="#ed8936" stroke="white" />
                {/* Legs (Outriggers) visual */}
                <path d={`M ${width / 2 - 25} ${height} L ${width / 2 - 35} ${height + 30}`} stroke="#ed8936" strokeWidth="4" />
                <path d={`M ${width / 2 + 25} ${height} L ${width / 2 + 35} ${height + 30}`} stroke="#ed8936" strokeWidth="4" />

                {/* Main Column */}
                <rect x={width / 2 - 10} y={height - 80} width="20" height="60" fill="#ed8936" rx="2" />

                {/* Booms / Extensions */}
                {Array.from({ length: extensions }).map((_, i) => {
                    const segmentLen = Math.min(40, (width - 40) / extensions)
                    const startX = width / 2
                    const startY = height - 80
                    // Zig zag folding visual
                    return (
                        <g key={i} transform={`translate(${startX}, ${startY}) rotate(${-110 + (i * 15)})`}>
                            <rect x="0" y="-8" width={segmentLen + (i * 10)} height="16" rx="2" fill="#dd6b20" stroke="white" strokeWidth="1" />
                            <circle cx="0" cy="0" r="3" fill="white" />
                        </g>
                    )
                })}
            </g>
        )
    }

    if (type === 'Cisterna') {
        return (
            <g>
                <rect x="0" y="10" width={width} height={height - 20} rx={(height - 20) / 2} fill="#cbd5e0" stroke="white" strokeWidth="2" />
                {/* Bands */}
                <rect x={width * 0.2} y="10" width="10" height={height - 20} fill="#a0aec0" opacity="0.5" />
                <rect x={width * 0.5} y="10" width="10" height={height - 20} fill="#a0aec0" opacity="0.5" />
                <rect x={width * 0.8} y="10" width="10" height={height - 20} fill="#a0aec0" opacity="0.5" />
                {/* Top Hatch */}
                <rect x={width * 0.5 - 15} y="0" width="30" height="10" fill="#718096" />
            </g>
        )
    }

    // Default Box / Skříň
    return (
        <g>
            <rect width={width} height={height} fill="#4299e1" fillOpacity="0.4" stroke="white" strokeWidth="1" />
            <path d={`M 0 0 L ${width} ${height}`} stroke="white" strokeOpacity="0.2" />
            <path d={`M ${width} 0 L 0 ${height}`} stroke="white" strokeOpacity="0.2" />
            <rect x="0" y="0" width={width} height={height} fill="url(#grid)" opacity="0.2" />
        </g>
    )
}

function WheelbaseDimension({ axles }: { axles: number[] }) {
    if (axles.length < 2) return null
    // Assuming axles are sorted
    const first = axles[0]
    const second = axles[1] // Wheelbase is usually 1st to 2nd axle

    const y = GROUND_Y + 40

    return (
        <g>
            <line x1={first} y1={y} x2={second} y2={y} stroke="#718096" strokeWidth="1" />
            <line x1={first} y1={GROUND_Y + 10} x2={first} y2={y + 5} stroke="#718096" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1={second} y1={GROUND_Y + 10} x2={second} y2={y + 5} stroke="#718096" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={(first + second) / 2} y={y - 5} textAnchor="middle" fill="#a0aec0" fontSize="10">{Math.round((second - first) / SCALE_PIXELS_PER_METER * 1000)} mm</text>
        </g>
    )
}

function getDefaultAxlePositions(config: string) {
    // Simple defaults
    const is8 = config.startsWith('8')
    const is6 = config.startsWith('6')

    if (is8) return [100, 200, 500, 600]
    if (is6) return [100, 450, 550]
    return [100, 450]
}

function getAxleCount(config: string) {
    return config.startsWith('8') ? 4 : config.startsWith('6') ? 3 : 2
}
