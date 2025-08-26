import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Get current user
  const userIdCookie = cookieStore.get('user_id')
  if (!userIdCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, total_score')
    .eq('id', userIdCookie.value)
    .single()

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get ranking by counting users with higher scores
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gt('total_score', currentUser.total_score)

  const rank = (count || 0) + 1

  return NextResponse.json({ 
    rank,
    totalScore: currentUser.total_score || 0
  })
}