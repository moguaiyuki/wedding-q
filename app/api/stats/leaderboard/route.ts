import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createClient()

    // Get all users with nickname and group info
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, nickname, group_type')

    if (usersError) {
      console.error('Fetch users error:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get all answers with their question and choice information
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        user_id,
        question_id,
        choice_id,
        selected_choice_ids,
        is_correct,
        points_earned,
        questions:question_id (
          question_type,
          points
        )
      `)

    if (answersError) {
      console.error('Fetch answers error:', answersError)
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    // Get all choices for all questions
    const { data: allChoices, error: choicesError } = await supabase
      .from('choices')
      .select('id, question_id, is_correct, points')

    if (choicesError) {
      console.error('Fetch choices error:', choicesError)
      return NextResponse.json(
        { error: 'Failed to fetch choices' },
        { status: 500 }
      )
    }

    // Build a map for quick lookup of choices by question_id
    const choicesByQuestion = new Map<string, any[]>()
    allChoices?.forEach(choice => {
      if (!choicesByQuestion.has(choice.question_id)) {
        choicesByQuestion.set(choice.question_id, [])
      }
      choicesByQuestion.get(choice.question_id)?.push(choice)
    })

    // Calculate scores for each user with recalculated points for multiple_answer
    const userScores = new Map<string, { total_score: number; correct_count: number }>()

    answers?.forEach(answer => {
      if (!answer.user_id) return

      const score = userScores.get(answer.user_id) || { total_score: 0, correct_count: 0 }
      const questionType = (answer.questions as any)?.question_type

      let points = answer.points_earned || 0
      let isCorrect = answer.is_correct

      // Recalculate for multiple_answer questions
      if (questionType === 'multiple_answer' && answer.selected_choice_ids) {
        const selectedIds = typeof answer.selected_choice_ids === 'string'
          ? JSON.parse(answer.selected_choice_ids)
          : answer.selected_choice_ids

        const questionChoices = choicesByQuestion.get(answer.question_id) || []
        const selectedChoices = questionChoices.filter(c => selectedIds.includes(c.id))

        let total_points = 0
        for (const choice of selectedChoices) {
          total_points += choice.points
        }

        // Check if all correct choices were selected and no incorrect ones
        const correctChoiceIds = questionChoices.filter(c => c.is_correct).map(c => c.id)
        const allCorrectSelected = correctChoiceIds.every(id => selectedIds.includes(id))
        const noIncorrectSelected = selectedChoices.every(c => c.is_correct)

        isCorrect = allCorrectSelected && noIncorrectSelected
        points = Math.max(0, total_points)
      }

      // Add points to total score
      score.total_score += points

      // Count correct answers
      if (isCorrect) {
        score.correct_count += 1
      }

      userScores.set(answer.user_id, score)
    })

    // Create leaderboard with nickname and group info
    const leaderboard = users?.map(user => ({
      user_id: user.id,
      name: user.name,
      nickname: user.nickname,
      group_type: user.group_type,
      total_score: userScores.get(user.id)?.total_score || 0,
      correct_count: userScores.get(user.id)?.correct_count || 0
    })) || []

    // Sort by total score (descending)
    leaderboard.sort((a, b) => b.total_score - a.total_score)

    // Return top N users
    return NextResponse.json(leaderboard.slice(0, limit))
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    )
  }
}