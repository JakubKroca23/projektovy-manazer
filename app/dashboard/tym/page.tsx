import { createClient } from '@/lib/supabase/server'
import { Mail, Shield } from 'lucide-react'

export default async function TymPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Sice nemáme tabulku 'teams', ale můžeme zobrazit lidi, se kterými jsem v projektech.
    // Získáme ID projektů, kde jsem členem nebo ownerem
    const { data: myProjects } = await supabase
        .from('projects')
        .select('id')
        .or(`created_by.eq.${user?.id},id.in.(select project_id from project_members where user_id = ${user?.id})`)

    const projectIds = myProjects?.map(p => p.id) || []

    // Získáme členy těchto projektů (unikátní)
    const { data: members } = await supabase
        .from('project_members')
        .select(`
      user_id,
      role,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        role
      ),
      projects (name)
    `)
        .in('project_id', projectIds)

    // Spojíme duplicity (jeden člověk může být ve více projektech)
    const uniqueMembers = Object.values(
        (members || []).reduce((acc: any, curr: any) => {
            if (!acc[curr.user_id]) {
                acc[curr.user_id] = {
                    ...curr.profiles,
                    projects: [curr.projects.name],
                    projectRoles: [curr.role]
                }
            } else {
                if (!acc[curr.user_id].projects.includes(curr.projects.name)) {
                    acc[curr.user_id].projects.push(curr.projects.name);
                }
            }
            return acc;
        }, {})
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Můj Tým</h1>
                <p className="text-gray-400">Přehled kolegů, se kterými spolupracujete na projektech</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniqueMembers.map((member: any) => (
                    <div key={member.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                                {member.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">{member.full_name}</h3>
                                <p className="text-gray-400 text-sm capitalize">{member.role || 'member'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center text-gray-400 text-sm">
                                <Mail className="w-4 h-4 mr-2" />
                                <span>Email skrytý (GDPR)</span>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Projekty</p>
                                <div className="flex flex-wrap gap-2">
                                    {member.projects.map((proj: string) => (
                                        <span key={proj} className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                                            {proj}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {uniqueMembers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Zatím v týmu nikoho nemáte. Přidejte členy do svých projektů.
                    </div>
                )}
            </div>
        </div>
    )
}
