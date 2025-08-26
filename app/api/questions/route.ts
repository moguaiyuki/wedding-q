import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const questionId = searchParams.get('id')
    const questionNumber = searchParams.get('number')
    
    const supabase = await createClient()

    if (questionId) {
      const { data: question, error } = await supabase
        .from('questions')
        .select(`
          *,
          choices (*)
        `)
        .eq('id', questionId)
        .single()

      if (error) {
        return NextResponse.json(
          { error: '問題の取得に失敗しました' },
          { status: 404 }
        )
      }

      return NextResponse.json(question)
    } else if (questionNumber) {
      const { data: question, error } = await supabase
        .from('questions')
        .select(`
          *,
          choices (*)
        `)
        .eq('question_number', parseInt(questionNumber))
        .single()

      if (error) {
        return NextResponse.json(
          { error: '問題の取得に失敗しました' },
          { status: 404 }
        )
      }

      return NextResponse.json(question)
    } else {
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          *,
          choices (*)
        `)
        .order('question_number', { ascending: true })

      if (error) {
        return NextResponse.json(
          { error: '問題一覧の取得に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json(questions || [])
    }
  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      question_number,
      question_text,
      question_type,
      image_url,
      points,
      choices
    } = body

    const supabase = await createClient()

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        question_number,
        question_text,
        question_type,
        image_url,
        points: points || 10
      })
      .select()
      .single()

    if (questionError) {
      return NextResponse.json(
        { error: '問題の作成に失敗しました' },
        { status: 500 }
      )
    }

    if (question_type === 'multiple_choice' && choices && choices.length > 0) {
      const choicesData = choices.map((choice: any, index: number) => ({
        question_id: question.id,
        choice_text: choice.text,
        is_correct: choice.is_correct || false,
        display_order: index + 1
      }))

      const { error: choicesError } = await supabase
        .from('choices')
        .insert(choicesData)

      if (choicesError) {
        console.error('Choices creation error:', choicesError)
      }
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('Question creation error:', error)
    return NextResponse.json(
      { error: '問題の作成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}