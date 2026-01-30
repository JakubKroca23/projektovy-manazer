'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Všechna pole jsou povinná')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Hesla se neshodují')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      })

      if (signUpError) throw signUpError

      setSuccess(
        'Účet úspěšně vytvořen! Zkontrolujte svůj e-mail pro potvrzení...'
      )
      setTimeout(() => router.push('/auth/sign-up-success'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při registraci')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            Projektový Manažer
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Vytvořte si účet pro správu vašich projektů
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrace</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
                {error}
              </div>
            )}
            {success && (
              <div className='bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded'>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Jméno</Label>
                <Input
                  id='name'
                  name='name'
                  type='text'
                  autoComplete='name'
                  placeholder='Jan Novák'
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  placeholder='vas@email.cz'
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <Label htmlFor='password'>Heslo</Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='new-password'
                  placeholder='•••••••••'
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <Label htmlFor='confirmPassword'>Potvrďte heslo</Label>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  placeholder='•••••••••'
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                <UserPlus className='mr-2 h-4 w-4' />
                {isLoading ? 'Vytváření účtu...' : 'Vytvořit účet'}
              </Button>
            </form>

            <div className='text-center'>
              <p className='text-sm text-gray-600'>
                Již máte účet?{' '}
                <Link
                  href='/prihlaseni'
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Přihlaste se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
