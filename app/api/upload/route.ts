import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'question' or 'explanation'

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // ファイルタイプのチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '画像ファイル（JPEG, PNG, GIF, WebP）のみアップロード可能です' },
        { status: 400 }
      )
    }

    // ファイルサイズのチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ファイル名を生成（タイムスタンプ付き）
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `quiz-images/${fileName}`

    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // バケットが存在しない場合は作成を試みる
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        const { error: createBucketError } = await supabase.storage
          .createBucket('public', {
            public: true
          })
        
        if (createBucketError && !createBucketError.message?.includes('already exists')) {
          return NextResponse.json(
            { error: 'ストレージの初期化に失敗しました' },
            { status: 500 }
          )
        }

        // 再度アップロードを試みる
        const { data: retryData, error: retryError } = await supabase.storage
          .from('public')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (retryError) {
          return NextResponse.json(
            { error: '画像のアップロードに失敗しました' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: '画像のアップロードに失敗しました' },
          { status: 500 }
        )
      }
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 画像削除
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: '削除する画像URLが必要です' },
        { status: 400 }
      )
    }

    // URLからファイルパスを抽出
    const urlParts = url.split('/')
    const filePath = `quiz-images/${urlParts[urlParts.length - 1]}`

    const supabase = await createClient()

    const { error } = await supabase.storage
      .from('public')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: '画像の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}