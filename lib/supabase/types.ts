export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    role: 'admin' | 'manager' | 'member'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'admin' | 'manager' | 'member'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'admin' | 'manager' | 'member'
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    status: 'planning' | 'active' | 'completed' | 'archived'
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    status?: 'planning' | 'active' | 'completed' | 'archived'
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    status?: 'planning' | 'active' | 'completed' | 'archived'
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    project_id: string
                    title: string
                    description: string | null
                    status: 'todo' | 'in_progress' | 'review' | 'done'
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    assigned_to: string | null
                    due_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    title: string
                    description?: string | null
                    status?: 'todo' | 'in_progress' | 'review' | 'done'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    assigned_to?: string | null
                    due_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    title?: string
                    description?: string | null
                    status?: 'todo' | 'in_progress' | 'review' | 'done'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    assigned_to?: string | null
                    due_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            project_members: {
                Row: {
                    id: string
                    project_id: string
                    user_id: string
                    role: 'owner' | 'admin' | 'member' | 'viewer'
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    user_id: string
                    role?: 'owner' | 'admin' | 'member' | 'viewer'
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    user_id?: string
                    role?: 'owner' | 'admin' | 'member' | 'viewer'
                    created_at?: string
                }
            }
        }
    }
}
