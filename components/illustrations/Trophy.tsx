export const Trophy = () => {
  return (
    <div className="w-full max-w-md mx-auto my-8">
      <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* トロフィー */}
        <g transform="translate(90, 80)">
          {/* トロフィーのカップ */}
          <path
            d="M30 20 L30 50 Q 30 70 60 70 Q 90 70 90 50 L90 20 Z"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <rect x="55" y="70" width="10" height="20" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
          <rect x="40" y="90" width="40" height="8" rx="4" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>

          {/* トロフィーの取っ手（左） */}
          <path
            d="M30 25 Q 15 25 15 35 Q 15 45 25 45"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3"
          />

          {/* トロフィーの取っ手（右） */}
          <path
            d="M90 25 Q 105 25 105 35 Q 105 45 95 45"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3"
          />

          {/* 星の装飾 */}
          <path
            d="M60 35 L62 42 L69 42 L63 47 L65 54 L60 49 L55 54 L57 47 L51 42 L58 42 Z"
            fill="#FFF"
            opacity="0.8"
          />
        </g>

        {/* 人物 */}
        <g transform="translate(180, 100)">
          {/* 頭 */}
          <circle cx="40" cy="30" r="18" fill="#FFD6A5" stroke="#E8B87D" strokeWidth="2"/>

          {/* 髪 */}
          <path
            d="M25 20 Q 22 15 25 12 Q 30 8 40 8 Q 50 8 55 12 Q 58 15 55 20"
            fill="#5D4E37"
          />

          {/* 目 */}
          <circle cx="33" cy="30" r="2" fill="#000"/>
          <circle cx="47" cy="30" r="2" fill="#000"/>

          {/* 笑顔 */}
          <path
            d="M30 37 Q 40 42 50 37"
            fill="none"
            stroke="#000"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* 体（セーター） */}
          <path
            d="M25 48 L25 90 L55 90 L55 48"
            fill="#6B9FA3"
            stroke="#5C8A8F"
            strokeWidth="2"
          />
          <rect x="25" y="48" width="30" height="10" fill="#6B9FA3"/>

          {/* 腕（左） */}
          <path
            d="M25 50 L10 70 L5 75"
            fill="none"
            stroke="#6B9FA3"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* 腕（右・トロフィーを持つ） */}
          <path
            d="M55 50 L60 65"
            fill="none"
            stroke="#6B9FA3"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* ズボン */}
          <rect x="25" y="90" width="13" height="30" fill="#C17B5C" stroke="#A86B4C" strokeWidth="2"/>
          <rect x="42" y="90" width="13" height="30" fill="#C17B5C" stroke="#A86B4C" strokeWidth="2"/>

          {/* 靴 */}
          <ellipse cx="31" cy="122" rx="8" ry="4" fill="#5C8A8F"/>
          <ellipse cx="48" cy="122" rx="8" ry="4" fill="#5C8A8F"/>
        </g>

        {/* 紙・書類の装飾 */}
        <g transform="translate(20, 200)" opacity="0.6">
          <rect x="0" y="0" width="30" height="35" rx="2" fill="#FFF" stroke="#E0E0E0" strokeWidth="1.5"/>
          <line x1="5" y1="8" x2="25" y2="8" stroke="#FFB6C1" strokeWidth="2"/>
          <line x1="5" y1="15" x2="25" y2="15" stroke="#E0E0E0" strokeWidth="1.5"/>
          <line x1="5" y1="20" x2="20" y2="20" stroke="#E0E0E0" strokeWidth="1.5"/>
        </g>

        {/* 星の装飾 */}
        <g opacity="0.7">
          <path d="M50 40 L52 45 L57 45 L53 48 L55 53 L50 50 L45 53 L47 48 L43 45 L48 45 Z" fill="#FFD700"/>
          <path d="M240 60 L241 63 L244 63 L242 65 L243 68 L240 66 L237 68 L238 65 L236 63 L239 63 Z" fill="#FFB6C1"/>
          <path d="M270 180 L271.5 184 L275 184 L272.5 186 L274 190 L270 187.5 L266 190 L267.5 186 L265 184 L268.5 184 Z" fill="#C5E3E8"/>
        </g>
      </svg>
    </div>
  )
}
