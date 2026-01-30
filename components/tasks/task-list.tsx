import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, CheckSquare, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"

interface TaskListProps {
  tasks: any[]
}

export function TaskList({ tasks }: TaskListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-100 text-blue-800"
      case "TODO":
        return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "REVIEW":
        return "bg-purple-100 text-purple-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "Plánování"
      case "TODO":
        return "K řešení"
      case "IN_PROGRESS":
        return "V průběhu"
      case "REVIEW":
        return "K revizi"
      case "COMPLETED":
        return "Dokončeno"
      case "CANCELLED":
        return "Zrušeno"
      default:
        return status
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500"
    if (progress >= 75) return "bg-blue-500"
    if (progress >= 50) return "bg-yellow-500"
    if (progress >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné úkoly</h3>
          <p className="text-gray-600 mb-4">
            Tato zakázka zatím nemá žádné úkoly. Vytvořte první úkol pro začátek
            práce.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Vytvořit úkol
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <Badge className={getStatusColor(task.status)}>
                {getStatusText(task.status)}
              </Badge>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardTitle className="text-base leading-tight">{task.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.description || "Bez popisu"}
            </p>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Postup</span>
                <span className="font-medium">{task.progress}%</span>
              </div>
              <Progress
                value={task.progress}
                className="h-2"
                style={{
                  "--progress-background": getProgressColor(task.progress),
                } as any}
              />
            </div>

            {/* Časové informace */}
            <div className="text-xs text-gray-500 space-y-1">
              {task.start_date && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Začátek: {new Date(task.start_date).toLocaleDateString("cs-CZ")}
                </div>
              )}
              {task.end_date && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Konec: {new Date(task.end_date).toLocaleDateString("cs-CZ")}
                </div>
              )}
            </div>

            <Link href={`/dashboard/ukoly/${task.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                Zobrazit detail
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
