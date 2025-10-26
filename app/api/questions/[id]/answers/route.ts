import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id

    if (!questionId) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get question details
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, question_number, question_text, question_type')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      console.error('Fetch question error:', questionError)
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Get all answers for the question with user info
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        id,
        choice_id,
        answer_text,
        is_correct,
        answered_at,
        users (
          id,
          name,
          nickname
        )
      `)
      .eq('question_id', questionId)

    if (answersError) {
      console.error('Fetch answers error:', answersError)
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    // Get choices for the question
    const { data: choices, error: choicesError } = await supabase
      .from('choices')
      .select('id, choice_text, is_correct, display_order')
      .eq('question_id', questionId)
      .order('display_order')

    if (choicesError) {
      console.error('Fetch choices error:', choicesError)
      return NextResponse.json(
        { error: 'Failed to fetch choices' },
        { status: 500 }
      )
    }

    // Calculate statistics with user names
    const total = answers?.length || 0
    const correctCount = answers?.filter(a => a.is_correct).length || 0

    // Separate answers with null choice_id
    const answersWithChoice = answers?.filter(a => a.choice_id !== null) || []
    const answersWithoutChoice = answers?.filter(a => a.choice_id === null) || []

    const choiceStats = choices?.map(choice => {
      const choiceAnswers = answersWithChoice.filter(a => a.choice_id === choice.id)
      const count = choiceAnswers.length
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0

      // Extract user names (nickname or name)
      const respondents = choiceAnswers.map(answer => ({
        name: (answer.users as any)?.nickname || (answer.users as any)?.name || '不明',
        answered_at: answer.answered_at
      }))

      return {
        choice_id: choice.id,
        choice_text: choice.choice_text,
        count,
        percentage,
        is_correct: choice.is_correct,
        respondents
      }
    }) || []

    // Handle answers with null choice_id (data loss due to question edit)
    const nullChoiceAnswers = {
      correct: answersWithoutChoice
        .filter(a => a.is_correct)
        .map(answer => ({
          name: (answer.users as any)?.nickname || (answer.users as any)?.name || '不明',
          answered_at: answer.answered_at
        })),
      incorrect: answersWithoutChoice
        .filter(a => !a.is_correct)
        .map(answer => ({
          name: (answer.users as any)?.nickname || (answer.users as any)?.name || '不明',
          answered_at: answer.answered_at
        }))
    }

    return NextResponse.json({
      question: {
        id: question.id,
        question_number: question.question_number,
        question_text: question.question_text,
        question_type: question.question_type
      },
      total_answers: total,
      correct_answers: correctCount,
      choices: choiceStats,
      null_choice_answers: nullChoiceAnswers
    })
  } catch (error) {
    console.error('Question answers API error:', error)
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    )
  }
}
