'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRealtimeManager } from '@/lib/supabase/realtime'

interface GameState {
  current_state: string
  current_question_number: number
}

interface User {
  id: string
  name: string
  nickname?: string | null
  qr_code: string
  group_type: string
  seat_number?: string
  message?: string | null
  message_image_url?: string | null
}

export default function WaitingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    fetchUserInfo()
    fetchGameState()
    fetchParticipantCount()

    // Set up realtime subscriptions
    const realtimeManager = getRealtimeManager()

    // Subscribe to game state changes
    const unsubscribeGameState = realtimeManager.subscribeToGameState((payload) => {
      console.log('Waiting page received game state change:', payload)
      fetchGameState()
    })

    // Subscribe to participant count changes
    const unsubscribeParticipants = realtimeManager.subscribeToParticipants((count) => {
      setParticipantCount(count)
    })

    // Also set up polling as fallback (every 2 seconds)
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
    if (gameState?.current_state === 'accepting_answers') {
      router.push('/participant/quiz')
    } else if (gameState?.current_state === 'showing_results') {
      router.push('/participant/results')
    }
  }, [gameState?.current_state, router])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
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

  const hasMessage = user?.message || user?.message_image_url

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-rose-50 to-wedding-cream-100 p-4 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute top-10 right-16 w-8 h-8 text-wedding-gold-200 animate-pulse">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
        </svg>
      </div>
      <div className="absolute top-32 left-24 w-6 h-6 text-wedding-rose-200 animate-pulse animation-delay-200">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
        </svg>
      </div>

      <div className="text-center max-w-2xl w-full space-y-4">
        {/* メッセージカード（ある場合のみ表示） */}
        {hasMessage && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
            <div className="flex items-center justify-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {user?.group_type === 'groom' ? '新郎からのメッセージ' : '新婦からのメッセージ'}
              </h3>
            </div>

            {user?.message_image_url && (
              <div className="mb-4">
                <img
                  src={user.message_image_url}
                  alt="メッセージ画像"
                  className="w-full max-w-md mx-auto rounded-2xl shadow-md"
                  loading="lazy"
                />
              </div>
            )}

            {user?.message && (
              <div className="font-handwriting text-gray-700 text-lg leading-snug whitespace-pre-wrap text-left max-w-lg mx-auto bg-wedding-cream-50 p-4 rounded-2xl">
                {user.message}
              </div>
            )}
          </div>
        )}

        {/* 既存の準備完了カード */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto">
          {user && !user.nickname && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-yellow-800">
                    クイズ中に表示される名前を設定できます。
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    表示名を設定すると、クイズ中はその名前が表示されます
                  </p>
                  <button
                    onClick={() => router.push('/participant/profile')}
                    className="mt-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-xl hover:bg-yellow-700 transition-colors"
                  >
                    表示名を設定する
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-600 mb-3">{user?.nickname || user?.name || 'ゲスト'}さん</h2>
            <h1 className="text-3xl font-bold mb-4 text-gray-800 font-serif">
              準備完了です！
            </h1>
            <p className="text-gray-600 mb-3">クイズ開始まで、この画面のままで<br />お待ちください...</p>
            {user?.nickname && (
              <button
                onClick={() => router.push('/participant/profile')}
                className="text-sm text-wedding-pink-600 hover:text-wedding-pink-700 font-bold"
              >
                表示名編集
              </button>
            )}
          </div>

          <div className="mt-8">
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-wedding-pink-500 rounded-full"></div>
                <div className="w-3 h-3 bg-wedding-pink-500 rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-wedding-gold-300 rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700">
          <p>画面を閉じないでください</p>
        </div>
      </div>
    </div>
  )
}
