import { getContracts } from "@/lib/actions/contracts";
import { ContractList } from "@/components/contracts/contract-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function ContractsPage() {
  const contracts = await getContracts();

  const stats = {
    total: contracts.length,
    planning: contracts.filter((c: any) => c.status === "PLANNING").length,
    inProgress: contracts.filter((c: any) => c.status === "IN_PROGRESS").length,
    completed: contracts.filter((c: any) => c.status === "COMPLETED").length,
    totalTasks: contracts.reduce((sum: number, contract: any) => sum + (contract.tasks?.length || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zakázky</h1>
          <p className="text-gray-600 mt-1">
            Přehled všech zakázek napříč projekty
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nová zakázka
        </Button>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem zakázek</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">V plánování</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planning}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">V průběhu</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokončené</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem úkolů</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtry podle projektů */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry podle projektů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Všechny projekty</Badge>
            {/* TODO: Add project filters based on actual projects */}
          </div>
        </CardContent>
      </Card>

      {/* Seznam zakázek */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Všechny zakázky</h2>
        <ContractList contracts={contracts} />
      </div>
    </div>
  );
}
