'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRealtimeManager } from '@/lib/supabase/realtime'

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
  selected_choice_ids?: string[]
  correct_choice_ids?: string[]
  correct_choice_id?: string
  explanation_text?: string
  explanation_image_url?: string
  question_type?: 'multiple_choice' | 'free_text' | 'multiple_answer'
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
                selected_choice_ids: latestData.answer.selected_choice_ids,
                correct_choice_id: latestData.correct_choice_id,
                correct_choice_ids: latestData.correct_choice_ids,
                explanation_text: latestData.question.explanation_text,
                explanation_image_url: latestData.question.explanation_image_url,
                question_type: latestData.question.question_type,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-pink to-wedding-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-pink mx-auto mb-4"></div>
          <p className="text-gray-600">結果を集計中...</p>
        </div>
      </div>
    )
  }

  const isFinished = gameState?.current_state === 'finished'

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-pink to-wedding-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            {isFinished ? '最終結果' : `第${gameState?.current_question_number}問 結果`}
          </h1>

          {/* 直前の回答結果表示 */}
          {lastAnswer && !isFinished && (
            <>
              {/* 複数回答式以外の場合のみ正解/残念を表示 */}
              {lastAnswer.question_type !== 'multiple_answer' && (
                <div className={`rounded-lg p-6 mb-6 text-center ${
                  lastAnswer.is_correct
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300'
                }`}>
                  <div className="text-5xl mb-3">
                    {lastAnswer.is_correct ? '⭕' : '❌'}
                  </div>
                  <p className={`text-2xl font-bold mb-2 ${
                    lastAnswer.is_correct ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {lastAnswer.is_correct ? '正解！' : '残念...'}
                  </p>
                  {lastAnswer.is_correct && (
                    <p className="text-lg text-green-600">
                      +{lastAnswer.points_earned}ポイント獲得
                    </p>
                  )}
                </div>
              )}

              {/* 複数回答式の場合は獲得ポイントのみ表示 */}
              {lastAnswer.question_type === 'multiple_answer' && (
                <div className="rounded-lg p-6 mb-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
                  <p className="text-xl font-bold text-blue-700 mb-2">
                    獲得ポイント
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {lastAnswer.points_earned}ポイント
                  </p>
                </div>
              )}

              {/* エピソード表示 */}
              {(lastAnswer.explanation_text || lastAnswer.explanation_image_url) && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
                  <h3 className="text-base font-bold mb-2 text-blue-800">💡 エピソード</h3>
                  {lastAnswer.explanation_text && (
                    <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap text-left">
                      {lastAnswer.explanation_text}
                    </p>
                  )}
                  {lastAnswer.explanation_image_url && (
                    <div className="mt-2">
                      <img
                        src={lastAnswer.explanation_image_url}
                        alt="エピソード画像"
                        className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 選択肢の表示 */}
              {lastAnswer.choices && lastAnswer.choices.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 text-gray-800">回答結果</h3>
                  {lastAnswer.question_type === 'multiple_answer' && (
                    <p className="text-sm text-blue-600 mb-3">複数選択式</p>
                  )}
                  <div className="space-y-2">
                    {lastAnswer.choices.map((choice, index) => {
                      const isSelected = lastAnswer.question_type === 'multiple_answer'
                        ? lastAnswer.selected_choice_ids?.includes(choice.id)
                        : choice.id === lastAnswer.selected_choice_id
                      const isCorrect = lastAnswer.question_type === 'multiple_answer'
                        ? lastAnswer.correct_choice_ids?.includes(choice.id)
                        : choice.id === lastAnswer.correct_choice_id

                      return (
                        <div
                          key={choice.id}
                          className={`rounded-lg p-4 border-2 ${
                            isCorrect
                              ? 'bg-green-50 border-green-400'
                              : isSelected
                              ? 'bg-blue-50 border-blue-400'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="font-bold mr-3 text-gray-700">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <span className={`text-sm ${
                                isCorrect || isSelected ? 'font-semibold' : 'font-normal'
                              } ${
                                isCorrect
                                  ? 'text-green-800'
                                  : isSelected
                                  ? 'text-blue-800'
                                  : 'text-gray-700'
                              }`}>
                                {choice.choice_text}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <span className="text-sm font-bold text-blue-600">
                                  あなたの回答
                                </span>
                              )}
                              {isCorrect && (
                                <span className="text-sm font-bold text-green-600 flex items-center">
                                  <span className="text-xl mr-1">✓</span>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">現在のスコア</p>
              <p className="text-4xl font-bold text-blue-600">{totalScore}</p>
              <p className="text-sm text-gray-600 mt-1">ポイント</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">正解数</p>
              <p className="text-4xl font-bold text-green-600">
                {correctCount}/{totalQuestions}
              </p>
              <p className="text-sm text-gray-600 mt-1">問</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">現在の順位</p>
              <p className="text-4xl font-bold text-yellow-600">
                {rank !== null && rank !== undefined ? rank : '-'}
              </p>
              <p className="text-sm text-gray-600 mt-1">位</p>
            </div>
          </div>

          {/* ランキング表 */}
          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">現在のランキング</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((entry, index) => {
                    const rank = getRank(index, leaderboard)
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          rank === 1 ? 'bg-yellow-50 border-yellow-300' :
                          rank === 2 ? 'bg-gray-50 border-gray-300' :
                          rank === 3 ? 'bg-orange-50 border-orange-300' :
                          'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`font-bold mr-3 text-lg ${
                            rank === 1 ? 'text-yellow-700' :
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
                          <span className="text-xs text-gray-600 ml-2 font-medium">正解: {entry.correct_count}問</span>
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
                <div className="animate-pulse bg-wedding-pink rounded-full h-3 w-3"></div>
                <div className="animate-pulse bg-wedding-pink rounded-full h-3 w-3 animation-delay-200"></div>
                <div className="animate-pulse bg-wedding-pink rounded-full h-3 w-3 animation-delay-400"></div>
              </div>
            </div>
          )}

          {isFinished && (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  クイズ終了！
                </p>
                <p className="text-gray-600">
                  ご参加ありがとうございました
                </p>
              </div>

              {correctCount === totalQuestions && (
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-xl font-bold text-yellow-800">
                    🏆 パーフェクト達成！ 🏆
                  </p>
                </div>
              )}
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