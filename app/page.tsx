import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='max-w-2xl text-center space-y-8'>
        <div>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
            Projektový Manažer
          </h1>
          <p className='text-xl text-gray-600'>
            Moderní systém pro správu projektů, zakázek a úkolů s Gantt vizualizací
          </p>
        </div>

        <div className='space-y-4'>
          <p className='text-lg text-gray-700'>
            Spravujte své projekty efektivně s intuitivním rozhraním a pokročilými funkcemi.
          </p>
        </div>

        <div className='flex gap-4 justify-center flex-wrap'>
          <Button asChild size='lg' className='bg-blue-600 hover:bg-blue-700'>
            <Link href='/prihlaseni'>Přihlášení</Link>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <Link href='/registrace'>Registrace</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
