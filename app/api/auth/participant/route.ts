import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json()

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QRコードまたはIDが入力されていません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: '無効なQRコードまたはIDです' },
        { status: 401 }
      )
    }

    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        last_active: new Date().toISOString()
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'セッション作成エラーが発生しました' },
        { status: 500 }
      )
    }

    cookies().set('participant_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        group_type: user.group_type,
        seat_number: user.seat_number
      },
      shouldSetupProfile: !user.nickname // ニックネーム未設定の場合はtrueを返す
    })
  } catch (error) {
    console.error('Participant auth error:', error)
    return NextResponse.json(
      { error: '認証処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const sessionToken = cookies().get('participant_session')?.value

  if (sessionToken) {
    const supabase = await createClient()
    
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken)
  }

  cookies().delete('participant_session')
  return NextResponse.json({ success: true })
}