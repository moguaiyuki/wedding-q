import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  // Get current user
  const userIdCookie = cookieStore.get('user_id')
  if (!userIdCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all users and their scores from answers
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name')

  const { data: allAnswers } = await supabase
    .from('answers')
    .select('user_id, is_correct, points_earned')

  if (!allUsers || !allAnswers) {
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
  const currentUserScore = userScores.get(userIdCookie.value) || 0
  
  // If user has no score, they are not ranked yet
  if (currentUserScore === 0) {
    // Count how many users have a score > 0
    const usersWithScore = sortedUsers.filter(u => u.score > 0).length
    if (usersWithScore === 0) {
      // No one has scored yet, so rank is 1
      return NextResponse.json({ 
        rank: 1,
        totalScore: 0
      })
    } else {
      // User is ranked last among participants
      return NextResponse.json({ 
        rank: usersWithScore + 1,
        totalScore: 0
      })
    }
  }
  
  let rank = 1
  let currentRank = 1
  let lastScore = -1

  for (const user of sortedUsers) {
    // Handle ties
    if (user.score !== lastScore) {
      currentRank = rank
    }
    
    if (user.id === userIdCookie.value) {
      break
    }
    
    lastScore = user.score
    rank++
  }

  return NextResponse.json({ 
    rank: currentRank,
    totalScore: currentUserScore
  })
}