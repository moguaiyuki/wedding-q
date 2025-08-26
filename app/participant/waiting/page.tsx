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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-pink to-wedding-white p-4">
      <div className="text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          {user && !user.nickname && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-yellow-800">
                    表示名を設定しましょう！
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    ニックネームを設定すると、クイズ中はその名前が表示されます
                  </p>
                  <button
                    onClick={() => router.push('/participant/profile')}
                    className="mt-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    表示名を設定する
                  </button>
                </div>
              </div>
            </div>
          )}
          {user && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                ようこそ、<span className="font-semibold">{user.nickname || `${user.name}（未設定）`}</span>さん
              </p>
              <button
                onClick={() => router.push('/participant/profile')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  user.nickname 
                    ? 'text-sm text-gray-600 hover:bg-gray-100' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 animate-pulse'
                }`}
              >
                {user.nickname ? 'プロフィール' : '表示名を設定'}
              </button>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            準備完了！
          </h1>
          
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-2">参加者情報</p>
            <p className="text-2xl font-bold text-wedding-pink mb-2">
              {user?.nickname || user?.name || '読み込み中...'}
            </p>
            {user?.nickname && (
              <p className="text-xs text-gray-500 mb-1">本名: {user.name}</p>
            )}
            <p className="text-sm text-gray-500">ID: {user?.qr_code || '-'}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">現在の参加者数</p>
            <p className="text-4xl font-bold text-gray-800">{participantCount}名</p>
          </div>

          <div className="space-y-2 text-gray-600">
            <p>まもなくクイズが始まります</p>
            <p>この画面のままお待ちください</p>
          </div>

          <div className="mt-8">
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-wedding-pink rounded-full"></div>
                <div className="w-3 h-3 bg-wedding-pink rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-wedding-pink rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>画面を閉じないでください</p>
        </div>
      </div>
    </div>
  )
}