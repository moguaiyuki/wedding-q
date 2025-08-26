'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRealtimeManager } from '@/lib/supabase/realtime'

interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: string
  points: number
}

interface GameState {
  id: string
  current_state: 'waiting' | 'showing_question' | 'accepting_answers' | 'showing_results' | 'finished'
  current_question_id: string | null
  current_question_number: number
}

interface AdminAction {
  id: string
  action_type: string
  previous_state: any
  performed_at: string
  undone: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [lastAction, setLastAction] = useState<AdminAction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [answerCount, setAnswerCount] = useState(0)

  useEffect(() => {
    fetchGameState()
    fetchQuestions()
    fetchLastAction()
    fetchParticipantCount()
    
    // Set up realtime subscriptions
    const realtimeManager = getRealtimeManager()
    
    // Subscribe to participant count changes
    const unsubscribeParticipants = realtimeManager.subscribeToParticipants((count) => {
      setParticipantCount(count)
    })
    
    return () => {
      unsubscribeParticipants()
    }
  }, [])

  useEffect(() => {
    if (gameState?.current_question_id && questions.length > 0) {
      const question = questions.find(q => q.id === gameState.current_question_id)
      setCurrentQuestion(question || null)
      
      // Subscribe to answers for current question
      if (gameState.current_question_id && gameState.current_state === 'accepting_answers') {
        const realtimeManager = getRealtimeManager()
        const unsubscribe = realtimeManager.subscribeToAnswers(
          gameState.current_question_id,
          () => {
            fetchAnswerCount(gameState.current_question_id!)
          }
        )
        
        // Initial fetch
        fetchAnswerCount(gameState.current_question_id)
        
        return () => {
          unsubscribe()
        }
      }
    }
  }, [gameState?.current_question_id, gameState?.current_state, questions])

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

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
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

  const fetchLastAction = async () => {
    try {
      const response = await fetch('/api/admin-actions/last')
      if (response.ok) {
        const data = await response.json()
        setLastAction(data)
      }
    } catch (error) {
      console.error('Failed to fetch last action:', error)
    }
  }

  const fetchAnswerCount = async (questionId: string) => {
    try {
      const response = await fetch(`/api/answers?question_id=${questionId}&count=true`)
      if (response.ok) {
        const data = await response.json()
        setAnswerCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch answer count:', error)
    }
  }

  const updateGameState = async (newState: string, questionNumber?: number) => {
    setIsLoading(true)
    setError('')

    try {
      let updateData: any = {
        current_state: newState
      }

      if (questionNumber !== undefined) {
        const question = questions.find(q => q.question_number === questionNumber)
        if (question) {
          updateData.current_question_id = question.id
          updateData.current_question_number = questionNumber
        }
      }

      const response = await fetch('/api/game-state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        setGameState(data)
        if (data.admin_action_id) {
          fetchLastAction()
        }
      } else {
        const data = await response.json()
        setError(data.error || '状態の更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update game state:', error)
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const startQuiz = () => {
    if (questions.length === 0) {
      setError('問題が登録されていません')
      return
    }
    updateGameState('accepting_answers', 1)
  }

  const closeAnswers = () => {
    updateGameState('showing_results')
  }

  const nextQuestion = () => {
    if (!gameState) return
    
    const nextNumber = gameState.current_question_number + 1
    const nextExists = questions.some(q => q.question_number === nextNumber)
    
    if (nextExists) {
      updateGameState('accepting_answers', nextNumber)
    } else {
      updateGameState('finished')
    }
  }

  const finishQuiz = () => {
    updateGameState('finished')
  }

  const resetQuiz = () => {
    updateGameState('waiting', 0)
  }

  const handleUndo = async () => {
    if (!lastAction || lastAction.undone) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin-actions/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action_id: lastAction.id }),
      })

      if (response.ok) {
        fetchGameState()
        fetchLastAction()
      } else {
        const data = await response.json()
        setError(data.error || 'UNDO操作に失敗しました')
      }
    } catch (error) {
      console.error('Failed to undo:', error)
      setError('UNDO操作中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin', {
        method: 'DELETE',
      })
      router.push('/admin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            クイズ管理ダッシュボード
          </h1>
          <div className="space-x-2">
            <button
              onClick={() => router.push('/admin/questions')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              問題管理
            </button>
            <button
              onClick={() => router.push('/admin/participants')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              参加者管理
            </button>
            <button
              onClick={() => router.push('/admin/data')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              データ管理
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">参加者数</h2>
            <p className="text-3xl font-bold text-gray-800">{participantCount}名</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">現在の問題</h2>
            <p className="text-3xl font-bold text-gray-800">
              {gameState?.current_question_number === 0 ? '-' : `第${gameState?.current_question_number}問`}
            </p>
            {currentQuestion && (
              <p className="text-sm text-gray-600 mt-1">{currentQuestion.points}点</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">状態</h2>
            <p className="text-xl font-bold">
              {gameState?.current_state === 'waiting' && '待機中'}
              {gameState?.current_state === 'showing_question' && '問題表示中'}
              {gameState?.current_state === 'accepting_answers' && '回答受付中'}
              {gameState?.current_state === 'showing_results' && '結果表示中'}
              {gameState?.current_state === 'finished' && '終了'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ゲーム進行管理</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gameState?.current_state === 'waiting' && (
              <button
                onClick={startQuiz}
                disabled={isLoading || questions.length === 0}
                className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                クイズ開始
              </button>
            )}


            {gameState?.current_state === 'accepting_answers' && (
              <button
                onClick={closeAnswers}
                disabled={isLoading}
                className="bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                回答締切
              </button>
            )}

            {gameState?.current_state === 'showing_results' && (
              <>
                <button
                  onClick={nextQuestion}
                  disabled={isLoading}
                  className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次の問題へ
                </button>
                <button
                  onClick={finishQuiz}
                  disabled={isLoading}
                  className="bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  クイズ終了
                </button>
              </>
            )}

            {gameState?.current_state === 'finished' && (
              <button
                onClick={resetQuiz}
                disabled={isLoading}
                className="bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                リセット
              </button>
            )}
          </div>

          {lastAction && !lastAction.undone && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-800 mb-3">UNDO機能</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最後の操作:</p>
                  <p className="text-gray-800">{lastAction.action_type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(lastAction.performed_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <button 
                  onClick={handleUndo}
                  disabled={isLoading}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  元に戻す
                </button>
              </div>
            </div>
          )}
        </div>

        {currentQuestion && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">現在の問題詳細</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">問題文:</span> {currentQuestion.question_text}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">タイプ:</span> {currentQuestion.question_type === 'multiple_choice' ? '選択式' : '自由記述'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">配点:</span> {currentQuestion.points}点
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}