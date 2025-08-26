'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DataStats {
  participants: number
  questions: number
  answers: number
  sessions: number
}

export default function DataManagementPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DataStats>({
    participants: 0,
    questions: 0,
    answers: 0,
    sessions: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/data-management')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('データ統計の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    const confirmMessage = `以下のデータを削除します：
・回答データ: ${stats.answers}件
・セッションデータ: ${stats.sessions}件

参加者データ（${stats.participants}名）と問題データ（${stats.questions}問）は保持されます。

本当に実行しますか？`

    if (!confirm(confirmMessage)) return

    setIsResetting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/data-management?confirm=true', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to reset data')
      }

      const result = await response.json()
      setSuccess(result.message)
      
      // 統計を再取得
      await fetchStats()
    } catch (error) {
      console.error('Error resetting data:', error)
      setError('データの初期化に失敗しました')
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">データ管理</h1>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              ダッシュボードに戻る
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* データ統計 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">現在のデータ統計</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">参加者</p>
                <p className="text-2xl font-bold text-blue-600">{stats.participants}名</p>
                <p className="text-xs text-gray-500 mt-1">削除されません</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">問題</p>
                <p className="text-2xl font-bold text-green-600">{stats.questions}問</p>
                <p className="text-xs text-gray-500 mt-1">削除されません</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">回答</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.answers}件</p>
                <p className="text-xs text-red-500 mt-1">削除対象</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">セッション</p>
                <p className="text-2xl font-bold text-purple-600">{stats.sessions}件</p>
                <p className="text-xs text-red-500 mt-1">削除対象</p>
              </div>
            </div>
          </div>

          {/* データ初期化 */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">データ初期化</h2>
            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• リハーサル後、本番前に実行してください</li>
                <li>• 回答データとセッションデータのみ削除されます</li>
                <li>• 参加者登録と問題データは保持されます</li>
                <li>• この操作は取り消せません</li>
              </ul>
            </div>

            <button
              onClick={handleReset}
              disabled={isResetting || (stats.answers === 0 && stats.sessions === 0)}
              className={`px-6 py-3 rounded-lg font-medium ${
                stats.answers === 0 && stats.sessions === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {isResetting ? '初期化中...' : '回答データを初期化'}
            </button>

            {stats.answers === 0 && stats.sessions === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                削除するデータがありません
              </p>
            )}
          </div>

          {/* 最終結果の確認 */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">最終結果の確認</h2>
            <p className="text-sm text-gray-600 mb-4">
              クイズ終了後の最終結果を確認できます
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/results')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                最終結果を見る
              </button>
              <button
                onClick={() => router.push('/presentation')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                プレゼンテーション画面
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}