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

    // Get all answers for the question
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('choice_id')
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
      .select('id, choice_text')
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
    const stats = choices?.map(choice => {
      const count = answers?.filter(a => a.choice_id === choice.id).length || 0
      const percentage = total > 0 ? (count / total) * 100 : 0
      return {
        choice_id: choice.id,
        choice_text: choice.choice_text,
        count,
        percentage
      }
    }) || []

    return NextResponse.json({
      stats,
      total
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    )
  }
}