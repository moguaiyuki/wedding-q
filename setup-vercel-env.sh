#!/bin/bash

# Vercel環境変数設定スクリプト

echo "Setting up Vercel environment variables..."

# Supabase
echo "https://mfnkluhblmvneblbfldr.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmtsdWhibG12bmVibGJmbGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjg3MzYsImV4cCI6MjA3MTcwNDczNn0.N4yiSNn81FnTf9IjiP-sADYjmwIDIJWEZaQe1nka3_8" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmtsdWhibG12bmVibGJmbGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEyODczNiwiZXhwIjoyMDcxNzA0NzM2fQ.qGDyb2q98Ji_CB0Qf8968rtvdE3La7Ti4u5BPJ8JJXs" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Admin
echo "admin123" | npx vercel env add ADMIN_PASSWORD production

# App URL (will be updated after deployment)
echo "https://wedding-q.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production

echo "Environment variables setup complete!"