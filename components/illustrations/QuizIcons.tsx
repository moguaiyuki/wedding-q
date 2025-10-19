export const QuizIcons = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {/* 電球 */}
      <svg className="absolute top-20 left-10 w-16 h-16 text-quiz-yellow-200" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="50" cy="35" r="15" fill="currentColor" opacity="0.3"/>
        <path d="M50 50 L50 60 M45 60 L55 60 M45 65 L55 65" strokeLinecap="round"/>
        <path d="M35 25 L30 20 M65 25 L70 20 M30 35 L25 35 M70 35 L75 35" strokeLinecap="round"/>
      </svg>

      {/* 虫眼鏡 */}
      <svg className="absolute top-32 right-20 w-20 h-20 text-quiz-teal-400 transform rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="40" cy="40" r="25" fill="currentColor" opacity="0.2"/>
        <circle cx="40" cy="40" r="25"/>
        <path d="M60 60 L80 80" strokeLinecap="round"/>
      </svg>

      {/* 鉛筆 */}
      <svg className="absolute bottom-40 left-16 w-24 h-24 text-quiz-coral-400 transform -rotate-45" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M20 80 L30 70 L70 30 L80 20 L90 30 L80 40 L40 80 L30 90 L20 80 Z" fill="currentColor" opacity="0.3"/>
        <path d="M20 80 L30 70 L70 30 L80 20 L90 30 L80 40 L40 80 L30 90 L20 80 Z"/>
        <path d="M30 70 L40 80" strokeLinecap="round"/>
      </svg>

      {/* 原子マーク */}
      <svg className="absolute top-48 right-32 w-20 h-20 text-quiz-purple-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="50" cy="50" r="5" fill="currentColor"/>
        <ellipse cx="50" cy="50" rx="30" ry="15" transform="rotate(0 50 50)"/>
        <ellipse cx="50" cy="50" rx="30" ry="15" transform="rotate(60 50 50)"/>
        <ellipse cx="50" cy="50" rx="30" ry="15" transform="rotate(120 50 50)"/>
      </svg>

      {/* 時計 */}
      <svg className="absolute bottom-32 right-24 w-16 h-16 text-quiz-pink-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.2"/>
        <circle cx="50" cy="50" r="30"/>
        <path d="M50 50 L50 30 M50 50 L65 50" strokeLinecap="round"/>
      </svg>

      {/* バスケットボール */}
      <svg className="absolute top-64 left-32 w-14 h-14 text-quiz-coral-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.2"/>
        <circle cx="50" cy="50" r="25"/>
        <path d="M50 25 Q 50 50 50 75 M25 50 Q 50 50 75 50" strokeLinecap="round"/>
      </svg>
    </div>
  )
}
