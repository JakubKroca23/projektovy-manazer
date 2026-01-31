import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ThemeProvider } from '@/components/layout/theme-provider'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 transition-colors">
                {/* Background effect - only in dark mode */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none dark:opacity-100 opacity-0 transition-opacity">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
                </div>

                {/* Main content - fullscreen */}
                <div className="relative z-10 h-screen flex flex-col">
                    {/* Page content takes full height minus navbar */}
                    <main className="flex-1 overflow-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
