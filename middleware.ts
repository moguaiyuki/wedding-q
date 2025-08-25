import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin/dashboard')) {
    const session = request.cookies.get('admin_session')
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  if (path.startsWith('/participant/waiting') || 
      path.startsWith('/participant/quiz') ||
      path.startsWith('/participant/results')) {
    const session = request.cookies.get('participant_session')
    
    if (!session) {
      return NextResponse.redirect(new URL('/participant', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/participant/waiting/:path*',
    '/participant/quiz/:path*',
    '/participant/results/:path*'
  ]
}