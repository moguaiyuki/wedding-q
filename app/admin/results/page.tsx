'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LeaderboardEntry {
  user_id: string
  user_name: string
  nickname?: string
  group_type: string
  total_score: number
  correct_count: number
  total_questions: number
  rank: number
}

interface QuestionResult {
  question_number: number
  question_text: string
  correct_count: number
  total_answers: number
  accuracy_rate: number
}

export default function FinalResultsPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      // リーダーボードを取得
      const leaderboardResponse = await fetch('/api/stats/leaderboard')
      if (!leaderboardResponse.ok) {
        if (leaderboardResponse.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch leaderboard')
      }
      const leaderboardData = await leaderboardResponse.json()
      setLeaderboard(leaderboardData)

      // 問題ごとの統計を取得
      const questionsResponse = await fetch('/api/questions')
      const questionsData = await questionsResponse.json()
      
      const questionStats = await Promise.all(
        questionsData.map(async (question: any) => {
          const answersResponse = await fetch(`/api/stats/answers?question_id=${question.id}`)
          const answersData = await answersResponse.json()
          
          return {
            question_number: question.question_number,
            question_text: question.question_text,
            correct_count: answersData.correct_count || 0,
            total_answers: answersData.total_count || 0,
            accuracy_rate: answersData.total_count > 0 
              ? Math.round((answersData.correct_count / answersData.total_count) * 100)
              : 0
          }
        })
      )
      
      setQuestionResults(questionStats.sort((a, b) => a.question_number - b.question_number))
    } catch (error) {
      console.error('Error fetching results:', error)
      setError('結果の取得に失敗しました')
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

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return ''
    }
  }

  const exportToCSV = () => {
    const headers = ['順位', '名前', 'ニックネーム', 'グループ', '得点', '正解数', '総問題数']
    const rows = leaderboard.map(entry => [
      entry.rank,
      entry.user_name,
      entry.nickname || '',
      getGroupLabel(entry.group_type),
      entry.total_score,
      entry.correct_count,
      entry.total_questions
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `quiz_results_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">結果を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">クイズ最終結果</h1>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                CSVダウンロード
              </button>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* 総合ランキング */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">総合ランキング</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      順位
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      グループ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      得点
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      正解数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      正解率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <tr key={entry.user_id} className={entry.rank <= 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="flex items-center gap-2">
                          {getRankEmoji(entry.rank)} {entry.rank}位
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{entry.nickname || entry.user_name}</div>
                          {entry.nickname && (
                            <div className="text-xs text-gray-500">{entry.user_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getGroupLabel(entry.group_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {entry.total_score}点
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.correct_count}/{entry.total_questions}問
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.total_questions > 0 
                          ? Math.round((entry.correct_count / entry.total_questions) * 100)
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 問題ごとの統計 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">問題ごとの統計</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionResults.map((result) => (
                <div key={result.question_number} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    第{result.question_number}問
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {result.question_text}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">正解者数</span>
                      <span className="font-medium">{result.correct_count}名</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">回答者数</span>
                      <span className="font-medium">{result.total_answers}名</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">正解率</span>
                      <span className={`font-bold ${
                        result.accuracy_rate >= 70 ? 'text-green-600' :
                        result.accuracy_rate >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {result.accuracy_rate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}