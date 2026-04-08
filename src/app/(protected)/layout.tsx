'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/src/contexts/DataContext'
import { Layout } from '@/src/components/Layout'
import { SkeletonLoader } from '@/src/components/SkeletonLoader'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    session,
    isGuest,
    authLoading,
    subjectsLoading,
    appError,
    setCells,
  } = useData()

  const canUseApp = Boolean(session) || isGuest

  useEffect(() => {
    if (!authLoading && !canUseApp) {
      router.replace('/login')
    }
  }, [authLoading, canUseApp, router])

  // Listen for subject deletion to clean up cells
  useEffect(() => {
    const handleSubjectDeleted = (e: CustomEvent<{ subjectId: string }>) => {
      const { subjectId } = e.detail ?? {}
      if (subjectId) {
        setCells((prev) => prev.filter((c) => c.task?.subjectId !== subjectId))
      }
    }
    window.addEventListener('subject-deleted', handleSubjectDeleted as EventListener)
    return () => window.removeEventListener('subject-deleted', handleSubjectDeleted as EventListener)
  }, [setCells])

  if (authLoading || (session && subjectsLoading)) {
    return <SkeletonLoader />
  }

  if (appError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-xl space-y-4">
          <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{appError}</p>
        </div>
      </div>
    )
  }

  if (!canUseApp) return null

  return <Layout>{children}</Layout>
}
