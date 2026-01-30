import { createClient } from '@/lib/supabase/server'
import { Calendar, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import TaskActions from '@/components/tasks/task-actions'

export default async function UkolyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all tasks assigned to user or in user's projects
    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
      *,
      projects(name),
      profiles:assigned_to(full_name)
    `)
        .order('due_date', { ascending: true })

    const priorityIcons = {
        low: <Clock className="w-4 h-4 text-gray-400" />,
        medium: <Circle className="w-4 h-4 text-blue-400" />,
        high: <AlertCircle className="w-4 h-4 text-orange-400" />,
        urgent: <AlertCircle className="w-4 h-4 text-red-500" />,
    }

    const statusColors = {
        todo: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        review: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        done: 'bg-green-500/10 text-green-400 border-green-500/20',
    }

    const statusLabels = {
        todo: 'K řešení',
        in_progress: 'V průběhu',
        review: 'Revize',
        done: 'Hotovo',
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Všechny úkoly</h1>
                <p className="text-gray-400">Přehled všech vašich úkolů napříč projekty</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 font-medium text-gray-300">Název úkolu</th>
                                <th className="px-6 py-4 font-medium text-gray-300">Projekt</th>
                                <th className="px-6 py-4 font-medium text-gray-300">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-300">Priorita</th>
                                <th className="px-6 py-4 font-medium text-gray-300">Termín</th>
                                <th className="px-6 py-4 font-medium text-gray-300">Řešitel</th>
                                <th className="px-6 py-4 font-medium text-gray-300"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks?.map((task: any) => (
                                <tr key={task.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{task.title}</div>
                                        {task.description && (
                                            <div className="text-gray-500 text-xs truncate max-w-xs">{task.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {task.projects?.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[task.status as keyof typeof statusColors]}`}>
                                            {statusLabels[task.status as keyof typeof statusLabels]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {priorityIcons[task.priority as keyof typeof priorityIcons]}
                                            <span className="capitalize text-gray-300">{task.priority}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white text-xs">
                                                {task.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-gray-300">{task.profiles?.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <TaskActions taskId={task.id} taskTitle={task.title} />
                                    </td>
                                </tr>
                            ))}
                            {(!tasks || tasks.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Zatím žádné úkoly.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
