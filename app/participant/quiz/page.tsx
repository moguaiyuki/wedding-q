'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getRealtimeManager } from '@/lib/supabase/realtime'

interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: 'multiple_choice' | 'free_text'
  image_url?: string
  choices?: Array<{
    id: string
    choice_text: string
    display_order: number
  }>
}

interface GameState {
  current_state: string
  current_question_id: string | null
  current_question_number: number
}

export default function QuizPage() {
  const router = useRouter()
  const [question, setQuestion] = useState<Question | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<string>('')
  const [freeTextAnswer, setFreeTextAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGameState()
    
    // Set up realtime subscription for game state changes
    const realtimeManager = getRealtimeManager()
    const unsubscribe = realtimeManager.subscribeToGameState((payload) => {
      console.log('Quiz page received game state change:', payload)
      fetchGameState()
    })
    
    // Also set up polling as fallback (every 2 seconds)
    const interval = setInterval(() => {
      fetchGameState()
    }, 2000)
    
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (gameState?.current_question_id) {
      // 新しい問題に変わったときは、まず回答状態をリセット
      setHasAnswered(false)
      setSelectedChoice('')
      setFreeTextAnswer('')
      setError('')
      
      fetchQuestion(gameState.current_question_id)
      checkIfAnswered(gameState.current_question_id)
    }
  }, [gameState?.current_question_id])


  useEffect(() => {
    if (gameState?.current_state === 'showing_results') {
      router.push('/participant/results')
    } else if (gameState?.current_state === 'waiting') {
      router.push('/participant/waiting')
    }
  }, [gameState?.current_state, router])

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
        setQuestion(data)
      }
    } catch (error) {
      console.error('Failed to fetch question:', error)
      setError('問題の読み込みに失敗しました')
    }
  }

  const checkIfAnswered = async (questionId: string) => {
    try {
      const response = await fetch(`/api/answers?question_id=${questionId}`)
      console.log('Check answer response status:', response.status)
      
      if (response.ok) {
        const text = await response.text()
        console.log('Raw response:', text)
        
        // 空のレスポンスをチェック
        if (!text) {
          console.log('Empty response - no answer found')
          setHasAnswered(false)
          return
        }
        
        try {
          const data = JSON.parse(text)
          console.log('Parsed answer data:', data)
          
          // APIはnullまたはanswerオブジェクトを返す
          // dataが存在し、nullでなければ回答済み
          if (data && data !== null) {
            console.log('Answer found - setting hasAnswered to true')
            setHasAnswered(true)
          } else {
            console.log('No answer found - setting hasAnswered to false')
            setHasAnswered(false)
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          setHasAnswered(false)
        }
      } else {
        console.log('Response not ok:', response.status)
        setHasAnswered(false)
      }
    } catch (error) {
      console.error('Failed to check answer:', error)
      setHasAnswered(false)
    }
  }

  const handleSubmit = async () => {
    if (!question) return

    if (question.question_type === 'multiple_choice' && !selectedChoice) {
      setError('選択肢を選んでください')
      return
    }

    if (question.question_type === 'free_text' && !freeTextAnswer.trim()) {
      setError('回答を入力してください')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: question.id,
          choice_id: question.question_type === 'multiple_choice' ? selectedChoice : null,
          answer_text: question.question_type === 'free_text' ? freeTextAnswer : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '回答の送信に失敗しました')
        return
      }

      setHasAnswered(true)
    } catch (error) {
      console.error('Submit error:', error)
      setError('回答の送信中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!question || !gameState) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
            <div className="text-center mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">問題を読み込んでいます...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4 relative">
          {/* Question number badge */}
          <div className="absolute top-6 left-6 bg-wedding-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            第{question.question_number}問
          </div>

          <div className="mt-16 mb-6">
            <p className="text-2xl font-bold text-gray-800 text-center leading-relaxed">{question.question_text}</p>
          </div>

          {question.image_url && (
            <div className="relative w-full h-64 mb-6">
              <Image 
                src={question.image_url} 
                alt="問題画像" 
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          {hasAnswered ? (
            <div className="text-center py-8 bg-wedding-cream-100 border-2 border-wedding-gold-300 rounded-2xl">
              <p className="text-xl font-bold text-gray-800 mb-2">回答済みです！</p>
              <p className="text-gray-700">結果発表をお待ちください</p>
            </div>
          ) : (
            <>
              {question.question_type === 'multiple_choice' && question.choices && (
                <div className="space-y-3 mb-6" role="radiogroup" aria-label="回答選択肢">
                  {question.choices
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => setSelectedChoice(choice.id)}
                        disabled={isSubmitting}
                        className={`w-full p-4 text-left rounded-2xl border-2 transition-all ${
                          selectedChoice === choice.id
                            ? 'border-wedding-pink-500 bg-wedding-pink-100 text-gray-800 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-wedding-pink-300 text-gray-700 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-wedding-pink-400 focus:ring-offset-2`}
                        aria-label={`選択肢${choice.display_order}: ${choice.choice_text}`}
                        aria-pressed={selectedChoice === choice.id}
                        role="radio"
                        aria-checked={selectedChoice === choice.id}
                      >
                        <span className="font-medium">{choice.choice_text}</span>
                      </button>
                    ))}
                </div>
              )}

              {question.question_type === 'free_text' && (
                <div className="mb-6">
                  <textarea
                    value={freeTextAnswer}
                    onChange={(e) => setFreeTextAnswer(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-wedding-pink-500 focus:outline-none disabled:opacity-50 focus:ring-2 focus:ring-wedding-pink-400 focus:ring-offset-2"
                    rows={4}
                    placeholder="回答を入力してください"
                    aria-label="自由記述回答"
                    aria-describedby="answer-instructions"
                    aria-invalid={error ? 'true' : 'false'}
                  />
                  <span id="answer-instructions" className="sr-only">回答を入力して送信ボタンを押してください</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert" aria-live="assertive">
                  <span className="sr-only">エラー:</span>
                  {error}
                </div>
              )}

              <button
                  onClick={handleSubmit}
                  disabled={isSubmitting ||
                    (question.question_type === 'multiple_choice' && !selectedChoice) ||
                    (question.question_type === 'free_text' && !freeTextAnswer.trim())}
                  className="w-full bg-wedding-pink-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-wedding-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-wedding-pink-400 focus:ring-offset-2 min-h-[44px] shadow-lg"
                  aria-label={isSubmitting ? '回答を送信中' : '回答を送信する'}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? '送信中...' : (
                    <span className="flex items-center justify-center gap-2">
                      回答を送信
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}