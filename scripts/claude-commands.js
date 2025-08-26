#!/usr/bin/env node

/**
 * Claude Code Custom Commands Handler
 * This script handles custom slash commands for Claude Code
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Command definitions
const commands = {
  deploy: {
    command: 'npm run deploy',
    description: 'Deploy to Vercel production'
  },
  'deploy:quick': {
    command: 'npm run deploy:quick',
    description: 'Quick deploy without confirmation'
  },
  'deploy:preview': {
    command: 'npm run deploy:preview',
    description: 'Deploy to preview environment'
  },
  dev: {
    command: 'npm run dev',
    description: 'Start development server'
  },
  build: {
    command: 'npm run build',
    description: 'Build for production'
  },
  test: {
    command: 'npm run test:e2e',
    description: 'Run E2E tests'
  },
  'supabase:migrate': {
    command: 'npm run supabase:migrate',
    description: 'Run database migrations'
  },
  logs: {
    command: 'vercel logs --follow',
    description: 'View deployment logs'
  },
  'env:list': {
    command: 'vercel env ls',
    description: 'List environment variables'
  },
  rollback: {
    command: 'vercel rollback',
    description: 'Rollback to previous deployment'
  }
};

// Aliases for shorter commands
const aliases = {
  'd': 'deploy',
  'dq': 'deploy:quick',
  'dp': 'deploy:preview'
};

async function executeCommand(cmdName) {
  // Resolve alias if it exists
  const actualCommand = aliases[cmdName] || cmdName;
  
  // Get command details
  const cmd = commands[actualCommand];
  
  if (!cmd) {
    console.error(`❌ Unknown command: ${cmdName}`);
    console.log('\nAvailable commands:');
    Object.keys(commands).forEach(key => {
      console.log(`  /${key} - ${commands[key].description}`);
    });
    return;
  }

  console.log(`🚀 Executing: ${cmd.description}`);
  console.log(`📝 Command: ${cmd.command}\n`);

  try {
    const { stdout, stderr } = await execAsync(cmd.command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('\n✅ Command completed successfully!');
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

// Parse command from arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('🎮 Claude Code Custom Commands');
  console.log('================================\n');
  console.log('Available commands:');
  Object.keys(commands).forEach(key => {
    console.log(`  /${key} - ${commands[key].description}`);
  });
  console.log('\nAliases:');
  Object.keys(aliases).forEach(key => {
    console.log(`  /${key} → /${aliases[key]}`);
  });
} else {
  executeCommand(command.replace(/^\//, ''));
}