'use client'

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function LoadingSpinner({ 
  className, 
  size = 'md',
  label = '読み込み中...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-wedding-pink",
        sizeClasses[size]
      )} />
      {label && (
        <p className="mt-4 text-gray-600 animate-pulse">{label}</p>
      )}
    </div>
  )
}