'use client'

import { getTasks } from "@/lib/actions/tasks"
import { getProjects } from "@/lib/actions/projects"
import { GanttChart } from "@/components/gantt/gantt-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"
import { useState, useEffect } from "react"

export default function GanttPage() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksData = await getTasks()
        const projectsData = await getProjects()
        setTasks(tasksData || [])
        setProjects(projectsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-gray-600'>Načítání...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gantt Chart</h1>
          <p className="text-gray-600 mt-1">
            Časová osa všech projektů a úkolů
          </p>
        </div>
        
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select>
                <SelectTrigger className="border-0 bg-transparent">
                  <SelectValue placeholder="Filtrovat projekty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny projekty</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Celkem úkolů</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">V průběhu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((t: any) => t.status === "IN_PROGRESS").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dokončeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((t: any) => t.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Průměrný postup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.length > 0 
                ? Math.round(tasks.reduce((sum: number, task: any) => sum + task.progress, 0) / tasks.length)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <CardTitle>Časová osa projektů</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <GanttChart tasks={tasks} />
        </CardContent>
      </Card>

      {/* Projektové statistiky */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Přehled projektů</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => {
            const projectTasks = tasks.filter((t: any) => t.contract?.project_id === project.id)
            const completedTasks = projectTasks.filter((t: any) => t.status === "COMPLETED")
            const progress = projectTasks.length > 0 
              ? Math.round((completedTasks.length / projectTasks.length) * 100)
              : 0

            return (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Úkoly:</span>
                      <span className="font-medium">
                        {completedTasks.length}/{projectTasks.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Postup:</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
