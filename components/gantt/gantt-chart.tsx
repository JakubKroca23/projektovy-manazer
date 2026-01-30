"use client";

import { FrappeGantt, Task, ViewMode } from "react-frappe-gantt";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronDown } from "lucide-react";
import { Task as PrismaTask } from "@prisma/client";

interface GanttChartProps {
  tasks: PrismaTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<PrismaTask>) => void;
}

export function GanttChart({ tasks, onTaskUpdate }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  const ganttTasks = useMemo(() => {
    return tasks.map(task => {
      const startDate = task.startDate ? new Date(task.startDate) : new Date();
      const endDate = task.endDate ? new Date(task.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days default
      
      return new Task({
        id: task.id,
        name: task.name,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: task.progress / 100, // Convert to 0-1 range for Frappe Gantt
        dependencies: "", // TODO: Add task dependencies when implemented
      });
    });
  }, [tasks]);

  const handleDateChange = (task: Task, start: any, end: any) => {
    if (onTaskUpdate && task.id) {
      onTaskUpdate(task.id, {
        startDate: new Date(start),
        endDate: new Date(end),
      });
    }
  };

  const handleProgressChange = (task: Task, progress: number) => {
    if (onTaskUpdate && task.id) {
      onTaskUpdate(task.id, {
        progress: Math.round(progress * 100), // Convert back to 0-100 range
      });
    }
  };

  const handleTasksChange = (tasks: Task[]) => {
    console.log("Tasks changed:", tasks);
  };

  const handleTaskClick = (task: Task) => {
    console.log("Task clicked:", task);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Časová osa projektu</h3>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {tasks.length} úkolů
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="view-mode" className="text-sm font-medium text-gray-700">
            Zobrazení:
          </label>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ViewMode.QuarterDay}>Čtvrt den</SelectItem>
              <SelectItem value={ViewMode.HalfDay}>Půl den</SelectItem>
              <SelectItem value={ViewMode.Day}>Den</SelectItem>
              <SelectItem value={ViewMode.Week}>Týden</SelectItem>
              <SelectItem value={ViewMode.Month}>Měsíc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
        <div className="min-w-[800px]">
          <FrappeGantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onClick={handleTaskClick}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
            onTasksChange={handleTasksChange}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>V průběhu</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Čeká</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Dokončeno</span>
        </div>
      </div>
    </div>
  );
}