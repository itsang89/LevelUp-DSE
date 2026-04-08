import type { Metadata } from 'next'
import { LandingPage } from '@/src/views/LandingPage'

export const metadata: Metadata = {
  title: 'LevelUp DSE - Study Companion',
  description: 'Plan your DSE study schedule, track past papers, and monitor your progress.',
}

export default function Page() {
  return <LandingPage />
}
