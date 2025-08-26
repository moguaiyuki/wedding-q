'use client'

import { useNetworkStatus } from '@/hooks/use-network-status'
import { MESSAGES } from '@/lib/constants/messages'
import { useEffect, useState } from 'react'

export function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus()
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true)
    } else {
      // オンラインに戻ったら3秒後にメッセージを非表示
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (!showOfflineMessage && !isSlowConnection) {
    return null
  }

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
        !isOnline 
          ? 'bg-red-500 text-white' 
          : isSlowConnection 
          ? 'bg-yellow-500 text-white'
          : 'bg-green-500 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {!isOnline ? (
        MESSAGES.ERROR.NETWORK_ERROR
      ) : isSlowConnection ? (
        '接続速度が遅いため、動作が不安定になる可能性があります'
      ) : (
        '接続が回復しました'
      )}
    </div>
  )
}