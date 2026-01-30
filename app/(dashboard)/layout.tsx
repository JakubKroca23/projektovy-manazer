'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/prihlaseni')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return <div className='min-h-screen flex items-center justify-center'>Načítání...</div>
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Sidebar />
      <div className='lg:pl-64'>
        <Header />
        <main className='p-6'>{children}</main>
      </div>
    </div>
  )
}
