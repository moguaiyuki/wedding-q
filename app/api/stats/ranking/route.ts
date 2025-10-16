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
    .select('user_id, is_correct, points_earned')

  console.log('[Ranking API] Users count:', allUsers?.length, 'Error:', usersError)
  console.log('[Ranking API] Answers count:', allAnswers?.length, 'Error:', answersError)

  if (!allUsers || !allAnswers) {
    console.log('[Ranking API] Data not found')
    return NextResponse.json({ error: 'Data not found' }, { status: 404 })
  }

  // Calculate scores for each user
  const userScores = new Map<string, number>()
  
  allAnswers.forEach(answer => {
    if (!answer.user_id) return
    const currentScore = userScores.get(answer.user_id) || 0
    if (answer.is_correct) {
      userScores.set(answer.user_id, currentScore + (answer.points_earned || 0))
    }
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