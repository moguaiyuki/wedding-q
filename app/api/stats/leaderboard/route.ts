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

    // Get all answers with their earned points
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        user_id,
        is_correct,
        points_earned
      `)

    if (answersError) {
      console.error('Fetch answers error:', answersError)
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    // Calculate scores for each user
    const userScores = new Map<string, { total_score: number; correct_count: number }>()

    answers?.forEach(answer => {
      if (!answer.user_id) return
      
      const score = userScores.get(answer.user_id) || { total_score: 0, correct_count: 0 }
      
      // Add points if answer is correct
      if (answer.is_correct) {
        score.total_score += answer.points_earned || 0
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