import Link from 'next/link'
import { ArrowRight, FolderKanban, Users, BarChart3, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ProjectHub
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Přihlásit se
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Začít zdarma
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Říďte projekty
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              efektivně a moderně
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Moderní webová aplikace pro správu projektů. Kanban board, team management, real-time updates. Vše na jednom místě.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-200 text-lg"
            >
              <span>Začít zdarma</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg transition-all text-lg"
            >
              Přihlásit se
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-white mb-4">Vše, co potřebujete</h3>
            <p className="text-gray-400">Komplexní řešení pro řízení projektů</p>
          </div>

          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FolderKanban,
                title: 'Správa projektů',
                description: 'Vytvářejte a organizujte projekty s přehledným dashboardem',
              },
              {
                icon: BarChart3,
                title: 'Kanban board',
                description: 'Vizualizujte úkoly a sledujte progress v reálném čase',
              },
              {
                icon: Users,
                title: 'Team management',
                description: 'Spravujte týmy a přiřazujte role jednotlivým členům',
              },
              {
                icon: Shield,
                title: 'Zabezpečení',
                description: 'Row Level Security a bezpečná autentizace',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-white/10 rounded-2xl p-12 text-center">
            <h3 className="text-4xl font-bold text-white mb-4">
              Připraveni začít?
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              Zaregistrujte se zdarma a začněte řídit svoje projekty ještě dnes!
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-200 text-lg"
            >
              <span>Vytvořit účet zdarma</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400 text-sm">
            <p>© 2026 ProjectHub. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
