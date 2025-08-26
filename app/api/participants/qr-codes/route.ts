import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth'
import * as QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('id')
    const format = searchParams.get('format') || 'dataUrl'

    if (!participantId) {
      return NextResponse.json(
        { error: '参加者IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: participant, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', participantId)
      .single()

    if (error || !participant) {
      return NextResponse.json(
        { error: '参加者が見つかりません' },
        { status: 404 }
      )
    }

    // QRコードのデータ - 本番環境または環境変数から取得したURLを使用
    // 環境変数に改行が含まれる可能性があるためtrimする
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://wedding-q.vercel.app').trim()
    const qrData = `${baseUrl}/participant?qr=${participant.qr_code}`
    
    // QRコードのオプション
    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      type: format === 'svg' ? 'svg' as const : 'image/png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    }

    if (format === 'svg') {
      const svgString = await QRCode.toString(qrData, {
        ...qrOptions,
        type: 'svg'
      })
      
      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    } else if (format === 'png') {
      const buffer: any = await QRCode.toBuffer(qrData, qrOptions as any)
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
        },
      })
    } else {
      // Data URLとして返す
      const dataUrl = await QRCode.toDataURL(qrData, qrOptions as any)
      
      return NextResponse.json({
        participantId,
        name: participant.name,
        qrCode: participant.qr_code,
        qrCodeImage: dataUrl,
        seatNumber: participant.seat_number,
        groupType: participant.group_type
      })
    }
  } catch (error) {
    console.error('QR Code API error:', error)
    return NextResponse.json(
      { error: 'QRコード生成に失敗しました' },
      { status: 500 }
    )
  }
}

// 全参加者のQRコードを一括生成
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    const { data: participants, error } = await supabase
      .from('users')
      .select('*')
      .order('seat_number', { ascending: true })

    if (error) {
      console.error('Fetch participants error:', error)
      return NextResponse.json(
        { error: '参加者の取得に失敗しました' },
        { status: 500 }
      )
    }

    const qrCodes = await Promise.all(
      participants.map(async (participant) => {
        // QRコードのデータ - 本番環境または環境変数から取得したURLを使用
        // 環境変数に改行が含まれる可能性があるためtrimする
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://wedding-q.vercel.app').trim()
        const qrData = `${baseUrl}/participant?qr=${participant.qr_code}`
        const dataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 256,
        })
        
        return {
          id: participant.id,
          name: participant.name,
          qrCode: participant.qr_code,
          qrCodeImage: dataUrl,
          seatNumber: participant.seat_number,
          groupType: participant.group_type
        }
      })
    )

    return NextResponse.json(qrCodes)
  } catch (error) {
    console.error('QR Codes generation error:', error)
    return NextResponse.json(
      { error: 'QRコード一括生成に失敗しました' },
      { status: 500 }
    )
  }
}