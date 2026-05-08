import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protect dashboard routes — must be logged in
  if (path.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if ((path === '/login' || path === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // PAYWALL: Check subscription for dashboard routes
  // Allow billing, subscribe pages, and API routes without payment
  if (
    user &&
    path.startsWith('/dashboard') &&
    !path.startsWith('/dashboard/settings/billing') &&
    !path.startsWith('/dashboard/subscribe')
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, created_at')
      .eq('id', user.id)
      .single()

    // No profile yet → redirect to subscribe
    if (!profile) {
      return NextResponse.redirect(
        new URL('/dashboard/subscribe', request.url)
      )
    }

    // Check if premium and not expired
    const isPremium =
      profile.plan === 'premium' &&
      profile.plan_expires_at &&
      new Date(profile.plan_expires_at) > new Date()

    // Check if within 2-day free trial
    const createdAt = new Date(profile.created_at)
    const twoDaysLater = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000)
    const isInFreeTrial = new Date() < twoDaysLater

    // Allow access if premium OR in free trial
    if (!isPremium && !isInFreeTrial) {
      return NextResponse.redirect(
        new URL('/dashboard/subscribe', request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
