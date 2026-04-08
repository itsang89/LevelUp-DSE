'use client'

import { DataProvider } from '@/src/contexts/DataContext'
import { ToastProvider } from '@/src/contexts/ToastContext'
import { ConfirmProvider } from '@/src/contexts/ConfirmContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <ToastProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </DataProvider>
  )
}
