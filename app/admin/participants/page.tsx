'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Participant {
  id: string
  qr_code: string
  name: string
  group_type: string
  seat_number?: string
  message?: string | null
  message_image_url?: string | null
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
    message: '',
    message_image_url: ''
  })
  const [error, setError] = useState('')
  const [showQRCodes, setShowQRCodes] = useState(false)
  const [qrCodes, setQRCodes] = useState<any[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
      message: participant.message || '',
      message_image_url: participant.message_image_url || ''
    })
    setImagePreview(participant.message_image_url || null)
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

  const handleBulkDelete = async () => {
    if (!confirm(`全参加者（${participants.length}名）を削除しますか？この操作は取り消せません。`)) return

    try {
      const response = await fetch('/api/participants/bulk-delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to bulk delete participants')
      }

      const data = await response.json()
      alert(data.message)
      await fetchParticipants()
    } catch (error) {
      console.error('Error bulk deleting participants:', error)
      setError('参加者の一括削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      group_type: 'bride',
      message: '',
      message_image_url: ''
    })
    setEditingId(null)
    setShowAddForm(false)
    setImagePreview(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('画像ファイルは5MB以下にしてください')
      return
    }

    // 画像形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('JPEG, PNG, GIF, WebP形式の画像のみアップロード可能です')
      return
    }

    setUploadingImage(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'guest_message')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました')
      }

      const data = await response.json()
      setFormData({ ...formData, message_image_url: data.url })
      setImagePreview(data.url)
    } catch (error) {
      console.error('Image upload error:', error)
      setError('画像のアップロードに失敗しました')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageDelete = async () => {
    if (!formData.message_image_url) return

    if (!confirm('画像を削除しますか？')) return

    try {
      const response = await fetch(`/api/upload?url=${encodeURIComponent(formData.message_image_url)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('画像の削除に失敗しました')
      }

      setFormData({ ...formData, message_image_url: '' })
      setImagePreview(null)
    } catch (error) {
      console.error('Image delete error:', error)
      setError('画像の削除に失敗しました')
    }
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
    // 新しいウィンドウでQRコードを表示して印刷
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('ポップアップがブロックされています。ポップアップを許可してください。')
      return
    }

    // QRコード一覧のHTMLを生成
    const qrCodesHTML = qrCodes.map((qr) => `
      <div style="border: 1.5px solid #333; padding: 5mm; border-radius: 3mm; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; break-inside: avoid; page-break-inside: avoid;">
        <img src="${qr.qrCodeImage}" alt="QR Code for ${qr.name}" style="width: 100%; max-width: 120px; height: auto; display: block; margin: 0 auto 3mm auto;" />
        <p style="margin: 1mm 0; color: #000; text-align: center; line-height: 1.3; font-weight: 600; font-size: 11pt;">${qr.name} 様</p>
        <p style="margin: 2mm 0 0 0; color: #333; text-align: center; line-height: 1.4; font-size: 8pt;">事前にQRコードを読み取って<br>お待ちください。</p>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>QRコード一覧</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: white;
            padding: 0;
            margin: 0;
          }

          .qr-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8mm;
            padding: 0;
            margin: 0;
          }

          @media print {
            body {
              background: white;
            }
          }
        </style>
      </head>
      <body>
        <div class="qr-grid">
          ${qrCodesHTML}
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()

    // 画像の読み込みを待ってから印刷
    const images = printWindow.document.querySelectorAll('img')
    const imagePromises = Array.from(images).map((img: any) => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
    })

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        printWindow.print()
        // 印刷ダイアログが閉じられた後にウィンドウを閉じる
        setTimeout(() => {
          printWindow.close()
        }, 100)
      }, 500)
    })
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
              {participants.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  参加者を全削除
                </button>
              )}
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本情報セクション */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-800 border-b pb-2">基本情報</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>

                {/* メッセージセクション */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-800 border-b pb-2">ゲストへのメッセージ（任意）</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メッセージ
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ゲストへのメッセージを入力してください..."
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {formData.message.length} / 1000文字
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ用画像
                    </label>

                    {imagePreview ? (
                      <div className="space-y-2">
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="メッセージ画像プレビュー"
                            className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleImageDelete}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            画像を削除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          JPEG, PNG, GIF, WebP形式、5MB以下
                        </p>
                        {uploadingImage && (
                          <p className="text-sm text-blue-600 mt-2">
                            アップロード中...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={uploadingImage}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    新郎側/新婦側
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    詳細グループ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    メッセージ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    QRコード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => {
                  const mainSide = participant.group_type.includes('bride') ? '新婦側' : '新郎側'
                  const hasMessage = participant.message || participant.message_image_url
                  return (
                    <tr key={participant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          participant.group_type.includes('bride')
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {mainSide}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getGroupLabel(participant.group_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hasMessage ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            あり
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                        {participant.qr_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showQRCodes && qrCodes.length > 0 && (
          <div id="qr-codes-print-section" className="mt-8 bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
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
            <div className="grid grid-cols-4 gap-4">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="border border-gray-300 p-4 rounded-lg text-center">
                  <img
                    src={qr.qrCodeImage}
                    alt={`QR Code for ${qr.name}`}
                    className="mx-auto mb-2"
                  />
                  <p className="font-semibold text-sm">{qr.name}</p>
                  <p className="text-xs text-gray-700">{getGroupLabel(qr.groupType)}</p>
                  <p className="text-xs font-mono text-gray-600 mt-1">{qr.qrCode}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}