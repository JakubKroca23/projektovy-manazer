"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { createProject } from "@/lib/actions/projects";

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrors({});

    const result = await createProject(formData);

    if (result.error) {
      setErrors(result.error);
      setIsSubmitting(false);
      return;
    }

    // Successful redirect happens in server action
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/projekty">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na projekty
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vytvořit projekt</h1>
          <p className="text-gray-600 mt-1">Zadejte základní informace o novém projektu</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Základní informace</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="name">Název projektu *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Např. Redesign firemního webu"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Popis projektu</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Popište cíle a rozsah projektu..."
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Počáteční stav</Label>
                <Select name="status" defaultValue="PLANNING">
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte stav" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Plánování</SelectItem>
                    <SelectItem value="TODO">K řešení</SelectItem>
                    <SelectItem value="IN_PROGRESS">V průběhu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Datum zahájení</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className={errors.startDate ? "border-red-500" : ""}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">Datum ukončení (plánované)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className={errors.endDate ? "border-red-500" : ""}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate[0]}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href="/dashboard/projekty">
                <Button variant="outline" disabled={isSubmitting}>
                  Zrušit
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Vytvářím..." : "Vytvořit projekt"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}