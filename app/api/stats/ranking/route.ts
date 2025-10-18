import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const supabase = await createClient()

  // Get current user
  const user = await getCurrentUser()
  console.log('[Ranking API] User ID:', user?.id)

  if (!user) {
    console.log('[Ranking API] No user found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all users and their scores from answers
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, name')

  const { data: allAnswers, error: answersError } = await supabase
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

  console.log('[Ranking API] Users count:', allUsers?.length, 'Error:', usersError)
  console.log('[Ranking API] Answers count:', allAnswers?.length, 'Error:', answersError)

  if (!allUsers || !allAnswers) {
    console.log('[Ranking API] Data not found')
    return NextResponse.json({ error: 'Data not found' }, { status: 404 })
  }

  // Get all choices for all questions
  const { data: allChoices, error: choicesError } = await supabase
    .from('choices')
    .select('id, question_id, is_correct, points')

  if (choicesError) {
    console.error('[Ranking API] Fetch choices error:', choicesError)
    return NextResponse.json({ error: 'Failed to fetch choices' }, { status: 500 })
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
  const userScores = new Map<string, number>()

  allAnswers.forEach(answer => {
    if (!answer.user_id) return

    const currentScore = userScores.get(answer.user_id) || 0
    const questionType = (answer.questions as any)?.question_type

    let points = answer.points_earned || 0

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

      points = Math.max(0, total_points)
    }

    userScores.set(answer.user_id, currentScore + points)
  })

  // Create sorted list of users by score
  const sortedUsers = allUsers.map(user => ({
    id: user.id,
    score: userScores.get(user.id) || 0
  })).sort((a, b) => b.score - a.score)

  // Find current user's rank
  const currentUserScore = userScores.get(user.id) || 0
  console.log('[Ranking API] Current user score:', currentUserScore)
  console.log('[Ranking API] Total users:', sortedUsers.length)

  let rank = 1
  let currentRank = 1
  let lastScore = -1

  for (const sortedUser of sortedUsers) {
    // Handle ties - if score is different from last, update currentRank
    if (sortedUser.score !== lastScore) {
      currentRank = rank
      lastScore = sortedUser.score
    }

    // Found current user
    if (sortedUser.id === user.id) {
      console.log('[Ranking API] Found user at rank:', currentRank)
      return NextResponse.json({
        rank: currentRank,
        totalScore: currentUserScore
      })
    }

    rank++
  }

  // User not found in sorted list (shouldn't happen)
  console.log('[Ranking API] User not found in sorted list')
  return NextResponse.json({
    rank: sortedUsers.length + 1,
    totalScore: currentUserScore
  })
}