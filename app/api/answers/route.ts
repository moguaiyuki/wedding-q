import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { question_id, choice_id, selected_choice_ids, answer_text } = body

    if (!question_id) {
      return NextResponse.json(
        { error: '問題IDが指定されていません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .single()

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'すでに回答済みです' },
        { status: 400 }
      )
    }

    // Get question type to determine scoring logic
    const { data: question } = await supabase
      .from('questions')
      .select('question_type, points')
      .eq('id', question_id)
      .single()

    if (!question) {
      return NextResponse.json(
        { error: '問題が見つかりません' },
        { status: 404 }
      )
    }

    let is_correct = false
    let points_earned = 0

    // Scoring logic for multiple_answer type
    if (question.question_type === 'multiple_answer' && selected_choice_ids && selected_choice_ids.length > 0) {
      // Get all choices for this question
      const { data: allChoices } = await supabase
        .from('choices')
        .select('id, is_correct, points')
        .eq('question_id', question_id)

      if (!allChoices) {
        return NextResponse.json(
          { error: '選択肢の取得に失敗しました' },
          { status: 500 }
        )
      }

      // Calculate points for selected choices
      let total_points = 0
      const selectedChoicesData = allChoices.filter(c => selected_choice_ids.includes(c.id))

      for (const choice of selectedChoicesData) {
        if (choice.is_correct) {
          // Correct choice: add points
          total_points += choice.points
        } else {
          // Incorrect choice: subtract points (points should be negative)
          total_points += choice.points
        }
      }

      // Check if all correct choices were selected and no incorrect ones
      const correctChoiceIds = allChoices.filter(c => c.is_correct).map(c => c.id)
      const allCorrectSelected = correctChoiceIds.every(id => selected_choice_ids.includes(id))
      const noIncorrectSelected = selectedChoicesData.every(c => c.is_correct)

      is_correct = allCorrectSelected && noIncorrectSelected
      points_earned = Math.max(0, total_points) // Never give negative points
    }
    // Scoring logic for multiple_choice (single answer)
    else if (question.question_type === 'multiple_choice' && choice_id) {
      const { data: choice } = await supabase
        .from('choices')
        .select('is_correct')
        .eq('id', choice_id)
        .single()

      if (choice && choice.is_correct) {
        is_correct = true
        points_earned = question?.points || 10
      }
    }
    // Free text questions don't have automatic scoring
    // is_correct and points_earned remain false/0

    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        user_id: user.id,
        question_id,
        choice_id,
        selected_choice_ids: selected_choice_ids ? JSON.stringify(selected_choice_ids) : null,
        answer_text,
        is_correct,
        points_earned,
        answered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Answer creation error:', error)
      return NextResponse.json(
        { error: '回答の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      is_correct,
      points_earned
    })
  } catch (error) {
    console.error('Answer API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const questionId = searchParams.get('question_id')
    const countOnly = searchParams.get('count') === 'true'
    
    const supabase = await createClient()

    // If count is requested, return count of answers for the question
    if (countOnly && questionId) {
      const { count, error } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId)

      if (error) {
        console.error('Count answers error:', error)
        return NextResponse.json(
          { error: '回答数の取得に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({ count: count || 0 })
    }

    // Otherwise, get answers for the current user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    if (questionId) {
      const { data: answer, error } = await supabase
        .from('answers')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single()

      if (error) {
        // PGRST116 = row not found (未回答の場合)
        if (error.code === 'PGRST116') {
          return NextResponse.json(null)
        }
        
        console.error('Get answer error:', error)
        return NextResponse.json(
          { error: '回答の取得に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json(answer)
    } else {
      const { data: answers, error } = await supabase
        .from('answers')
        .select('*')
        .eq('user_id', user.id)
        .order('answered_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: '回答履歴の取得に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json(answers || [])
    }
  } catch (error) {
    console.error('Get answers error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}