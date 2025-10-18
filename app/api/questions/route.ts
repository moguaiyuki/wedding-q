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
      choices,
      explanation_text,
      explanation_image_url
    } = body

    const supabase = await createClient()

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        question_number,
        question_text,
        question_type,
        image_url,
        points: points || 10,
        explanation_text,
        explanation_image_url
      })
      .select()
      .single()

    if (questionError) {
      return NextResponse.json(
        { error: '問題の作成に失敗しました' },
        { status: 500 }
      )
    }

    // Create choices for multiple_choice and multiple_answer questions
    if ((question_type === 'multiple_choice' || question_type === 'multiple_answer') && choices && choices.length > 0) {
      const choicesData = choices.map((choice: any, index: number) => ({
        question_id: question.id,
        choice_text: choice.text,
        is_correct: choice.is_correct || false,
        points: choice.points !== undefined ? choice.points : (choice.is_correct ? points || 10 : 0),
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

export async function PUT(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: '管理者権限が必要です' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const questionId = searchParams.get('id')
    
    if (!questionId) {
      return NextResponse.json(
        { error: '問題IDが必要です' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      question_number,
      question_text,
      question_type,
      image_url,
      points,
      choices,
      explanation_text,
      explanation_image_url
    } = body

    const supabase = await createClient()

    // 既存の問題を更新
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update({
        question_number,
        question_text,
        question_type,
        image_url,
        points: points || 10,
        explanation_text,
        explanation_image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()
      .single()

    if (questionError) {
      return NextResponse.json(
        { error: '問題の更新に失敗しました' },
        { status: 500 }
      )
    }

    // Update choices for multiple_choice and multiple_answer questions
    if (question_type === 'multiple_choice' || question_type === 'multiple_answer') {
      if (choices && choices.length > 0) {
        // 既存の選択肢を取得
        const { data: existingChoices } = await supabase
          .from('choices')
          .select('*')
          .eq('question_id', questionId)
          .order('display_order', { ascending: true })

        // 各選択肢を更新または作成
        for (let i = 0; i < choices.length; i++) {
          const choice = choices[i]
          const choiceData = {
            question_id: questionId,
            choice_text: choice.text,
            is_correct: choice.is_correct || false,
            points: choice.points !== undefined ? choice.points : (choice.is_correct ? points || 10 : 0),
            display_order: i + 1
          }

          if (existingChoices && existingChoices[i]) {
            // 既存の選択肢を更新（IDを維持）
            await supabase
              .from('choices')
              .update(choiceData)
              .eq('id', existingChoices[i].id)
          } else {
            // 新しい選択肢を作成
            await supabase
              .from('choices')
              .insert(choiceData)
          }
        }

        // 余分な選択肢を削除（選択肢数が減った場合）
        if (existingChoices && existingChoices.length > choices.length) {
          const idsToDelete = existingChoices
            .slice(choices.length)
            .map(c => c.id)

          await supabase
            .from('choices')
            .delete()
            .in('id', idsToDelete)
        }
      }
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('Question update error:', error)
    return NextResponse.json(
      { error: '問題の更新中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: '管理者権限が必要です' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const questionId = searchParams.get('id')
    
    console.log('DELETE request - questionId:', questionId) // デバッグログ追加
    
    if (!questionId) {
      return NextResponse.json(
        { error: '問題IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 問題を削除（関連する選択肢も自動的に削除される）
    const { data, error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
      .select() // 削除されたデータを返すように変更

    console.log('DELETE result - data:', data, 'error:', error) // デバッグログ追加

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: '問題の削除に失敗しました' },
        { status: 500 }
      )
    }

    // 削除されたデータがない場合はエラー
    if (!data || data.length === 0) {
      console.error('No question was deleted with ID:', questionId)
      return NextResponse.json(
        { error: '指定された問題が見つかりませんでした' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (error) {
    console.error('Question deletion error:', error)
    return NextResponse.json(
      { error: '問題の削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
}