import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    console.log('Current user in nickname API:', user)
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname } = body

    // バリデーション
    if (!nickname || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
        { status: 400 }
      )
    }

    // 20文字以内チェック
    if (nickname.length > 20) {
      return NextResponse.json(
        { error: 'ニックネームは20文字以内で入力してください' },
        { status: 400 }
      )
    }

    // 絵文字チェック（簡易的な実装）
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
    if (emojiRegex.test(nickname)) {
      return NextResponse.json(
        { error: '絵文字は使用できません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 重複チェック
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .neq('qr_code', user.qr_code)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'このニックネームは既に使用されています' },
        { status: 400 }
      )
    }

    // ニックネームを更新
    console.log('Updating user nickname:', { userId: user.id, nickname, qrCode: user.qr_code })
    
    // QRコードで更新（IDの代わりに）
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ nickname })
      .eq('qr_code', user.qr_code)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Update nickname error:', error)
      return NextResponse.json(
        { error: 'ニックネームの更新に失敗しました' },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      console.error('No user found with ID:', user.id)
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Nickname API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// ニックネームをクリア（フルネームに戻す）
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ nickname: null })
      .eq('qr_code', user.qr_code)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Clear nickname error:', error)
      return NextResponse.json(
        { error: 'ニックネームのクリアに失敗しました' },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      console.error('No user found with ID:', user.id)
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Nickname API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}