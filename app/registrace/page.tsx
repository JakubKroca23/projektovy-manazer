import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Projektový Manažer
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vytvořte si účet pro správu vašich projektů
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Registrace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Jméno</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jan Novák"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vas@email.cz"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="•••••••••"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Potvrďte heslo</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="•••••••••"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Vytvořit účet
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Již máte účet?{" "}
                <Link href="/prihlaseni" className="font-medium text-blue-600 hover:text-blue-500">
                  Přihlaste se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}