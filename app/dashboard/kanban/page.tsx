import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'

const taskStatuses = [
    { id: 'todo', name: 'K řešení', color: 'border-gray-500/50' },
    { id: 'in_progress', name: 'V průběhu', color: 'border-yellow-500/50' },
    { id: 'review', name: 'K revizi', color: 'border-purple-500/50' },
    { id: 'done', name: 'Hotovo', color: 'border-green-500/50' },
]

const priorityColors = {
    low: 'bg-gray-500/20 text-gray-300',
    medium: 'bg-blue-500/20 text-blue-300',
    high: 'bg-orange-500/20 text-orange-300',
    urgent: 'bg-red-500/20 text-red-300',
}

const priorityLabels = {
    low: 'Nízká',
    medium: 'Střední',
    high: 'Vysoká',
    urgent: 'Urgentní',
}

export default async function KanbanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all tasks for user's projects
    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
      *,
      projects(name),
      profiles:assigned_to(full_name)
    `)
        .or(`assigned_to.eq.${user?.id},project_id.in.(select id from projects where created_by = ${user?.id})`)
        .order('created_at', { ascending: false })

    // Group tasks by status
    const tasksByStatus = taskStatuses.reduce((acc, status) => {
        acc[status.id] = (tasks || []).filter(task => task.status === status.id)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Kanban Board</h1>
                <p className="text-gray-400">Vizualizujte a spravujte úkoly v Kanban stylu</p>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {taskStatuses.map((status) => (
                    <div key={status.id} className="flex flex-col">
                        {/* Column Header */}
                        <div className={`backdrop-blur-xl bg-white/5 border ${status.color} rounded-t-xl p-4`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white">{status.name}</h3>
                                <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                                    {tasksByStatus[status.id]?.length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 border-t-0 rounded-b-xl p-4 space-y-3 min-h-[500px]">
                            {tasksByStatus[status.id]?.map((task: any) => (
                                <div
                                    key={task.id}
                                    className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-lg p-4 hover:border-purple-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                >
                                    {/* Task Title */}
                                    <h4 className="font-medium text-white mb-2 group-hover:text-purple-400 transition-colors">
                                        {task.title}
                                    </h4>

                                    {/* Task Description */}
                                    {task.description && (
                                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}

                                    {/* Task Meta */}
                                    <div className="flex items-center justify-between text-xs">
                                        <span
                                            className={`px-2 py-1 rounded ${priorityColors[task.priority as keyof typeof priorityColors]
                                                }`}
                                        >
                                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                                        </span>
                                        {task.profiles && (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white text-xs">
                                                    {task.profiles.full_name?.charAt(0) || 'U'}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Project Tag */}
                                    {task.projects && (
                                        <div className="mt-2 pt-2 border-t border-white/10">
                                            <span className="text-xs text-gray-500">
                                                {task.projects.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Task Button */}
                            <button className="w-full py-3 border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-lg text-gray-400 hover:text-purple-400 text-sm font-medium transition-all flex items-center justify-center space-x-2">
                                <Plus className="w-4 h-4" />
                                <span>Přidat úkol</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
