'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Participant {
  id: string
  qr_code: string
  name: string
  group_type: string
  seat_number?: string
}

const GROUP_TYPES = [
  { value: 'bride', label: '新婦側' },
  { value: 'groom', label: '新郎側' },
  { value: 'bride_friend', label: '新婦友人' },
  { value: 'bride_family', label: '新婦親族' },
  { value: 'groom_friend', label: '新郎友人' },
  { value: 'groom_family', label: '新郎親族' },
]

export default function ParticipantsManagementPage() {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    group_type: 'bride',
    seat_number: ''
  })
  const [error, setError] = useState('')
  const [showQRCodes, setShowQRCodes] = useState(false)
  const [qrCodes, setQRCodes] = useState<any[]>([])

  useEffect(() => {
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/participants')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch participants')
      }
      const data = await response.json()
      setParticipants(data)
    } catch (error) {
      console.error('Error fetching participants:', error)
      setError('参加者の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingId ? '/api/participants' : '/api/participants'
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to save participant')
      }

      await fetchParticipants()
      resetForm()
    } catch (error) {
      console.error('Error saving participant:', error)
      setError('参加者の保存に失敗しました')
    }
  }

  const handleEdit = (participant: Participant) => {
    setEditingId(participant.id)
    setFormData({
      name: participant.name,
      group_type: participant.group_type,
      seat_number: participant.seat_number || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この参加者を削除しますか？')) return

    try {
      const response = await fetch(`/api/participants?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete participant')
      }

      await fetchParticipants()
    } catch (error) {
      console.error('Error deleting participant:', error)
      setError('参加者の削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      group_type: 'bride',
      seat_number: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const generateAllQRCodes = async () => {
    try {
      const response = await fetch('/api/participants/qr-codes', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate QR codes')
      }

      const data = await response.json()
      setQRCodes(data)
      setShowQRCodes(true)
    } catch (error) {
      console.error('Error generating QR codes:', error)
      setError('QRコードの生成に失敗しました')
    }
  }

  const printQRCodes = () => {
    window.print()
  }

  const getGroupLabel = (groupType: string) => {
    return GROUP_TYPES.find(g => g.value === groupType)?.label || groupType
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">参加者管理</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ダッシュボードに戻る
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                参加者を追加
              </button>
              <button
                onClick={generateAllQRCodes}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                QRコード一括生成
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? '参加者を編集' : '参加者を追加'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="山田 太郎"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      グループ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.group_type}
                      onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {GROUP_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      座席番号
                    </label>
                    <input
                      type="text"
                      value={formData.seat_number}
                      onChange={(e) => setFormData({ ...formData, seat_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="A-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? '更新' : '追加'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              登録済み: {participants.length}名 / 60名
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    座席番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    グループ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QRコード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.seat_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getGroupLabel(participant.group_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {participant.qr_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(participant)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(participant.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showQRCodes && qrCodes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-xl p-6 print:shadow-none">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-xl font-bold">QRコード一覧</h2>
              <div className="flex gap-2">
                <button
                  onClick={printQRCodes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  印刷
                </button>
                <button
                  onClick={() => setShowQRCodes(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  閉じる
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 print:grid-cols-3">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="border border-gray-300 p-4 rounded-lg text-center">
                  <img
                    src={qr.qrCodeImage}
                    alt={`QR Code for ${qr.name}`}
                    className="mx-auto mb-2"
                  />
                  <p className="font-semibold text-sm">{qr.name}</p>
                  <p className="text-xs text-gray-600">{qr.seatNumber || '-'}</p>
                  <p className="text-xs text-gray-500">{getGroupLabel(qr.groupType)}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{qr.qrCode}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}