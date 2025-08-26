import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      qr_code: user.qr_code,
      group_type: user.group_type,
      seat_number: user.seat_number
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}