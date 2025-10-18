# マイグレーション実行ガイド

## 複数回答式問題機能の追加 (Migration 004)

このマイグレーションは、複数回答式 (multiple_answer) の問題タイプを追加します。

### 実行方法

#### オプション1: Supabase SQL Editor を使用（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト `mfnkluhblmvneblbfldr` を選択
3. 左メニューから **SQL Editor** を選択
4. **New Query** をクリック
5. `supabase/migrations/004_add_multiple_answer_type.sql` の内容をコピー&ペースト
6. **Run** をクリックして実行

#### オプション2: Supabase CLI を使用

```bash
# Supabase CLI をインストール（未インストールの場合）
brew install supabase/tap/supabase

# プロジェクトにリンク
supabase link --project-ref mfnkluhblmvneblbfldr

# マイグレーションを適用
supabase db push
```

### マイグレーション内容

このマイグレーションは以下の変更を行います:

1. **questions テーブル**
   - `question_type` 列に 'multiple_answer' を追加
   - CHECK制約を更新

2. **choices テーブル**
   - `points` 列を追加 (INTEGER, デフォルト: 0)
   - 各選択肢に個別の配点を設定可能に

3. **answers テーブル**
   - `selected_choice_ids` 列を追加 (JSONB)
   - 複数選択の回答を記録可能に

### 実行確認

マイグレーション実行後、以下のSQLで確認できます:

```sql
-- choices テーブルに points 列が存在するか確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'choices' AND column_name = 'points';

-- answers テーブルに selected_choice_ids 列が存在するか確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'answers' AND column_name = 'selected_choice_ids';

-- question_type に multiple_answer が含まれるか確認
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%question_type%';
```

### 既存データへの影響

- 既存の問題データには影響ありません
- choices テーブルの既存レコードには points = 0 が設定されます
- answers テーブルの既存レコードの selected_choice_ids は NULL のままです

### トラブルシューティング

**エラー: "column already exists"**
- すでにマイグレーションが適用されています
- 確認SQLを実行して列の存在を確認してください

**エラー: "permission denied"**
- Supabase Dashboard の SQL Editor から実行してください
- サービスロールの権限が必要です

## 次のステップ

マイグレーション完了後:

1. ✅ 開発サーバーを再起動
2. ✅ 管理画面で複数回答式問題を作成
3. ✅ 参加者画面で回答をテスト
4. ✅ 結果表示画面で正しく表示されることを確認
5. ✅ プレゼンテーション画面で統計が正しく表示されることを確認
