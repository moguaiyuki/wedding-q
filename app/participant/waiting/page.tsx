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
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        fetchGameState()
      }
    })
    
    // Subscribe to participant count changes
    const unsubscribeParticipants = realtimeManager.subscribeToParticipants((count) => {
      setParticipantCount(count)
    })
    
    return () => {
      unsubscribeGameState()
      unsubscribeParticipants()
    }
  }, [])

  useEffect(() => {
    if (gameState?.current_state === 'showing_question' || gameState?.current_state === 'accepting_answers') {
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
          {user && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                ようこそ、<span className="font-semibold">{user.nickname || user.name}</span>さん
              </p>
              <button
                onClick={() => router.push('/participant/profile')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                プロフィール設定
              </button>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            準備完了！
          </h1>
          
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-2">参加者情報</p>
            <p className="text-2xl font-bold text-wedding-pink mb-2">{user?.name || '読み込み中...'}</p>
            <p className="text-sm text-gray-500">ID: {user?.qr_code || '-'}</p>
            {user?.seat_number && (
              <p className="text-sm text-gray-500">座席: {user.seat_number}</p>
            )}
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