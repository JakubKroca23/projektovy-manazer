import { createClient } from '@/lib/supabase/server'
import ProjectsClientPage from './projects-client-page'

export default async function ProjektyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all projects via simple select (RLS handles security now)
    const { data: projects } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            status,
            created_at,
            created_by,
            expected_start_date,
            deadline,
            tasks (
                id,
                title,
                status,
                due_date,
                created_at,
                start_date,
                job_id
            ),
            jobs (
                id,
                name,
                status,
                deadline,
                expected_completion_date,
                created_at,
                start_date
            )
        `)
        .order('created_at', { ascending: false })

    // Get all services
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .order('start_date', { ascending: true })

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

    return (
        <ProjectsClientPage
            projects={(projects || []) as any[]}
            services={(services || []) as any[]}
            user={profile}
        />
    )
}
