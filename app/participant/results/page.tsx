'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserAnswer {
  question_id: string
  is_correct: boolean
  points_earned: number
  answered_at: string
}

interface GameState {
  current_state: string
  current_question_number: number
}

export default function ResultsPage() {
  const router = useRouter()
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [rank, setRank] = useState<number | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchResults()
    fetchGameState()
    const interval = setInterval(fetchGameState, 2000)
    return () => clearInterval(interval)
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

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">正解率</p>
              <p className="text-4xl font-bold text-purple-600">
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">%</p>
            </div>
          </div>

          {rank && (
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-2">現在の順位</p>
              <p className="text-5xl font-bold text-yellow-600">{rank}位</p>
              <p className="text-sm text-gray-600 mt-2">60名中</p>
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