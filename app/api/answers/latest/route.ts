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
          image_url,
          explanation_text,
          explanation_image_url
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

    // Find the correct choices (can be multiple for multiple_answer)
    const correctChoices = choices?.filter(c => c.is_correct) || []
    const correctChoice = correctChoices[0] // For backward compatibility

    // Handle both single and multiple answer types
    const questionType = (answer.questions as any)?.question_type
    const selectedChoiceIds = answer.selected_choice_ids
      ? (typeof answer.selected_choice_ids === 'string'
          ? JSON.parse(answer.selected_choice_ids)
          : answer.selected_choice_ids)
      : null

    // Recalculate points for multiple_answer questions using current choice points
    let recalculatedPoints = answer.points_earned
    let recalculatedIsCorrect = answer.is_correct

    if (questionType === 'multiple_answer' && selectedChoiceIds && selectedChoiceIds.length > 0) {
      let total_points = 0
      const selectedChoicesData = choices?.filter(c => selectedChoiceIds.includes(c.id)) || []

      for (const choice of selectedChoicesData) {
        total_points += choice.points
      }

      // Check if all correct choices were selected and no incorrect ones
      const correctChoiceIds = correctChoices.map(c => c.id)
      const allCorrectSelected = correctChoiceIds.every(id => selectedChoiceIds.includes(id))
      const noIncorrectSelected = selectedChoicesData.every(c => c.is_correct)

      recalculatedIsCorrect = allCorrectSelected && noIncorrectSelected
      recalculatedPoints = Math.max(0, total_points)
    }

    return NextResponse.json({
      answer: {
        is_correct: recalculatedIsCorrect,
        points_earned: recalculatedPoints,
        selected_choice_id: answer.choice_id,
        selected_choice_ids: selectedChoiceIds,
        answered_at: answer.answered_at
      },
      question: answer.questions,
      choices: choices || [],
      correct_choice_id: correctChoice?.id || null,
      correct_choice_ids: correctChoices.map(c => c.id)
    })
  } catch (error) {
    console.error('Get latest answer API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
