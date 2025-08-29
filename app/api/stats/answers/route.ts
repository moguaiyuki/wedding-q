import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('question_id')

    if (!questionId) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get all answers for the question with correctness info
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('choice_id, is_correct')
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
      .select('id, choice_text, is_correct')
      .eq('question_id', questionId)

    if (choicesError) {
      console.error('Fetch choices error:', choicesError)
      return NextResponse.json(
        { error: 'Failed to fetch choices' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const total = answers?.length || 0
    const correctCount = answers?.filter(a => a.is_correct).length || 0
    const stats = choices?.map(choice => {
      const count = answers?.filter(a => a.choice_id === choice.id).length || 0
      const percentage = total > 0 ? (count / total) * 100 : 0
      return {
        choice_id: choice.id,
        choice_text: choice.choice_text,
        count,
        percentage,
        is_correct: choice.is_correct
      }
    }) || []

    return NextResponse.json({
      stats,
      total,
      total_count: total,
      correct_count: correctCount
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    )
  }
}