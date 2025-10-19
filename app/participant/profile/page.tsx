'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, UserCircle, Users, MapPin } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quiz-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100 p-4 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute top-10 right-16 w-8 h-8 text-quiz-yellow-200 animate-pulse">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
        </svg>
      </div>
      <div className="absolute bottom-32 left-24 w-6 h-6 text-quiz-pink-200 animate-pulse animation-delay-200">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
        </svg>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 font-serif">
              {isFirstSetup ? '表示名を設定' : 'プロフィール設定'}
            </h1>
            {!isFirstSetup && (
              <button
                onClick={() => router.push('/participant/waiting')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-6 h-6" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {isFirstSetup && !user?.nickname && (
            <div className="bg-quiz-blue-100 border-2 border-quiz-blue-300 rounded-2xl p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium">
                クイズ中に表示される名前を設定してください。
                あなただけのニックネームで楽しく参加しましょう！
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-2xl mb-4 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-quiz-green-100 border-2 border-green-300 text-green-700 px-4 py-3 rounded-2xl mb-4 font-medium">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-quiz-beige-100 rounded-2xl p-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <UserCircle className="w-5 h-5 text-quiz-teal-600" strokeWidth={2.5} />
                フルネーム
              </label>
              <p className="text-lg font-semibold text-gray-900 ml-7">{user.name}</p>
            </div>

            <div className="bg-quiz-yellow-100 rounded-2xl p-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <UserCircle className="w-5 h-5 text-quiz-coral-600" strokeWidth={2.5} />
                表示名
              </label>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-3 ml-7">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-quiz-teal-400 focus:border-quiz-teal-500 focus:outline-none transition-colors"
                    placeholder="ニックネームを入力（20文字以内）"
                    maxLength={20}
                    disabled={isLoading}
                  />
                  <div className="text-xs text-gray-700 bg-white rounded-xl p-3">
                    • 20文字以内で入力してください<br />
                    • 絵文字は使用できません<br />
                    • 他の参加者と重複しない名前にしてください
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !nickname.trim()}
                      className="px-6 py-3 bg-quiz-teal-500 text-white rounded-2xl hover:bg-quiz-teal-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold shadow-lg"
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
                        className="px-6 py-3 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold"
                      >
                        キャンセル
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push('/participant/waiting')}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold"
                      >
                        スキップ
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between ml-7">
                  <p className="text-lg font-semibold text-gray-900">
                    {user.nickname || user.name}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-quiz-teal-600 hover:text-quiz-teal-700 font-bold"
                    >
                      編集
                    </button>
                    {user.nickname && (
                      <button
                        onClick={handleClearNickname}
                        disabled={isLoading}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 font-bold"
                      >
                        クリア
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-quiz-pink-100 rounded-2xl p-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Users className="w-5 h-5 text-quiz-purple-600" strokeWidth={2.5} />
                グループ
              </label>
              <p className="text-lg font-semibold text-gray-900 ml-7">{getGroupLabel(user.group_type)}</p>
            </div>

            {user.seat_number && (
              <div className="bg-quiz-green-100 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <MapPin className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                  座席番号
                </label>
                <p className="text-lg font-semibold text-gray-900 ml-7">{user.seat_number}</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <button
              onClick={() => router.push('/participant/waiting')}
              className="w-full bg-quiz-teal-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-quiz-teal-600 transition-all transform hover:scale-105 shadow-lg"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-beige-50 to-quiz-beige-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quiz-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}