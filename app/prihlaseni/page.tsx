import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Github } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Projektový Manažer
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Přihlaste se pro přístup k vašim projektům
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Přihlášení</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="vas@email.cz"
                />
              </div>
              <div>
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>
              
              <Button type="submit" className="w-full">
                Přihlásit se
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Nebo</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              <Github className="mr-2 h-4 w-4" />
              Přihlásit přes Google
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Ještě nemáte účet?{" "}
                <Link href="/registrace" className="font-medium text-blue-600 hover:text-blue-500">
                  Zaregistrujte se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}