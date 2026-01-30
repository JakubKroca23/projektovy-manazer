'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Move, Ruler, Scale, Truck, Layers, Download, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react'

// --- TYPES ---
export interface BodyItem {
    id: string
    type: string
    description: string
    x: number // Vzdálenost od přední nápravy (nebo začátku rámu?) -> Zde od "Zero Point" (přední náprava 1)
    width: number // Délka
    height: number // Výška
    weight: number // Hmotnost v kg
    extensions?: number // Pro hydraulickou ruku
}

export interface VehicleData {
    config: string // např. 4x2, 6x4...
    brand: string
    bodies: BodyItem[]
    axlePositions: number[] // Pozice náprav od Zero Point (0 = 1. náprava)
    chassisLength: number // Celková délka rámu od Zero Point
    frontOverhang: number // Převis před 1. nápravou (pro vizuál kabiny)
    rearOverhang: number // (Vypočteno: chassisLength - lastAxle)
}

const BODY_TYPES = ['Valník', 'Sklápěč', 'Kontejner', 'Skříň', 'Cisterna', 'Hydraulická ruka', 'Jeřáb', 'Mix', 'Odtah']

// --- CONSTANTS ---
const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 500
const ZERO_X = 150 // X coordinate of the first axle (Zero Point)
const PIXELS_PER_METER = 100 // Scale: 100px = 1m
const GROUND_Y = 350
const CHASSIS_Y = 310 // Frame top height (approx 1m from ground visually, adjustable)

export default function VehicleBuilder({
    initialData,
    onChange
}: {
    initialData: any,
    onChange: (data: any) => void
}) {
    // --- STATE ---
    const [data, setData] = useState<VehicleData>(() => {
        // Initialize from props or defaults
        const config = initialData.config || '4x2'
        const defaultAxles = getDefaultAxleOffsetsMM(config) // relative to Zero Point 0

        let axles = initialData.axlePositions // expect positions relative to frame start or handled? 
        // Let's standardize: axlePositions coming in props might be legacy (absolute SVG coords).
        // We will convert/sanitize to "Relative to First Axle 0" model if needed, but for simplicity let's stick to "Relative to SVG Origin" logic but adapted.
        // Actually, best for engineering is specific offsets.

        // RE-MAPPING LEGACY DATA to NEW "CAD" MODEL
        // If incoming data is legacy (absolute coords ~100+), we use them relative to ZeroX.
        // If new, we keep.

        let normalizedAxles = []
        if (Array.isArray(axles) && axles.length > 0) {
            // Heuristic: if first axle > 50, it is absolute svg coord.
            if (axles[0] > 50) {
                const offset = axles[0]
                normalizedAxles = axles.map((a: number) => a - offset) // Normalize to 0
            } else {
                normalizedAxles = axles
            }
        } else {
            normalizedAxles = defaultAxles
        }

        // Fix axle count if config changed outside
        if (getAxleCount(config) !== normalizedAxles.length) {
            normalizedAxles = defaultAxles
        }

        // Chassis Length Logic
        let cLen = initialData.chassisLength || 7000 // mm
        // Convert to pixels for internal logic? No, let's work in MM internally for "Profi" feel?
        // Too complex for React rendering without heavy scale logic.
        // Let's stick to PIXELS for storage but show MM in UI. 
        // Actually, let's use MILLIMETERS in State for precision!

        // RESTART: STATE WILL BE IN MILLIMETERS (MM)
        const mmAxles = normalizedAxles.map((a: number) => a * 10) // assuming previous was ~100px=1m approx -> now mm.
        // Wait, legacy data was "SVG Coords".
        // Let's reset to defaults for "Profi" mode to ensure integrity, or try to parse.
        // To be safe, let's use defaults if it looks weird.

        const defaultMM = getDefaultAxleOffsetsMM(config)

        return {
            config: config,
            brand: initialData.brand || '',
            bodies: (initialData.bodies || []).map((b: any) => ({
                ...b,
                x: b.x * 10 || 0, // Approx conversion if needed
                width: b.width * 10 || 3000,
                height: b.height * 10 || 800,
                weight: b.weight || 0
            })),
            axlePositions: defaultMM, // Store offsets from 1st axle in MM (e.g. 0, 3600, 5000)
            chassisLength: initialData.chassisLength ? (initialData.chassisLength < 2000 ? initialData.chassisLength * 10 : initialData.chassisLength) : 8000, // MM
            frontOverhang: 1400, // MM
            rearOverhang: 0 // Calculated
        }
    })

    // Update parent
    useEffect(() => {
        // Convert back to structure compatible with DB (if needed) or save as is
        // We will save the NEW precise structure.
        onChange(data)
    }, [data, onChange])

    // Sync Config Changes
    useEffect(() => {
        const count = getAxleCount(data.config)
        if (data.axlePositions.length !== count) {
            setData(prev => ({
                ...prev,
                axlePositions: getDefaultAxleOffsetsMM(prev.config)
            }))
        }
    }, [data.config])


    // --- ACTIONS ---
    const addBody = (type: string) => {
        // Find suitable start position (e.g. behind cab)
        const cabEnd = 800 // approx cab depth
        const lastBody = data.bodies[data.bodies.length - 1]
        const startX = lastBody ? lastBody.x + lastBody.width + 100 : cabEnd + 200

        setData(prev => ({
            ...prev,
            bodies: [...prev.bodies, {
                id: crypto.randomUUID(),
                type,
                description: '',
                x: startX,
                width: 3000,
                height: 800,
                weight: 500,
                extensions: 1
            }]
        }))
    }

    const updateBody = (id: string, field: keyof BodyItem, value: any) => {
        setData(prev => ({
            ...prev,
            bodies: prev.bodies.map(b => b.id === id ? { ...b, [field]: value } : b)
        }))
    }

    const removeBody = (id: string) => {
        setData(prev => ({ ...prev, bodies: prev.bodies.filter(b => b.id !== id) }))
    }

    // --- DRAG LOGIC ---
    const svgRef = useRef<SVGSVGElement>(null)
    const [dragging, setDragging] = useState<{
        type: 'axle' | 'body' | 'body-resize' | 'chassis',
        id: string | number,
        startX: number,
        startVal: number
    } | null>(null)

    const mmToPx = (mm: number) => mm / 1000 * PIXELS_PER_METER
    const pxToMm = (px: number) => px / PIXELS_PER_METER * 1000

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !svgRef.current) return

        const rect = svgRef.current.getBoundingClientRect()
        const scale = VIEW_WIDTH / rect.width // SVG Viewbox handling
        const deltaPx = (e.clientX - dragging.startX) * scale
        const deltaMm = pxToMm(deltaPx)

        if (dragging.type === 'axle') {
            const idx = dragging.id as number
            if (idx === 0) return // Lock 1st axle? Or move everything? Let's lock 1st axle as Zero.

            const newAxles = [...data.axlePositions]
            // Move bogie logic
            const isRear = idx >= (data.config.startsWith('8') ? 2 : 1)
            const oldVal = newAxles[idx]
            let newVal = Math.max(0, dragging.startVal + deltaMm)

            const moveDiff = newVal - oldVal

            if (isRear) {
                // Move all subsequent axles
                for (let i = idx; i < newAxles.length; i++) {
                    newAxles[i] += moveDiff
                }
            } else {
                newAxles[idx] = newVal
            }
            setData(prev => ({ ...prev, axlePositions: newAxles }))

        } else if (dragging.type === 'body') {
            const id = dragging.id as string
            const newVal = Math.max(-data.frontOverhang, dragging.startVal + deltaMm)
            updateBody(id, 'x', newVal)

        } else if (dragging.type === 'body-resize') {
            const id = dragging.id as string
            const newVal = Math.max(500, dragging.startVal + deltaMm)
            updateBody(id, 'width', newVal)

        } else if (dragging.type === 'chassis') {
            const newVal = Math.max(data.axlePositions[data.axlePositions.length - 1] + 500, dragging.startVal + deltaMm)
            setData(prev => ({ ...prev, chassisLength: newVal }))
        }
    }

    const handleMouseUp = () => setDragging(null)


    // --- RENDER HELPERS ---
    // Convert MM relative to First Axle -> SVG X Coordinate
    const getX = (mm: number) => ZERO_X + mmToPx(mm)


    return (
        <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col h-auto">

            {/* TOOLBAR */}
            <div className="bg-slate-900 p-2 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-xs font-mono px-2">TRAILERWIN-LIKE CONFIGURATOR v1.0</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <select
                        value={data.config}
                        onChange={(e) => setData(prev => ({ ...prev, config: e.target.value }))}
                        className="bg-slate-800 text-slate-200 text-xs border border-slate-600 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        {['4x2', '4x4', '6x2', '6x4', '6x6', '8x4', '8x8'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select
                        value={data.brand}
                        onChange={(e) => setData(prev => ({ ...prev, brand: e.target.value }))}
                        className="bg-slate-800 text-slate-200 text-xs border border-slate-600 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        {['Tatra', 'Mercedes', 'Volvo', 'Scania', 'MAN', 'DAF', 'Iveco'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Reset View"><RefreshCw className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Download PDF"><Download className="w-4 h-4" /></button>
                </div>
            </div>

            {/* MAIN WORKSPACE - SPLIT VIEW */}
            <div className="flex flex-col lg:flex-row flex-1">

                {/* BLUEPRINT CANVAS */}
                <div className="flex-1 bg-[#0f172a] relative select-none overflow-hidden min-h-[500px]">

                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    ></div>

                    {/* SVG CANVAS */}
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                        className="cursor-crosshair"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* DEFS */}
                        <defs>
                            <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="10" height="10" fill="transparent" />
                                <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="1" opacity="0.1" />
                            </pattern>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#facc15" />
                            </marker>
                            <marker id="arrow-start" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M9,0 L9,6 L0,3 z" fill="#facc15" />
                            </marker>
                        </defs>

                        {/* --- GROUND --- */}
                        <line x1="0" y1={GROUND_Y + 48} x2={VIEW_WIDTH} y2={GROUND_Y + 48} stroke="#475569" strokeWidth="2" />

                        {/* --- CHASSIS --- */}
                        <g>
                            {/* Frame Line */}
                            <path
                                d={`M ${getX(-data.frontOverhang)} ${CHASSIS_Y} L ${getX(data.chassisLength)} ${CHASSIS_Y} L ${getX(data.chassisLength)} ${CHASSIS_Y + 25} L ${getX(-data.frontOverhang)} ${CHASSIS_Y + 25} Z`}
                                fill="#1e293b" stroke="#94a3b8" strokeWidth="2"
                            />
                            {/* Crossmembers (visual) */}
                            {Array.from({ length: Math.floor(data.chassisLength / 1000) }).map((_, i) => (
                                <line key={i} x1={getX(i * 1000)} y1={CHASSIS_Y} x2={getX(i * 1000)} y2={CHASSIS_Y + 25} stroke="#334155" strokeWidth="1" />
                            ))}

                            {/* Chassis Resize Handle */}
                            <g
                                transform={`translate(${getX(data.chassisLength)}, ${CHASSIS_Y + 12.5})`}
                                style={{ cursor: 'ew-resize' }}
                                onMouseDown={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    setDragging({ type: 'chassis', id: 'chassis', startX: e.clientX, startVal: data.chassisLength })
                                }}
                            >
                                <circle r="6" fill="#facc15" stroke="black" />
                                <path d="M-3 0 L3 0 M0 -3 L0 3" stroke="black" strokeWidth="1" />
                            </g>
                        </g>

                        {/* --- AXLES --- */}
                        {data.axlePositions.map((pos, i) => {
                            const x = getX(pos)
                            return (
                                <g key={i} transform={`translate(${x}, ${GROUND_Y})`}
                                    style={{ cursor: i === 0 ? 'default' : 'ew-resize' }}
                                    onMouseDown={(e) => {
                                        if (i === 0) return;
                                        e.preventDefault(); e.stopPropagation();
                                        setDragging({ type: 'axle', id: i, startX: e.clientX, startVal: pos })
                                    }}
                                >
                                    {/* Vertical Centerline */}
                                    <line x1="0" y1="-200" x2="0" y2="50" stroke="#facc15" strokeWidth="1" strokeDasharray="5 2" opacity="0.3" />
                                    {/* Tire */}
                                    <circle r="44" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                                    <circle r="25" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
                                    <circle r="5" fill="#94a3b8" />
                                    {/* Info */}
                                    <text y="60" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">AXLE {i + 1}</text>
                                </g>
                            )
                        })}

                        {/* --- CABIN (Stylized Wireframe) --- */}
                        <g transform={`translate(${getX(-data.frontOverhang)}, ${CHASSIS_Y})`}>
                            {/* Bumper area */}
                            <rect x="0" y="0" width="100" height="30" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                            {/* Main Cab */}
                            <path d="M 0 0 L 0 -130 L 150 -130 L 150 0" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                            {/* Window */}
                            <rect x="10" y="-120" width="80" height="50" fill="url(#hatch)" stroke="#475569" />
                            {/* Wheel Arch */}
                            <path d="M 110 50 Q 150 0 190 50" fill="none" stroke="#cbd5e1" strokeWidth="1" transform="translate(0, -10)" />
                            {/* Brand Text */}
                            <text x="75" y="-60" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontWeight="bold" opacity="0.5">{data.brand?.toUpperCase()}</text>
                        </g>

                        {/* --- BODIES --- */}
                        {data.bodies.map((body, i) => (
                            <g key={body.id} transform={`translate(${getX(body.x)}, ${CHASSIS_Y})`}>
                                <g transform={`translate(0, -${mmToPx(body.height)})`}>
                                    {/* Render Body */}
                                    <rect
                                        width={mmToPx(body.width)}
                                        height={mmToPx(body.height)}
                                        fill={dragging?.id === body.id ? "rgba(59, 130, 246, 0.2)" : "url(#hatch)"}
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        style={{ cursor: 'move' }}
                                        onMouseDown={(e) => {
                                            e.preventDefault(); e.stopPropagation();
                                            setDragging({ type: 'body', id: body.id, startX: e.clientX, startVal: body.x })
                                        }}
                                    />

                                    {/* Graphics by Type */}
                                    {body.type === 'Sklápěč' && <path d={`M 0 0 L ${mmToPx(body.width)} 0 L ${mmToPx(body.width) - 20} ${mmToPx(body.height)} L 5 ${mmToPx(body.height)}`} fill="none" stroke="#3b82f6" strokeWidth="1" />}
                                    {body.type === 'Hydraulická ruka' && (
                                        <g>
                                            <rect x={mmToPx(body.width) / 2 - 10} y={mmToPx(body.height) - 30} width="20" height="30" fill="#f97316" />
                                            <path d={`M ${mmToPx(body.width) / 2} ${mmToPx(body.height) - 30} L ${mmToPx(body.width) / 2} 0`} stroke="#f97316" strokeWidth="4" />
                                        </g>
                                    )}

                                    {/* Resize Handle */}
                                    <rect
                                        x={mmToPx(body.width) - 10} y="0" width="10" height={mmToPx(body.height)}
                                        fill="#facc15" opacity="0.5"
                                        style={{ cursor: 'ew-resize' }}
                                        onMouseDown={(e) => {
                                            e.preventDefault(); e.stopPropagation();
                                            setDragging({ type: 'body-resize', id: body.id, startX: e.clientX, startVal: body.width })
                                        }}
                                    />

                                    {/* Info Label */}
                                    <rect x="0" y="-25" width="80" height="20" rx="2" fill="#0f172a" stroke="#3b82f6" />
                                    <text x="40" y="-12" textAnchor="middle" fill="#e2e8f0" fontSize="10">{body.type}</text>
                                    <text x={mmToPx(body.width) / 2} y={mmToPx(body.height) / 2} textAnchor="middle" fill="#3b82f6" opacity="0.3" fontSize="24" fontWeight="bold">{(body.width / 1000).toFixed(1)}m</text>
                                </g>
                            </g>
                        ))}

                        {/* --- MEASUREMENTS / DIMENSIONS --- */}
                        <g pointerEvents="none">
                            {/* Wheelbases */}
                            {data.axlePositions.map((pos, i) => {
                                if (i === 0) return null
                                const prev = data.axlePositions[i - 1]
                                const cx = getX(prev + (pos - prev) / 2)
                                const y = GROUND_Y + 70

                                return (
                                    <g key={`dim-${i}`}>
                                        <line x1={getX(prev)} y1={y} x2={getX(pos)} y2={y} stroke="#facc15" strokeWidth="1" markerStart="url(#arrow-start)" markerEnd="url(#arrow)" />
                                        <line x1={getX(prev)} y1={GROUND_Y + 50} x2={getX(prev)} y2={y + 5} stroke="#64748b" strokeWidth="1" />
                                        <line x1={getX(pos)} y1={GROUND_Y + 50} x2={getX(pos)} y2={y + 5} stroke="#64748b" strokeWidth="1" />
                                        <rect x={cx - 25} y={y - 8} width="50" height="16" fill="#0f172a" />
                                        <text x={cx} y={y + 3} textAnchor="middle" fill="#facc15" fontSize="11" fontFamily="monospace" fontWeight="bold">{Math.round(pos - prev)}</text>
                                    </g>
                                )
                            })}

                            {/* Total Length  & Overhangs*/}
                            {(() => {
                                const lastAxle = data.axlePositions[data.axlePositions.length - 1]
                                const rearOh = data.chassisLength - lastAxle

                                // Rear Overhang
                                const roX = getX(lastAxle + rearOh / 2)
                                const roY = GROUND_Y + 70
                                return (
                                    <g>
                                        <line x1={getX(lastAxle)} y1={roY} x2={getX(data.chassisLength)} y2={roY} stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow-start)" />
                                        <line x1={getX(data.chassisLength)} y1={CHASSIS_Y} x2={getX(data.chassisLength)} y2={roY} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                                        <rect x={roX - 20} y={roY - 7} width="40" height="14" fill="#0f172a" />
                                        <text x={roX} y={roY + 3} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">ROH {Math.round(rearOh)}</text>
                                    </g>
                                )
                            })()}

                            {/* Body Positions */}
                            {data.bodies.map((b, i) => (
                                <g key={`bdim-${i}`}>
                                    {/* Distance from Front Axle (0) */}
                                    {/*<line x1={getX(0)} y1={CHASSIS_Y - mmToPx(b.height) - 20} x2={getX(b.x)} y2={CHASSIS_Y - mmToPx(b.height) - 20} stroke="cyan" opacity="0.5" />
                                     <text x={getX(b.x/2)} y={CHASSIS_Y - mmToPx(b.height) - 25} fill="cyan" fontSize="10">{Math.round(b.x)}</text>*/}
                                </g>
                            ))}
                        </g>

                        {/* Scale visual */}
                        <g transform="translate(20, 20)">
                            <rect width="100" height="4" fill="white" />
                            <rect width="50" height="4" fill="black" />
                            <text x="0" y="16" fill="white" fontSize="10">0</text>
                            <text x="100" y="16" fill="white" fontSize="10">1m</text>
                        </g>

                    </svg>
                </div>

                {/* SIDEBAR PROPERTIES PANEL */}
                <div className="w-full lg:w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto max-h-[500px]">
                    <h3 className="text-slate-100 font-bold mb-4 flex items-center">
                        <Scale className="w-4 h-4 mr-2" /> Vlastnosti
                    </h3>

                    {/* Add Component List */}
                    <div className="mb-6">
                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Komponenty</div>
                        <div className="grid grid-cols-2 gap-2">
                            {BODY_TYPES.slice(0, 6).map(type => (
                                <button
                                    key={type}
                                    onClick={() => addBody(type)}
                                    className="bg-slate-700 hover:bg-blue-600 text-slate-200 text-xs py-2 px-3 rounded text-left transition-colors flex items-center justify-between"
                                >
                                    <span>{type}</span>
                                    <Plus className="w-3 h-3 opacity-50" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Bodies List with Details */}
                    <div className="space-y-4">
                        {data.bodies.map((body, i) => (
                            <div key={body.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-200 text-sm">{body.type}</span>
                                    <button onClick={() => removeBody(body.id)} className="text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-slate-400">Pozice (mm)</label>
                                        <input
                                            type="number"
                                            value={Math.round(body.x)}
                                            onChange={(e) => updateBody(body.id, 'x', parseInt(e.target.value))}
                                            className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-right text-yellow-400 font-mono"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-slate-400">Délka (mm)</label>
                                        <input
                                            type="number"
                                            value={Math.round(body.width)}
                                            onChange={(e) => updateBody(body.id, 'width', parseInt(e.target.value))}
                                            className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-slate-400">Váha (kg)</label>
                                        <input
                                            type="number"
                                            value={body.weight || 0}
                                            onChange={(e) => updateBody(body.id, 'weight', parseInt(e.target.value))}
                                            className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-right text-green-400 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chassis Stats */}
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Souhrn</div>
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                            <span>Celková délka:</span>
                            <span className="font-mono">{Math.round((data.chassisLength + data.frontOverhang))} mm</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                            <span>Rozvory:</span>
                            <span className="font-mono text-xs">{data.axlePositions.map((p, i) => i > 0 ? (p - data.axlePositions[i - 1]) : null).filter(Boolean).join(' + ')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-300">
                            <span>Váha nástaveb:</span>
                            <span className="font-mono text-green-400">{data.bodies.reduce((a, b) => a + (b.weight || 0), 0)} kg</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

// --- UTILS ---
function getDefaultAxleOffsetsMM(config: string) {
    // Returns axle positions relative to 1st Achse (0) in Millimeters
    if (config.startsWith('8')) return [0, 1990, 5100, 6450] // T158 8x8
    if (config.startsWith('6')) return [0, 3600, 4950] // 6x6 Standard
    return [0, 3800] // 4x4
}

function getAxleCount(config: string) {
    if (config.startsWith('8')) return 4
    if (config.startsWith('6')) return 3
    return 2
}
