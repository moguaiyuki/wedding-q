#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise(resolve => rl.question(query, resolve))

async function runMigrations() {
  console.log('🚀 Supabase Migration Tool\n')

  // Get environment variables or prompt
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    supabaseUrl = await question('Enter Supabase URL: ')
  }

  if (!supabaseKey) {
    supabaseKey = await question('Enter Supabase Service Role Key: ')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Read migration files
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()

  console.log(`\n📁 Found ${files.length} migration files:`)
  files.forEach(file => console.log(`  - ${file}`))

  const confirm = await question('\nRun migrations? (y/n): ')
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled')
    process.exit(0)
  }

  console.log('\n⏳ Running migrations...\n')

  for (const file of files) {
    console.log(`📝 Running ${file}...`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: sql })
        .catch(async () => {
          // Fallback: Execute SQL directly using REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ query: sql })
          })
          
          if (!response.ok) {
            // If RPC doesn't exist, try direct SQL execution
            // This would require setting up the database connection differently
            throw new Error('RPC function not available. Please run migrations directly in Supabase Dashboard.')
          }
          
          return { error: null }
        })

      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
        const continueAnyway = await question('  Continue with next migration? (y/n): ')
        if (continueAnyway.toLowerCase() !== 'y') {
          process.exit(1)
        }
      } else {
        console.log(`  ✅ Success`)
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
      console.log('\n💡 Alternative: Run migrations manually in Supabase Dashboard')
      console.log('   Go to: SQL Editor → New Query → Paste migration content')
    }
  }

  console.log('\n✨ Migrations complete!')
  rl.close()
}

runMigrations().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})