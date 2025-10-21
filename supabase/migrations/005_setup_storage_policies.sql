-- ストレージバケット 'pub' のRLSポリシー設定
-- 参加者へのメッセージ画像アップロードを可能にする

-- storage.objects テーブルのRLSを有効化（既に有効な場合はスキップ）
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除（クリーンな状態で再作成）
DROP POLICY IF EXISTS "Admin can upload to pub bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can read from pub bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from pub bucket" ON storage.objects;

-- 匿名ユーザー（カスタム認証を使用しているため）が pub バケットにアップロードできるポリシー
-- anon ロールは SUPABASE_ANON_KEY を使用するすべてのクライアントを指す
CREATE POLICY "Allow anon uploads to pub bucket"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'pub');

-- 公開アクセスで pub バケットから読み取りできるポリシー
CREATE POLICY "Public can read from pub bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pub');

-- 匿名ユーザーが pub バケットから削除できるポリシー
CREATE POLICY "Allow anon deletes from pub bucket"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'pub');

-- storage.buckets テーブルのRLSも設定
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 既存のバケットポリシーがあれば削除
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;

-- 全員が pub バケットの情報を読み取れるポリシー
CREATE POLICY "Public bucket access"
ON storage.buckets FOR SELECT
TO public
USING (id = 'pub');
