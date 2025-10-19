'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getRealtimeManager } from '@/lib/supabase/realtime'

interface GameState {
  id: string
  current_state: 'waiting' | 'showing_question' | 'accepting_answers' | 'showing_results' | 'finished'
  current_question_id: string | null
  current_question_number: number
}

interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: 'multiple_choice' | 'free_text'
  image_url?: string
  points: number
  explanation_text?: string
  explanation_image_url?: string
  choices?: Array<{
    id: string
    choice_text: string
    display_order: number
    is_correct: boolean
  }>
}

interface AnswerStats {
  choice_id: string
  count: number
  percentage: number
}

interface LeaderboardEntry {
  user_id: string
  name: string
  nickname?: string
  total_score: number
  correct_count: number
}

export default function PresentationPage() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [answerStats, setAnswerStats] = useState<AnswerStats[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

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
    fetchGameState()
    fetchParticipantCount()
    
    // Set up realtime subscriptions
    const realtimeManager = getRealtimeManager()
    
    // Subscribe to game state changes
    const unsubscribeGameState = realtimeManager.subscribeToGameState((payload) => {
      console.log('Presentation received game state change:', payload)
      fetchGameState()
      // finishedの時はleaderboardも更新
      if (payload.new?.current_state === 'finished') {
        fetchLeaderboard()
      }
    })
    
    // Subscribe to participant count changes
    const unsubscribeParticipants = realtimeManager.subscribeToParticipants((count) => {
      setParticipantCount(count)
    })
    
    // Polling as fallback (every 2 seconds)
    const interval = setInterval(() => {
      fetchGameState()
      fetchParticipantCount()
    }, 2000)
    
    return () => {
      unsubscribeGameState()
      unsubscribeParticipants()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (gameState?.current_question_id) {
      fetchQuestion(gameState.current_question_id)

      if (gameState.current_state === 'showing_results') {
        fetchAnswerStats(gameState.current_question_id)
        fetchLeaderboard()
      }
    } else if (gameState?.current_state === 'finished') {
      // finished状態のときはleaderboardを取得
      fetchLeaderboard()
    }
  }, [gameState?.current_question_id, gameState?.current_state])


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

  const fetchQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions?id=${questionId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentQuestion(data)
      }
    } catch (error) {
      console.error('Failed to fetch question:', error)
    }
  }

  const fetchParticipantCount = async () => {
    try {
      const response = await fetch('/api/stats/participants')
      if (response.ok) {
        const data = await response.json()
        setParticipantCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch participant count:', error)
    }
  }

  const fetchAnswerStats = async (questionId: string) => {
    try {
      const response = await fetch(`/api/stats/answers?question_id=${questionId}`)
      if (response.ok) {
        const data = await response.json()
        setAnswerStats(data.stats || [])
        setAnswerCount(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch answer stats:', error)
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

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-quiz-teal-500 mx-auto mb-4"></div>
          <p className="text-2xl text-gray-600">接続中...</p>
        </div>
      </div>
    )
  }

  // Waiting state
  if (gameState.current_state === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100">
        <div className="text-center">
          <h1 className="text-7xl font-bold mb-8 text-gray-800 font-serif">
            結婚式クイズ
          </h1>
          <div className="bg-white rounded-3xl shadow-2xl p-16 mb-8 max-w-4xl mx-auto">
            <p className="text-4xl mb-6 text-gray-700 font-semibold">まもなく開始します</p>
            <p className="text-7xl font-bold text-quiz-teal-600 mb-6">
              {participantCount}名
            </p>
            <p className="text-xl text-gray-600">
              参加中
            </p>
            <div className="mt-8 text-2xl text-gray-600">
              QRコードを読み取って参加してください
            </div>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="w-5 h-5 bg-quiz-teal-500 rounded-full"></div>
              <div className="w-5 h-5 bg-quiz-coral-500 rounded-full animation-delay-200"></div>
              <div className="w-5 h-5 bg-quiz-yellow-300 rounded-full animation-delay-400"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  // Showing question
  if (gameState.current_state === 'showing_question' && currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100 p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-5xl w-full">
          <div className="text-center">
            <div className="bg-quiz-teal-500 text-white px-8 py-3 rounded-full text-2xl font-bold shadow-lg inline-block mb-8">
              第{currentQuestion.question_number}問
            </div>
            <p className="text-4xl mb-8 text-gray-800 font-bold leading-relaxed">
              {currentQuestion.question_text}
            </p>
            {currentQuestion.image_url && (
              <div className="mb-8">
                <img 
                  src={currentQuestion.image_url} 
                  alt="問題画像" 
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.choices && (
              <div className="mt-8 space-y-4 max-w-3xl mx-auto">
                {currentQuestion.choices.map((choice, index) => (
                  <div key={choice.id} className="bg-quiz-beige-100 rounded-2xl p-6 text-left border-2 border-gray-200">
                    <span className="text-2xl font-semibold text-gray-800">
                      {String.fromCharCode(65 + index)}. {choice.choice_text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-10 animate-pulse">
              <p className="text-3xl text-gray-600 font-semibold">まもなく回答受付開始...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Accepting answers
  if (gameState.current_state === 'accepting_answers' && currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100 p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-5xl w-full">
          <div className="text-center">
            <div className="bg-quiz-teal-500 text-white px-8 py-3 rounded-full text-2xl font-bold shadow-lg inline-block mb-8">
              第{currentQuestion.question_number}問
            </div>
            <p className="text-4xl mb-8 text-gray-800 font-bold leading-relaxed">
              {currentQuestion.question_text}
            </p>
            {currentQuestion.image_url && (
              <div className="mb-8">
                <img
                  src={currentQuestion.image_url}
                  alt="問題画像"
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.choices && (
              <div className="mt-8 space-y-4 max-w-3xl mx-auto">
                {currentQuestion.choices.map((choice, index) => (
                  <div key={choice.id} className="bg-quiz-beige-100 rounded-2xl p-6 text-left border-2 border-gray-200">
                    <span className="text-2xl font-semibold text-gray-800">
                      {String.fromCharCode(65 + index)}. {choice.choice_text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-10 bg-gradient-to-r from-quiz-teal-500 to-quiz-teal-600 rounded-2xl p-8 shadow-lg">
              <p className="text-4xl font-bold text-white animate-pulse">
                📝 回答受付中
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Showing results
  if (gameState.current_state === 'showing_results' && currentQuestion) {
    const correctChoice = currentQuestion.choices?.find(c => c.is_correct)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100 p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-6xl w-full">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-8 text-gray-800 font-serif">
              第{currentQuestion.question_number}問 結果発表
            </h2>
            {correctChoice && (
              <div className="bg-gradient-to-br from-quiz-green-100 to-quiz-green-200 rounded-2xl p-8 mb-8 border-2 border-green-400">
                <p className="text-3xl text-gray-700 mb-2 font-semibold">✓ 正解</p>
                <p className="text-5xl font-bold text-green-700">
                  {correctChoice.choice_text}
                </p>
              </div>
            )}

            {/* エピソード表示 */}
            {(currentQuestion.explanation_text || currentQuestion.explanation_image_url) && (
              <div className="bg-quiz-blue-100 rounded-2xl p-8 mb-8 border-2 border-quiz-blue-300">
                <h3 className="text-3xl font-bold mb-4 text-blue-800">💡 エピソード</h3>
                {currentQuestion.explanation_text && (
                  <p className="text-lg text-gray-800 mb-4 whitespace-pre-wrap text-left">
                    {currentQuestion.explanation_text}
                  </p>
                )}
                {currentQuestion.explanation_image_url && (
                  <div className="mt-4">
                    <img
                      src={currentQuestion.explanation_image_url}
                      alt="エピソード画像"
                      className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}
              </div>
            )}
            {currentQuestion.question_type === 'multiple_choice' && answerStats.length > 0 && (
              <div className="space-y-4 mb-8">
                {currentQuestion.choices?.map((choice) => {
                  const stat = answerStats.find(s => s.choice_id === choice.id)
                  const percentage = stat ? stat.percentage : 0
                  const isCorrect = choice.is_correct
                  return (
                    <div
                      key={choice.id}
                      className={`relative rounded-2xl overflow-hidden ${
                        isCorrect ? 'bg-quiz-green-100' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute inset-0 ${
                          isCorrect ? 'bg-quiz-green-300' : 'bg-gray-300'
                        } opacity-40`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative p-6 flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-800">
                          {choice.choice_text}
                          {isCorrect && ' ✓'}
                        </span>
                        <div className="text-right">
                          <span className="text-3xl font-bold block text-gray-900">{stat?.count || 0}名</span>
                          <span className="text-xl text-gray-700 font-semibold">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {leaderboard.length > 0 && (
              <div className="mt-8">
                <h3 className="text-3xl font-bold mb-6 text-gray-800">上位ランキング</h3>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => {
                    const rank = getRank(index, leaderboard)
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex justify-between items-center rounded-2xl p-6 ${
                          rank === 1 ? 'bg-gradient-to-r from-quiz-yellow-200 to-quiz-yellow-300' :
                          rank === 2 ? 'bg-gray-100' :
                          rank === 3 ? 'bg-orange-100' :
                          'bg-quiz-beige-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`text-3xl font-bold mr-6 ${
                            rank === 1 ? 'text-yellow-700' :
                            rank === 2 ? 'text-gray-700' :
                            rank === 3 ? 'text-orange-700' :
                            'text-gray-700'
                          }`}>
                            {rank}位
                          </span>
                          <span className="text-2xl font-semibold text-gray-800">{entry.nickname || entry.name}</span>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{entry.total_score}点</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Finished state
  if (gameState.current_state === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100 p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-16 max-w-6xl w-full">
          <div className="text-center">
            <div className="text-8xl mb-6">🎉</div>
            <h1 className="text-7xl font-bold mb-6 text-quiz-coral-500 font-serif">
              Great job!
            </h1>
            <p className="text-4xl mb-12 text-gray-700 font-semibold">
              ご参加ありがとうございました
            </p>
            {leaderboard.length > 0 && (
              <div className="mt-8">
                <h2 className="text-5xl font-bold mb-8 text-gray-800 font-serif">最終ランキング</h2>
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => {
                    const rank = getRank(index, leaderboard)
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex justify-between items-center rounded-3xl p-8 shadow-md ${
                          rank === 1 ? 'bg-gradient-to-r from-quiz-yellow-200 to-quiz-yellow-300 border-4 border-quiz-yellow-400' :
                          rank === 2 ? 'bg-gray-100 border-2 border-gray-300' :
                          rank === 3 ? 'bg-orange-100 border-2 border-orange-300' :
                          'bg-quiz-beige-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`text-5xl font-bold mr-8 ${
                            rank === 1 ? 'text-yellow-700' :
                            rank === 2 ? 'text-gray-700' :
                            rank === 3 ? 'text-orange-700' :
                            'text-gray-700'
                          }`}>
                            {rank}位
                          </span>
                          <span className="text-3xl font-semibold text-gray-800">{entry.nickname || entry.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-5xl font-bold block text-gray-900">{entry.total_score}点</span>
                          <span className="text-xl text-gray-600 font-medium">正解: {entry.correct_count}問</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}