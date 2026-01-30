import { getTasks } from "@/lib/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckSquare, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function TasksPage() {
  const tasks = await getTasks();

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t: any) => t.status === "TODO").length,
    inProgress: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t: any) => t.status === "COMPLETED").length,
    averageProgress: tasks.length > 0 
      ? Math.round(tasks.reduce((sum: number, task: any) => sum + task.progress, 0) / tasks.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Úkoly</h1>
          <p className="text-gray-600 mt-1">
            Správa a sledování všech úkolů napříč projekty
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nový úkol
        </Button>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem úkolů</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">K řešení</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todo}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">V průběhu</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokončeno</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Průměrný postup</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtry */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Všechny ({stats.total})</Badge>
            <Badge variant="secondary">K řešení ({stats.todo})</Badge>
            <Badge variant="secondary">V průběhu ({stats.inProgress})</Badge>
            <Badge variant="secondary">Dokončeno ({stats.completed})</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Seznam úkolů */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Všechny úkoly</h2>
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}
