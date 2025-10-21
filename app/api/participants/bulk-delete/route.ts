import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminSession } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    // 管理者認証チェック
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    // RLSをバイパスする管理者用クライアントを使用
    const supabase = createAdminClient()

    // まず全参加者を取得
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id')

    if (fetchError) {
      console.error('Fetch participants error:', fetchError)
      return NextResponse.json(
        { error: '参加者の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: '削除する参加者がいません'
      })
    }

    // 全参加者を削除 (常にtrueとなる条件を使用)
    const { error, count } = await supabase
      .from('users')
      .delete()
      .gte('created_at', '1900-01-01')

    if (error) {
      console.error('Bulk delete participants error:', error)
      return NextResponse.json(
        { error: '参加者の一括削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${count || users.length}名の参加者を削除しました`
    })
  } catch (error) {
    console.error('Bulk delete API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
