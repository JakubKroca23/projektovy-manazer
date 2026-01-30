import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Edit, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { Contract } from "@prisma/client";

interface ContractListProps {
  contracts: (Contract & {
    tasks: any[];
    project: any;
  })[];
}

export function ContractList({ contracts }: ContractListProps) {
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

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné zakázky</h3>
          <p className="text-gray-600 mb-4">
            Tento projekt zatím nemá žádné zakázky. Vytvořte první zakázku pro začátek.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Vytvořit zakázku
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <Card key={contract.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-lg">{contract.name}</CardTitle>
                <Badge className={getStatusColor(contract.status)}>
                  {getStatusText(contract.status)}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {contract.description || "Bez popisu"}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Začátek: {contract.startDate 
                  ? new Date(contract.startDate).toLocaleDateString("cs-CZ")
                  : "Neurčeno"
                }
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Konec: {contract.endDate 
                  ? new Date(contract.endDate).toLocaleDateString("cs-CZ")
                  : "Neurčeno"
                }
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="h-4 w-4 mr-2" />
                {contract.tasks.length} úkolů
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Projekt: {contract.project.name}
              </div>
              <Link href={`/dashboard/zakazky/${contract.id}`}>
                <Button variant="outline" size="sm">
                  Zobrazit detail
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}