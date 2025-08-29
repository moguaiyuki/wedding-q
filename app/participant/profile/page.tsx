'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface User {
  id: string
  name: string
  nickname?: string | null
  group_type: string
  seat_number?: string
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isFirstSetup = searchParams.get('setup') === 'true'

  useEffect(() => {
    fetchUser()
    // 初回セットアップの場合は自動で編集モードに
    if (isFirstSetup) {
      setIsEditing(true)
    }
  }, [isFirstSetup])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (!response.ok) {
        router.push('/participant')
        return
      }
      const data = await response.json()
      setUser(data)
      setNickname(data.nickname || '')
    } catch (error) {
      console.error('Failed to fetch user:', error)
      router.push('/participant')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/nickname', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'ニックネームの更新に失敗しました')
        return
      }

      setUser(data.user)
      setSuccess('ニックネームを更新しました')
      setIsEditing(false)
      
      // 初回設定完了後は待機画面へ遷移
      if (isFirstSetup) {
        setTimeout(() => {
          router.push('/participant/waiting')
        }, 1000)
      }
    } catch (error) {
      console.error('Update nickname error:', error)
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearNickname = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/nickname', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'ニックネームのクリアに失敗しました')
        return
      }

      setUser(data.user)
      setNickname('')
      setSuccess('フルネーム表示に戻しました')
      setIsEditing(false)
    } catch (error) {
      console.error('Clear nickname error:', error)
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const getGroupLabel = (groupType: string) => {
    const labels: { [key: string]: string } = {
      'bride': '新婦側',
      'groom': '新郎側',
      'bride_friend': '新婦友人',
      'bride_family': '新婦親族',
      'groom_friend': '新郎友人',
      'groom_family': '新郎親族',
    }
    return labels[groupType] || groupType
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-pink to-wedding-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-pink mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-pink to-wedding-white p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isFirstSetup ? 'はじめに表示名を設定' : 'プロフィール設定'}
            </h1>
            {!isFirstSetup && (
              <button
                onClick={() => router.push('/participant/waiting')}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            )}
          </div>

          {isFirstSetup && !user?.nickname && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                クイズ中に表示される名前を設定してください。
                あなただけのニックネームで楽しく参加しましょう！
              </p>
            </div>
          )}

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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フルネーム
              </label>
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-pink focus:border-transparent"
                    placeholder="ニックネームを入力（20文字以内）"
                    maxLength={20}
                    disabled={isLoading}
                  />
                  <div className="text-xs text-gray-700">
                    • 20文字以内で入力してください<br />
                    • 絵文字は使用できません<br />
                    • 他の参加者と重複しない名前にしてください
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !nickname.trim()}
                      className="px-4 py-2 bg-wedding-pink text-white rounded-lg hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isLoading ? '保存中...' : '保存'}
                    </button>
                    {!isFirstSetup ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          setNickname(user.nickname || '')
                          setError('')
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                      >
                        キャンセル
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push('/participant/waiting')}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
                      >
                        スキップ
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900">
                    {user.nickname || user.name}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    {user.nickname && (
                      <button
                        onClick={handleClearNickname}
                        disabled={isLoading}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        クリア
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                グループ
              </label>
              <p className="text-lg text-gray-900">{getGroupLabel(user.group_type)}</p>
            </div>

            {user.seat_number && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  座席番号
                </label>
                <p className="text-lg text-gray-900">{user.seat_number}</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => router.push('/participant/waiting')}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              {isFirstSetup && !user.nickname ? 'スキップしてクイズに進む' : 
               isFirstSetup ? 'クイズに進む' : 'クイズに戻る'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wedding-pink to-wedding-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-pink mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}