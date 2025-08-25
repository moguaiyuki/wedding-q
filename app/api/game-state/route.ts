import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: gameState, error } = await supabase
      .from('game_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Get game state error:', error)
      return NextResponse.json(
        { error: 'ゲーム状態の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!gameState) {
      const { data: newState, error: createError } = await supabase
        .from('game_state')
        .insert({
          current_state: 'waiting',
          current_question_number: 0
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'ゲーム状態の初期化に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json(newState)
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error('Game state API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: '管理者権限が必要です' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { 
      current_state,
      current_question_id,
      current_question_number
    } = body

    const supabase = await createClient()

    const { data: currentState } = await supabase
      .from('game_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: adminAction, error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        action_type: `change_state_to_${current_state}`,
        previous_state: currentState,
        new_state: body
      })
      .select()
      .single()

    if (actionError) {
      console.error('Admin action logging error:', actionError)
    }

    const updateData: any = {
      current_state,
      updated_at: new Date().toISOString()
    }

    if (current_question_id !== undefined) {
      updateData.current_question_id = current_question_id
    }

    if (current_question_number !== undefined) {
      updateData.current_question_number = current_question_number
    }

    if (current_state === 'accepting_answers') {
      updateData.answers_closed_at = null
      updateData.results_shown_at = null
    } else if (current_state === 'showing_results') {
      updateData.answers_closed_at = new Date().toISOString()
      updateData.results_shown_at = new Date().toISOString()
    }

    const { data: gameState, error } = await supabase
      .from('game_state')
      .update(updateData)
      .eq('id', currentState.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'ゲーム状態の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...gameState,
      admin_action_id: adminAction?.id
    })
  } catch (error) {
    console.error('Update game state error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}