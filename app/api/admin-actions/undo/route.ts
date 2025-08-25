import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: '管理者権限が必要です' },
      { status: 401 }
    )
  }

  try {
    const { action_id } = await request.json()

    if (!action_id) {
      return NextResponse.json(
        { error: 'アクションIDが指定されていません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: action, error: fetchError } = await supabase
      .from('admin_actions')
      .select('*')
      .eq('id', action_id)
      .single()

    if (fetchError || !action) {
      return NextResponse.json(
        { error: 'アクションが見つかりません' },
        { status: 404 }
      )
    }

    if (action.undone) {
      return NextResponse.json(
        { error: 'このアクションは既に取り消されています' },
        { status: 400 }
      )
    }

    const { data: currentState } = await supabase
      .from('game_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (action.previous_state && currentState) {
      const { error: updateError } = await supabase
        .from('game_state')
        .update({
          current_state: action.previous_state.current_state,
          current_question_id: action.previous_state.current_question_id,
          current_question_number: action.previous_state.current_question_number,
          answers_closed_at: action.previous_state.answers_closed_at,
          results_shown_at: action.previous_state.results_shown_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentState.id)

      if (updateError) {
        console.error('Game state update error:', updateError)
        return NextResponse.json(
          { error: 'ゲーム状態の復元に失敗しました' },
          { status: 500 }
        )
      }
    }

    const { error: undoError } = await supabase
      .from('admin_actions')
      .update({ undone: true })
      .eq('id', action_id)

    if (undoError) {
      console.error('Undo marking error:', undoError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Undo API error:', error)
    return NextResponse.json(
      { error: 'UNDO操作中にエラーが発生しました' },
      { status: 500 }
    )
  }
}