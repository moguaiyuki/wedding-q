'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Respondent {
  name: string
  answered_at: string
}

interface ChoiceStat {
  choice_id: string
  choice_text: string
  count: number
  percentage: number
  is_correct: boolean
  respondents: Respondent[]
}

interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: string
}

interface NullChoiceAnswers {
  correct: Respondent[]
  incorrect: Respondent[]
}

interface AnswerDetails {
  question: Question
  total_answers: number
  correct_answers: number
  choices: ChoiceStat[]
  null_choice_answers: NullChoiceAnswers
}

export default function QuestionAnswersPage() {
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string

  const [data, setData] = useState<AnswerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnswerDetails()
  }, [questionId])

  const fetchAnswerDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/questions/${questionId}/answers`)

      if (!response.ok) {
        throw new Error('回答データの取得に失敗しました')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch answer details:', err)
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'データが見つかりません'}</p>
          <button
            onClick={() => router.push('/admin/questions')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            問題一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  const correctPercentage = data.total_answers > 0
    ? Math.round((data.correct_answers / data.total_answers) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/questions')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            問題一覧に戻る
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              第{data.question.question_number}問 - 回答詳細
            </h1>
            <p className="text-gray-700 mb-4">{data.question.question_text}</p>

            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <span className="font-semibold">総回答数:</span> {data.total_answers}
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <span className="font-semibold">正解数:</span> {data.correct_answers}
              </div>
              <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg">
                <span className="font-semibold">正解率:</span> {correctPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Choices Statistics */}
        <div className="space-y-4">
          {data.choices.map((choice) => {
            // Merge null choice_id correct answers into the correct choice
            const allRespondents = choice.is_correct
              ? [...choice.respondents, ...data.null_choice_answers.correct]
              : choice.respondents

            const totalCount = allRespondents.length
            const totalPercentage = data.total_answers > 0
              ? Math.round((totalCount / data.total_answers) * 100)
              : 0

            return (
              <div
                key={choice.choice_id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  choice.is_correct ? 'border-2 border-green-500' : ''
                }`}
              >
                {/* Choice Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {choice.choice_text}
                      </h3>
                      {choice.is_correct && (
                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                          正解
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        {totalPercentage}%
                      </span>
                      <span className="text-gray-600 ml-2">
                        ({totalCount}/{data.total_answers}人)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${
                        choice.is_correct
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      } transition-all duration-500`}
                      style={{ width: `${totalPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Respondents List */}
                {allRespondents.length > 0 ? (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      回答者一覧 ({allRespondents.length}人)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {allRespondents.map((respondent, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 truncate"
                          title={respondent.name}
                        >
                          {respondent.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    この選択肢を選んだ人はいません
                  </div>
                )}
              </div>
            )
          })}

          {/* Warning Section for Lost Choice Data (B or C incorrect answers) */}
          {data.null_choice_answers.incorrect.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow overflow-hidden">
              {/* Warning Header */}
              <div className="p-4 bg-yellow-100 border-b border-yellow-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      選択肢BまたはCを選んだ回答者（不正解）
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-yellow-700">
                      {data.total_answers > 0
                        ? Math.round((data.null_choice_answers.incorrect.length / data.total_answers) * 100)
                        : 0}%
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({data.null_choice_answers.incorrect.length}/{data.total_answers}人)
                    </span>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-200 border border-yellow-400 rounded-lg p-3 text-sm text-yellow-900">
                  <p className="font-semibold mb-1">⚠️ データ損失について</p>
                  <p>問題編集により選択肢情報が失われています。BとCのどちらを選んだかは区別できません。</p>
                </div>
              </div>

              {/* Respondents List */}
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  回答者一覧 ({data.null_choice_answers.incorrect.length}人)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {data.null_choice_answers.incorrect.map((respondent, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-yellow-100 rounded-lg text-sm text-gray-800 truncate"
                      title={respondent.name}
                    >
                      {respondent.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* No Answers State */}
        {data.total_answers === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">まだ回答がありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
