interface DecorationsProps {
  className?: string
}

export const Decorations = ({ className = '' }: DecorationsProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* 星 - 大 */}
      <svg className="absolute top-10 right-16 w-8 h-8 text-quiz-yellow-200 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
      </svg>

      {/* 星 - 小 */}
      <svg className="absolute top-32 right-32 w-6 h-6 text-quiz-pink-200 animate-pulse animation-delay-200" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
      </svg>

      {/* 星 - 小 左上 */}
      <svg className="absolute top-24 left-24 w-5 h-5 text-quiz-purple-200 animate-pulse animation-delay-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z" />
      </svg>

      {/* キラキラ */}
      <svg className="absolute top-20 left-1/3 w-6 h-6 text-quiz-yellow-300 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19" strokeLinecap="round"/>
      </svg>

      <svg className="absolute bottom-24 right-1/4 w-5 h-5 text-quiz-pink-300 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19" strokeLinecap="round"/>
      </svg>

      {/* 小さな丸（装飾ドット） */}
      <div className="absolute top-16 left-1/4 w-2 h-2 rounded-full bg-quiz-blue-200 opacity-50"></div>
      <div className="absolute top-40 right-1/3 w-3 h-3 rounded-full bg-quiz-green-200 opacity-50"></div>
      <div className="absolute bottom-32 left-1/3 w-2 h-2 rounded-full bg-quiz-coral-400 opacity-50"></div>
      <div className="absolute bottom-16 right-1/4 w-2 h-2 rounded-full bg-quiz-purple-200 opacity-50"></div>

      {/* 曲線の装飾ライン */}
      <svg className="absolute top-12 left-12 w-32 h-32 text-quiz-coral-400 opacity-30" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 50 Q 30 10 50 50 T 90 50" strokeLinecap="round"/>
      </svg>

      <svg className="absolute bottom-20 right-12 w-24 h-24 text-quiz-teal-400 opacity-30" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 50 Q 30 10 50 50 T 90 50" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export const FloatingStars = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute text-quiz-yellow-200 opacity-40"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  )
}
