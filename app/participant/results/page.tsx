'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRealtimeManager } from '@/lib/supabase/realtime'
import { CheckCircle, XCircle, Lightbulb, Check } from 'lucide-react'

interface UserAnswer {
  question_id: string
  is_correct: boolean
  points_earned: number
  answered_at: string
}

interface LastAnswer {
  is_correct: boolean
  question_number: number
  points_earned: number
  selected_choice_id?: string
  correct_choice_id?: string
  explanation_text?: string
  explanation_image_url?: string
  choices?: Array<{
    id: string
    choice_text: string
    display_order: number
  }>
}

interface GameState {
  current_state: string
  current_question_number: number
}

interface LeaderboardEntry {
  user_id: string
  name: string
  nickname?: string
  total_score: number
  correct_count: number
}

export default function ResultsPage() {
  const router = useRouter()
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [rank, setRank] = useState<number | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [lastAnswer, setLastAnswer] = useState<LastAnswer | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')

  // Helper function to calculate rank with tie handling
  const getRank = (index: number, leaderboardData: LeaderboardEntry[]): number => {
    if (index === 0) return 1

    let rank = 1
    for (let i = 0; i < index; i++) {
      if (leaderboardData[i].total_score !== leaderboardData[i + 1]?.total_score) {
        rank = i + 2
      }
    }
    return rank
  }

  useEffect(() => {
    // First fetch game state, then results
    const init = async () => {
      await fetchUserInfo()
      await fetchGameState()
      await fetchResults()
      await fetchRanking()
      await fetchLeaderboard()
    }
    init()
    
    // Set up realtime subscription for game state changes
    const realtimeManager = getRealtimeManager()
    const unsubscribe = realtimeManager.subscribeToGameState((payload) => {
      console.log('Results page received game state change:', payload)
      fetchGameState()
      fetchResults() // Refresh results when state changes
      fetchRanking() // Refresh ranking
      fetchLeaderboard() // Refresh leaderboard
    })
    
    // Also set up polling as fallback (every 2 seconds)
    const interval = setInterval(() => {
      fetchGameState()
      fetchRanking()
      fetchLeaderboard()
    }, 2000)
    
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (gameState?.current_state === 'accepting_answers' || gameState?.current_state === 'showing_question') {
      router.push('/participant/quiz')
    } else if (gameState?.current_state === 'waiting') {
      router.push('/participant/waiting')
    }
  }, [gameState?.current_state, router])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setUserName(data.nickname || data.name)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/answers')
      if (response.ok) {
        const answers: UserAnswer[] = await response.json()

        const total = answers.reduce((sum, answer) => sum + answer.points_earned, 0)
        const correct = answers.filter(answer => answer.is_correct).length

        setTotalScore(total)
        setCorrectCount(correct)
        setTotalQuestions(answers.length)

        // 最新の回答の詳細を取得
        if (answers.length > 0) {
          const latestResponse = await fetch('/api/answers/latest')
          if (latestResponse.ok) {
            const latestData = await latestResponse.json()
            if (latestData) {
              setLastAnswer({
                is_correct: latestData.answer.is_correct,
                question_number: latestData.question.question_number,
                points_earned: latestData.answer.points_earned,
                selected_choice_id: latestData.answer.selected_choice_id,
                correct_choice_id: latestData.correct_choice_id,
                explanation_text: latestData.question.explanation_text,
                explanation_image_url: latestData.question.explanation_image_url,
                choices: latestData.choices
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGameState = async () => {
    try {
      const response = await fetch('/api/game-state')
      if (response.ok) {
        const data = await response.json()
        setGameState(data)
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error)
    }
  }

  const fetchRanking = async () => {
    try {
      const response = await fetch('/api/stats/ranking')
      if (response.ok) {
        const data = await response.json()
        console.log('Ranking data:', data)
        setRank(data.rank)
      } else {
        console.error('Failed to fetch ranking, status:', response.status)
        const errorData = await response.json()
        console.error('Error data:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch ranking:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/stats/leaderboard?limit=10')
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">結果を集計中...</p>
        </div>
      </div>
    )
  }

  const isFinished = gameState?.current_state === 'finished'

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100 p-4 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute top-10 right-16 w-8 h-8 text-wedding-gold-200 animate-pulse">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
        </svg>
      </div>
      <div className="absolute bottom-32 left-24 w-6 h-6 text-wedding-rose-200 animate-pulse animation-delay-200">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
        </svg>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {isFinished && rank !== null && (
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {userName}さんの順位は{rank}位でした！
              </h1>
            </div>
          )}

          {!isFinished && (
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
              第{gameState?.current_question_number}問 結果
            </h1>
          )}

          {/* 直前の回答結果表示 */}
          {lastAnswer && !isFinished && (
            <>
              <div className="mb-6 text-center">
                <p className={`text-2xl font-bold mb-2 ${
                  lastAnswer.is_correct ? 'text-wedding-pink-700' : 'text-red-700'
                }`}>
                  {lastAnswer.is_correct ? '正解！' : '残念...'}
                </p>
                {lastAnswer.is_correct && (
                  <p className="text-lg text-wedding-pink-600 font-semibold">
                    +{lastAnswer.points_earned}ポイント獲得
                  </p>
                )}
              </div>

              {/* 選択肢の表示 */}
              {lastAnswer.choices && lastAnswer.choices.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 text-gray-800">回答結果</h3>
                  <div className="space-y-2">
                    {lastAnswer.choices.map((choice, index) => {
                      const isSelected = choice.id === lastAnswer.selected_choice_id
                      const isCorrect = choice.id === lastAnswer.correct_choice_id

                      return (
                        <div
                          key={choice.id}
                          className={`rounded-2xl p-4 border-2 ${
                            isCorrect
                              ? 'bg-wedding-pink-100 border-wedding-pink-400'
                              : isSelected
                              ? 'bg-red-200 border-red-600'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="font-bold mr-3 text-gray-700">
                                {index + 1}.
                              </span>
                              <span className={`text-sm ${
                                isCorrect || isSelected ? 'font-semibold' : 'font-normal'
                              } ${
                                isCorrect
                                  ? 'text-gray-900'
                                  : isSelected
                                  ? 'text-red-900'
                                  : 'text-gray-700'
                              }`}>
                                {choice.choice_text}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <span className="text-sm font-bold text-red-700">
                                  あなたの回答
                                </span>
                              )}
                              {isCorrect && (
                                <span className="flex items-center gap-1 text-sm font-bold text-wedding-pink-700">
                                  <Check className="w-5 h-5" strokeWidth={3} />
                                  正解
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full px-6 py-3 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600">
                現在のスコア: <span className="font-bold text-gray-900 text-lg ml-1">{totalScore}点</span>
              </p>
            </div>
          </div>

          {/* ランキング表 */}
          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">現在のランキング</h2>
              <div className="bg-wedding-cream-100 rounded-2xl p-4">
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((entry, index) => {
                    const rank = getRank(index, leaderboard)
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex justify-between items-center p-3 rounded-2xl border-2 ${
                          rank === 1 ? 'bg-wedding-gold-100 border-wedding-gold-300' :
                          rank === 2 ? 'bg-gray-100 border-gray-300' :
                          rank === 3 ? 'bg-orange-100 border-orange-300' :
                          'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`font-bold mr-3 text-lg ${
                            rank === 1 ? 'text-gray-900' :
                            rank === 2 ? 'text-gray-700' :
                            rank === 3 ? 'text-orange-700' :
                            'text-gray-700'
                          }`}>
                            {rank}位
                          </span>
                          <span className="text-sm text-gray-800 font-medium">
                            {entry.nickname || entry.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-gray-900">{entry.total_score}点</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {!isFinished && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">次の問題をお待ちください</p>
              <div className="inline-flex items-center space-x-2">
                <div className="animate-pulse bg-wedding-pink-500 rounded-full h-3 w-3"></div>
                <div className="animate-pulse bg-wedding-pink-500 rounded-full h-3 w-3 animation-delay-200"></div>
                <div className="animate-pulse bg-wedding-gold-300 rounded-full h-3 w-3 animation-delay-400"></div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  )
}