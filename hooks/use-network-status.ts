'use client'

import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    // 初期状態の設定
    setIsOnline(navigator.onLine)

    // 接続速度の確認
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    let updateConnectionStatus: (() => void) | undefined

    if (connection) {
      updateConnectionStatus = () => {
        // 2G or slow-2g を遅い接続として判定
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g'
        )
      }

      updateConnectionStatus()
      connection.addEventListener('change', updateConnectionStatus)
    }

    // オンライン/オフラインイベントのリスナー
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection && updateConnectionStatus) {
        connection.removeEventListener('change', updateConnectionStatus)
      }
    }
  }, [])

  return { isOnline, isSlowConnection }
}