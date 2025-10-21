import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    const { data: participants, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Fetch participants error:', error)
      return NextResponse.json(
        { error: '参加者の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(participants || [])
  } catch (error) {
    console.error('Participants API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 4桁のユニークなQRコードを生成（英数字: A-Z, 0-9）
async function generateUniqueQRCode(supabase: any, maxRetries: number = 100): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  for (let i = 0; i < maxRetries; i++) {
    // 4桁の英数字をランダムに生成
    let qrCode = ''
    for (let j = 0; j < 4; j++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      qrCode += characters[randomIndex]
    }

    // 既存のQRコードと重複していないかチェック
    const { data, error } = await supabase
      .from('users')
      .select('qr_code')
      .eq('qr_code', qrCode)
      .single()

    // データが見つからない = 重複していない
    if (error && error.code === 'PGRST116') {
      return qrCode
    }
  }

  throw new Error('ユニークなQRコードの生成に失敗しました。参加者が多すぎる可能性があります。')
}

export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, group_type, seat_number, message, message_image_url } = body

    if (!name || !group_type) {
      return NextResponse.json(
        { error: '名前とグループ属性は必須です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // QRコードIDを生成（4桁のユニークな数字）
    const qr_code = await generateUniqueQRCode(supabase)

    const { data: participant, error } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        qr_code,
        name,
        group_type,
        seat_number: seat_number || null,
        message: message || null,
        message_image_url: message_image_url || null
      })
      .select()
      .single()

    if (error) {
      console.error('Create participant error:', error)
      return NextResponse.json(
        { error: '参加者の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Participants API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, group_type, seat_number, message, message_image_url } = body

    if (!id) {
      return NextResponse.json(
        { error: '参加者IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: participant, error } = await supabase
      .from('users')
      .update({
        name,
        group_type,
        seat_number,
        message,
        message_image_url
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update participant error:', error)
      return NextResponse.json(
        { error: '参加者の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Participants API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '参加者IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete participant error:', error)
      return NextResponse.json(
        { error: '参加者の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Participants API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}