#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 YouTube Bot Manager Setup')
console.log('============================\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), '.env.local.example')

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Created .env.local from .env.local.example')
    console.log('⚠️  Please edit .env.local with your Firebase configuration\n')
  } else {
    console.log('❌ .env.local.example not found\n')
  }
} else {
  console.log('✅ .env.local already exists\n')
}

console.log('📋 Next Steps:')
console.log('1. Configure your Firebase project in .env.local')
console.log('2. Run: npm run dev')
console.log('3. (Optional) Seed database: curl -X POST http://localhost:3001/api/seed')
console.log('4. Open: http://localhost:3001\n')

console.log('📚 Documentation:')
console.log('- Firebase Console: https://console.firebase.google.com')
console.log('- Setup Guide: See README.md')
console.log('- GitHub Issues: https://github.com/your-repo/issues\n')

console.log('🎉 Setup complete! Happy coding!')