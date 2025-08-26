import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

// データ初期化（回答データのみクリア）
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

    const { searchParams } = new URL(request.url)
    const confirmReset = searchParams.get('confirm') === 'true'

    if (!confirmReset) {
      return NextResponse.json(
        { error: '確認パラメータが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // トランザクション的に処理
    // 1. 回答データを削除
    const { error: answersError } = await supabase
      .from('answers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除（ダミー条件）

    if (answersError) {
      console.error('Delete answers error:', answersError)
      return NextResponse.json(
        { error: '回答データの削除に失敗しました' },
        { status: 500 }
      )
    }

    // 2. ユーザーセッションをクリア
    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除（ダミー条件）

    if (sessionsError) {
      console.error('Delete sessions error:', sessionsError)
      return NextResponse.json(
        { error: 'セッションデータの削除に失敗しました' },
        { status: 500 }
      )
    }

    // 3. ゲーム状態をリセット
    const { error: gameStateError } = await supabase
      .from('game_state')
      .update({
        current_state: 'waiting',
        current_question_id: null,
        current_question_number: 0,
        answers_closed_at: null,
        results_shown_at: null
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全更新（ダミー条件）

    if (gameStateError) {
      console.error('Reset game state error:', gameStateError)
      return NextResponse.json(
        { error: 'ゲーム状態のリセットに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '回答データを初期化しました'
    })
  } catch (error) {
    console.error('Data management API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// データ統計を取得
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // 統計情報を取得
    const [
      { count: participantsCount },
      { count: questionsCount },
      { count: answersCount },
      { count: sessionsCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('answers').select('*', { count: 'exact', head: true }),
      supabase.from('user_sessions').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      participants: participantsCount || 0,
      questions: questionsCount || 0,
      answers: answersCount || 0,
      sessions: sessionsCount || 0
    })
  } catch (error) {
    console.error('Data stats API error:', error)
    return NextResponse.json(
      { error: 'データ統計の取得に失敗しました' },
      { status: 500 }
    )
  }
}