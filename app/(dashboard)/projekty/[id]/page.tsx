import { getProjectById } from "@/lib/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Users, Calendar, FileText, Edit } from "lucide-react";
import Link from "next/link";
import { ContractList } from "@/components/contracts/contract-list";
import { TaskList } from "@/components/tasks/task-list";

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProjectById(params.id);

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Projekt nebyl nalezen</h1>
        <p className="text-gray-600 mt-2">Omlouváme se, ale požadovaný projekt neexistuje.</p>
        <Link href="/dashboard/projekty">
          <Button className="mt-4">Zpět na projekty</Button>
        </Link>
      </div>
    );
  }

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
      {/* Header s navigací */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/projekty">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <Badge className={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                Vytvořeno {new Date(project.createdAt).toLocaleDateString("cs-CZ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Upravit
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Přidat zakázku
          </Button>
        </div>
      </div>

      {/* Projektové informace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Popis */}
          <Card>
            <CardHeader>
              <CardTitle>Popis projektu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                {project.description || "Bez popisu"}
              </p>
            </CardContent>
          </Card>

          {/* Časová osa */}
          <Card>
            <CardHeader>
              <CardTitle>Časová osa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Datum zahájení</div>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {project.startDate 
                        ? new Date(project.startDate).toLocaleDateString("cs-CZ")
                        : "Neurčeno"
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Datum ukončení</div>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {project.endDate 
                        ? new Date(project.endDate).toLocaleDateString("cs-CZ")
                        : "Neurčeno"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar s informacemi */}
        <div className="space-y-6">
          {/* Statistiky */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Zakázky</span>
                <span className="font-medium">{project.contracts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Členové</span>
                <span className="font-medium">{project.members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Aktivní zakázky</span>
                <span className="font-medium">
                  {project.contracts.filter(c => c.status === "IN_PROGRESS").length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Členové týmu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Tým
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {member.user.name || member.user.email}
                      </div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zakázky */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Zakázky</h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nová zakázka
          </Button>
        </div>
        <ContractList contracts={project.contracts} />
      </div>
    </div>
  );
}