'use client'

import { useEffect, useState } from 'react'

export default function PresentationPage() {
  const [gameState, setGameState] = useState<'waiting' | 'showing_question' | 'accepting_answers' | 'showing_results' | 'finished'>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [answerStats, setAnswerStats] = useState<any[]>([])
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    // TODO: Connect to Supabase Realtime
    // Simulate data
    setParticipantCount(45)
  }, [])

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wedding-pink to-wedding-gold flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8 animate-pulse">
            結婚式クイズ
          </h1>
          <p className="text-3xl text-white mb-4">まもなく開始します</p>
          <p className="text-2xl text-white">参加者: {participantCount}名</p>
          
          <div className="mt-12">
            <div className="inline-flex space-x-2">
              <div className="w-6 h-6 bg-white rounded-full animate-bounce"></div>
              <div className="w-6 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-6 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'showing_question' || gameState === 'accepting_answers') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <p className="text-2xl text-gray-600 mb-2">第1問</p>
              <h2 className="text-4xl font-bold text-gray-800">
                新郎の好きな食べ物は？
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="bg-blue-100 rounded-xl p-6 text-center">
                <p className="text-3xl font-bold">A. ラーメン</p>
              </div>
              <div className="bg-green-100 rounded-xl p-6 text-center">
                <p className="text-3xl font-bold">B. カレー</p>
              </div>
              <div className="bg-yellow-100 rounded-xl p-6 text-center">
                <p className="text-3xl font-bold">C. 寿司</p>
              </div>
              <div className="bg-red-100 rounded-xl p-6 text-center">
                <p className="text-3xl font-bold">D. パスタ</p>
              </div>
            </div>

            {gameState === 'accepting_answers' && (
              <div className="mt-8 text-center">
                <p className="text-2xl text-gray-600">回答受付中...</p>
                <div className="mt-4">
                  <div className="inline-block bg-gray-200 rounded-full px-6 py-3">
                    <p className="text-xl font-medium">回答者: 32/{participantCount}名</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'showing_results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
              結果発表！
            </h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-medium">A. ラーメン</span>
                    <span className="text-xl font-bold text-green-600">正解！</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-8">
                    <div className="bg-green-600 h-8 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-right mt-1 text-gray-600">24名 (60%)</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-medium">B. カレー</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-8">
                    <div className="bg-blue-600 h-8 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <p className="text-right mt-1 text-gray-600">8名 (20%)</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-medium">C. 寿司</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-8">
                    <div className="bg-blue-600 h-8 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <p className="text-right mt-1 text-gray-600">6名 (15%)</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-medium">D. パスタ</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-8">
                    <div className="bg-blue-600 h-8 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                  <p className="text-right mt-1 text-gray-600">2名 (5%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}