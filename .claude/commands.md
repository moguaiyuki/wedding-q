# Claude Code カスタムコマンド

このプロジェクトで利用可能なカスタムコマンドです。

## デプロイ関連

### `/deploy`
本番環境へのフルデプロイを実行します。
- ビルドの実行
- 環境変数の確認
- Vercelへのデプロイ

```
/deploy
```

### `/deploy:quick`
確認プロンプトなしで即座にデプロイします。

```
/deploy:quick
```

### `/deploy:preview`
プレビュー環境にデプロイします（本番前のテスト用）。

```
/deploy:preview
```

## 開発関連

### `/dev`
開発サーバーを起動します。

```
/dev
```

### `/build`
プロダクションビルドを実行します。

```
/build
```

### `/test`
E2Eテストを実行します。

```
/test
```

## データベース関連

### `/supabase:migrate`
Supabaseのマイグレーションを実行します。

```
/supabase:migrate
```

## 運用関連

### `/logs`
Vercelのデプロイメントログをリアルタイムで確認します。

```
/logs
```

### `/env:list`
Vercelの環境変数一覧を表示します。

```
/env:list
```

### `/rollback`
前のデプロイメントにロールバックします。

```
/rollback
```

## エイリアス（短縮コマンド）

- `/d` → `/deploy`
- `/dq` → `/deploy:quick`
- `/dp` → `/deploy:preview`

## 使用例

```bash
# 本番環境にデプロイ
/deploy

# 素早くデプロイ（確認なし）
/dq

# プレビュー環境でテスト
/dp

# ログを確認
/logs
```

## カスタムフック

### pre-deploy
デプロイ前に自動実行：
1. Lintチェック
2. 型チェック
3. ビルド検証

### post-deploy
デプロイ後に自動実行：
1. 成功メッセージ表示
2. デプロイURLの表示