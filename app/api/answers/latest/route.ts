import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get the latest answer with question and choices
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select(`
        *,
        questions:question_id (
          question_number,
          question_text,
          question_type,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('answered_at', { ascending: false })
      .limit(1)
      .single()

    if (answerError) {
      if (answerError.code === 'PGRST116') {
        return NextResponse.json(null)
      }
      console.error('Get latest answer error:', answerError)
      return NextResponse.json(
        { error: '回答の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!answer) {
      return NextResponse.json(null)
    }

    // Get all choices for the question
    const { data: choices, error: choicesError } = await supabase
      .from('choices')
      .select('*')
      .eq('question_id', answer.question_id)
      .order('display_order', { ascending: true })

    if (choicesError) {
      console.error('Get choices error:', choicesError)
      return NextResponse.json(
        { error: '選択肢の取得に失敗しました' },
        { status: 500 }
      )
    }

    // Find the correct choice
    const correctChoice = choices?.find(c => c.is_correct)

    return NextResponse.json({
      answer: {
        is_correct: answer.is_correct,
        points_earned: answer.points_earned,
        selected_choice_id: answer.choice_id,
        answered_at: answer.answered_at
      },
      question: answer.questions,
      choices: choices || [],
      correct_choice_id: correctChoice?.id || null
    })
  } catch (error) {
    console.error('Get latest answer API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
