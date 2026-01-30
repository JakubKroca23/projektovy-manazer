import { getProjects } from "@/lib/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Users, FileText } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const projects = await getProjects();

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "IN_PROGRESS").length,
    totalContracts: projects.reduce((sum, p) => sum + p._count.contracts, 0),
    totalMembers: projects.reduce((sum, p) => sum + p._count.members, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING": return "bg-blue-100 text-blue-800";
      case "TODO": return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "REVIEW": return "bg-purple-100 text-purple-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PLANNING": return "Plánování";
      case "TODO": return "K řešení";
      case "IN_PROGRESS": return "V průběhu";
      case "REVIEW": return "K revizi";
      case "COMPLETED": return "Dokončeno";
      case "CANCELLED": return "Zrušeno";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Přehled</h1>
        <Link href="/dashboard/projekty/vytvorit">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nový projekt
          </Button>
        </Link>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem projektů</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} aktivních
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakázky</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              Všechny zakázky
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Členové</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              V projektech
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivní</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Probíhající
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Nedávné projekty */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Nedávné projekty</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(0, 6).map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description || "Bez popisu"}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{project._count.contracts} zakázek</span>
                  <span>{project.members.length} členů</span>
                </div>
                <div className="mt-4">
                  <Link href={`/dashboard/projekty/${project.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Zobrazit detail
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}