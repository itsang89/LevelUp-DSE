import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware refreshes the Supabase session on every request so cookies stay
// up to date. Auth guards are handled client-side in (protected)/layout.tsx
// because guest mode uses localStorage and can't be detected server-side.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set(name, value, options)
        },
        remove: (name, options) => {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
