'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/image-upload'

interface Choice {
  text: string
  is_correct: boolean
}

interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: 'multiple_choice' | 'free_text'
  image_url?: string
  points: number
  choices?: Array<{
    id: string
    choice_text: string
    is_correct: boolean
    display_order: number
  }>
  explanation_text?: string
  explanation_image_url?: string
}

export default function QuestionsManagementPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const [formData, setFormData] = useState({
    question_number: 1,
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'free_text',
    image_url: '',
    points: 10,
    explanation_text: '',
    explanation_image_url: '',
    choices: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ] as Choice[]
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
        
        if (data.length > 0) {
          const maxNumber = Math.max(...data.map((q: Question) => q.question_number))
          setFormData(prev => ({ ...prev, question_number: maxNumber + 1 }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddChoice = () => {
    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, { text: '', is_correct: false }]
    }))
  }

  const handleRemoveChoice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }))
  }

  const handleChoiceChange = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index 
          ? { ...choice, [field]: value }
          : field === 'is_correct' && value === true 
            ? { ...choice, is_correct: false }
            : choice
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.question_text.trim()) {
      alert('問題文を入力してください')
      return
    }

    if (formData.question_type === 'multiple_choice') {
      const validChoices = formData.choices.filter(c => c.text.trim())
      if (validChoices.length < 2) {
        alert('選択肢を2つ以上入力してください')
        return
      }
      if (!validChoices.some(c => c.is_correct)) {
        alert('正解の選択肢を1つ選んでください')
        return
      }
    }

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          choices: formData.question_type === 'multiple_choice' 
            ? formData.choices.filter(c => c.text.trim())
            : undefined
        }),
      })

      if (response.ok) {
        setShowAddForm(false)
        fetchQuestions()
        setFormData({
          question_number: formData.question_number + 1,
          question_text: '',
          question_type: 'multiple_choice',
          image_url: '',
          points: 10,
          explanation_text: '',
          explanation_image_url: '',
          choices: [
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        })
      } else {
        const data = await response.json()
        alert(data.error || '問題の追加に失敗しました')
      }
    } catch (error) {
      console.error('Failed to add question:', error)
      alert('問題の追加中にエラーが発生しました')
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">問題管理</h1>
          <div className="space-x-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'キャンセル' : '問題を追加'}
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">新しい問題を追加</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    問題番号
                  </label>
                  <input
                    type="number"
                    value={formData.question_number}
                    onChange={(e) => setFormData({ ...formData, question_number: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    問題タイプ
                  </label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value as 'multiple_choice' | 'free_text' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="multiple_choice">選択式</option>
                    <option value="free_text">自由記述</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    配点
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  問題文
                </label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                type="question"
                label="問題画像（オプション）"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  解説文（オプション）
                </label>
                <textarea
                  value={formData.explanation_text}
                  onChange={(e) => setFormData({ ...formData, explanation_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="正解発表時に表示される解説"
                />
              </div>

              <ImageUpload
                value={formData.explanation_image_url}
                onChange={(url) => setFormData({ ...formData, explanation_image_url: url })}
                type="explanation"
                label="解説画像（オプション）"
              />

              {formData.question_type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選択肢
                  </label>
                  <div className="space-y-2">
                    {formData.choices.map((choice, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct_choice"
                          checked={choice.is_correct}
                          onChange={() => handleChoiceChange(index, 'is_correct', true)}
                          className="flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`選択肢 ${index + 1}`}
                        />
                        {formData.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(index)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddChoice}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      選択肢を追加
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  問題を追加
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">問題一覧</h2>
          
          {questions.length === 0 ? (
            <p className="text-gray-600">問題がまだ登録されていません</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      第{question.question_number}問
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {question.question_type === 'multiple_choice' ? '選択式' : '自由記述'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {question.points}点
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{question.question_text}</p>
                  
                  {question.image_url && (
                    <p className="text-sm text-gray-500 mb-2">
                      画像: {question.image_url}
                    </p>
                  )}
                  
                  {question.question_type === 'multiple_choice' && question.choices && (
                    <div className="mt-2 space-y-1">
                      {question.choices
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((choice) => (
                          <div key={choice.id} className="flex items-center space-x-2">
                            <span className={`w-4 h-4 rounded-full ${choice.is_correct ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span className={choice.is_correct ? 'font-semibold text-green-700' : 'text-gray-600'}>
                              {choice.choice_text}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}