import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // 管理者権限のクライアントを使用（RLSを回避）
    const adminClient = createAdminClient()

    // トランザクション的に処理
    // 1. 全ての回答データを削除（管理者権限で一括削除）
    const { error: answersError } = await adminClient
      .from('answers')
      .delete()
      .gte('answered_at', '1970-01-01')
    
    if (answersError) {
      console.error('Delete answers error:', answersError)
      return NextResponse.json(
        { error: `回答データの削除に失敗しました: ${answersError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Answers deleted successfully')

    // 2. 全てのセッションデータを削除（管理者権限で一括削除）
    const { error: sessionsError } = await adminClient
      .from('user_sessions')
      .delete()
      .gte('last_active', '1970-01-01')
    
    if (sessionsError) {
      console.error('Delete sessions error:', sessionsError)
      return NextResponse.json(
        { error: `セッションデータの削除に失敗しました: ${sessionsError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Sessions deleted successfully')

    // 3. 全てのユーザーのニックネームをクリア
    const { error: nicknameError } = await adminClient
      .from('users')
      .update({ nickname: null })
      .gte('created_at', '1970-01-01')
    
    if (nicknameError) {
      console.error('Clear nicknames error:', nicknameError)
      return NextResponse.json(
        { error: `ニックネームのクリアに失敗しました: ${nicknameError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Nicknames cleared successfully')

    // 4. ゲーム状態をリセット（管理者権限で一括更新）
    const { error: gameStateError } = await adminClient
      .from('game_state')
      .update({
        current_state: 'waiting',
        current_question_id: null,
        current_question_number: 0,
        answers_closed_at: null,
        results_shown_at: null
      })
      .gte('id', '00000000-0000-0000-0000-000000000000')
    
    if (gameStateError) {
      console.error('Reset game state error:', gameStateError)
      return NextResponse.json(
        { error: `ゲーム状態のリセットに失敗しました: ${gameStateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '回答データとニックネームを初期化しました'
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