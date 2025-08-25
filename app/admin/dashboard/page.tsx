'use client'

import { useState } from 'react'

export default function AdminDashboard() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'showing_question' | 'accepting_answers' | 'showing_results' | 'finished'>('waiting')
  const [participantCount, setParticipantCount] = useState(0)

  const startQuiz = () => {
    setGameState('showing_question')
    setCurrentQuestion(1)
  }

  const nextQuestion = () => {
    setCurrentQuestion(prev => prev + 1)
    setGameState('showing_question')
  }

  const closeAnswers = () => {
    setGameState('showing_results')
  }

  const showResults = () => {
    setGameState('showing_results')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          クイズ管理ダッシュボード
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">参加者数</h2>
            <p className="text-3xl font-bold text-gray-800">{participantCount}名</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">現在の問題</h2>
            <p className="text-3xl font-bold text-gray-800">
              {currentQuestion === 0 ? '-' : `第${currentQuestion}問`}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">状態</h2>
            <p className="text-xl font-bold">
              {gameState === 'waiting' && '待機中'}
              {gameState === 'showing_question' && '問題表示中'}
              {gameState === 'accepting_answers' && '回答受付中'}
              {gameState === 'showing_results' && '結果表示中'}
              {gameState === 'finished' && '終了'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ゲーム進行管理</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={startQuiz}
              disabled={gameState !== 'waiting'}
              className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              クイズ開始
            </button>

            <button
              onClick={nextQuestion}
              disabled={gameState === 'waiting' || gameState === 'finished'}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次の問題へ
            </button>

            <button
              onClick={closeAnswers}
              disabled={gameState !== 'accepting_answers'}
              className="bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              回答締切
            </button>

            <button
              onClick={showResults}
              disabled={gameState === 'waiting'}
              className="bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              結果表示
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-800 mb-3">UNDO機能</h3>
            <button className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors">
              直前の操作を取り消す
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">問題一覧</h2>
          <div className="space-y-2">
            <div className="border rounded-lg p-4">
              <p className="font-medium">第1問: 新郎の好きな食べ物は？</p>
              <p className="text-sm text-gray-600 mt-1">選択式 • 30秒 • 10ポイント</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium">第2問: 新婦の出身地は？</p>
              <p className="text-sm text-gray-600 mt-1">選択式 • 30秒 • 10ポイント</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}