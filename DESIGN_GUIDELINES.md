# デザインガイドライン

## アクセシビリティ基準

### 文字色とコントラスト比
すべての文字色は背景色に対して適切なコントラスト比を確保する必要があります。

#### WCAG 2.1 AA基準
- 通常テキスト: 最小コントラスト比 4.5:1
- 大きなテキスト（18pt以上または14pt以上の太字）: 最小コントラスト比 3:1

#### 必須ルール
1. **白い背景には濃い色の文字を使用**
   - ❌ 悪い例: `text-gray-100`, `text-gray-200`, `text-gray-300`
   - ✅ 良い例: `text-gray-700`, `text-gray-800`, `text-gray-900`

2. **明るい背景色には濃い文字色を使用**
   - 黄色背景（`bg-yellow-50`）→ `text-yellow-700`以上
   - オレンジ背景（`bg-orange-50`）→ `text-orange-700`以上
   - グレー背景（`bg-gray-50`）→ `text-gray-700`以上

3. **ボタンやインタラクティブ要素**
   - プライマリボタン: 背景色に対して白文字を使う場合、背景色は十分に濃くする
   - セカンダリボタン: 枠線と文字色を同じ濃さにする

### Tailwind CSSの色選択ガイド

#### 背景色と文字色の組み合わせ
```
背景色          → 推奨文字色
bg-white       → text-gray-700〜900
bg-gray-50     → text-gray-700〜900
bg-gray-100    → text-gray-700〜900
bg-yellow-50   → text-yellow-700〜900
bg-orange-50   → text-orange-700〜900
bg-pink-50     → text-pink-700〜900
bg-blue-50     → text-blue-700〜900
bg-green-50    → text-green-700〜900
bg-red-50      → text-red-700〜900
bg-purple-50   → text-purple-700〜900
```

#### 濃い背景色の場合
```
背景色          → 推奨文字色
bg-gray-700〜900   → text-white
bg-blue-600〜900   → text-white
bg-green-600〜900  → text-white
bg-red-600〜900    → text-white
bg-yellow-600〜900 → text-white
bg-orange-600〜900 → text-white
bg-pink-600〜900   → text-white
bg-purple-600〜900 → text-white
```

### コード実装時のチェックリスト
- [ ] 白や明るい背景色に対して、十分に濃い文字色を使用しているか
- [ ] すべてのテキストが読みやすいか
- [ ] ホバー状態でも適切なコントラストが保たれているか
- [ ] disabled状態でも最低限の可読性があるか

### テスト方法
1. Chrome DevToolsのLighthouse機能でアクセシビリティスコアを確認
2. Wave (WebAIM) ブラウザ拡張でコントラストエラーをチェック
3. 実際の画面で目視確認

## 今後の開発における必須事項
**新しいUIコンポーネントを作成する際は、必ずこのガイドラインに従ってください。**
**特に文字色と背景色の組み合わせは、上記の表を参照して適切に選択してください。**