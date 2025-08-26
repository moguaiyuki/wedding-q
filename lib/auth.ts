import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const sessionToken = cookies().get('participant_session')?.value

  if (!sessionToken) {
    return null
  }

  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('user_sessions')
    .select('*, users(*)')
    .eq('session_token', sessionToken)
    .single()

  if (error || !session) {
    return null
  }

  await supabase
    .from('user_sessions')
    .update({ last_active: new Date().toISOString() })
    .eq('session_token', sessionToken)

  return session.users
}

export async function validateAdminSession() {
  const sessionToken = cookies().get('admin_session')?.value

  if (!sessionToken) {
    return false
  }

  return true
}