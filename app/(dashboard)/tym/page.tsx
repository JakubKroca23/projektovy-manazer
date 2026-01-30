import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, UserCheck } from "lucide-react";

export default async function TeamPage() {
  // TODO: Implement actual user management from database
  const teamMembers = [
    { id: 1, name: "Jan Novák", email: "admin@firma.cz", role: "ADMIN", status: "Aktivní" },
    { id: 2, name: "Petra Svobodová", email: "manager@firma.cz", role: "MANAGER", status: "Aktivní" },
    { id: 3, name: "Tomáš Dvořák", email: "clen@firma.cz", role: "MEMBER", status: "Aktivní" },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800";
      case "MANAGER": return "bg-blue-100 text-blue-800";
      case "MEMBER": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "ADMIN": return "Administrátor";
      case "MANAGER": return "Manažer";
      case "MEMBER": return "Člen";
      default: return role;
    }
  };

  const stats = {
    total: teamMembers.length,
    admins: teamMembers.filter(m => m.role === "ADMIN").length,
    managers: teamMembers.filter(m => m.role === "MANAGER").length,
    members: teamMembers.filter(m => m.role === "MEMBER").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tým</h1>
          <p className="text-gray-600 mt-1">
            Správa uživatelů a rolí v systému
          </p>
        </div>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem uživatelů</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrátoři</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manažeři</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.managers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Členové</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
          </CardContent>
        </Card>
      </div>

      {/* Seznam uživatelů */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seznam uživatelů</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge className={getRoleColor(member.role)}>
                    {getRoleText(member.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {member.email}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Status: {member.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Role: {getRoleText(member.role)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}