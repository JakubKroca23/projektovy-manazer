"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  CheckSquare,
  Users,
  Settings,
  Calendar
} from "lucide-react";

const navigation = [
  { name: "Přehled", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projekty", href: "/dashboard/projekty", icon: FolderKanban },
  { name: "Zakázky", href: "/dashboard/zakazky", icon: FileText },
  { name: "Úkoly", href: "/dashboard/ukoly", icon: CheckSquare },
  { name: "Gantt", href: "/dashboard/gantt", icon: Calendar },
  { name: "Tým", href: "/dashboard/tym", icon: Users },
  { name: "Nastavení", href: "/dashboard/nastaveni", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">Projektový Manažer</h1>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}