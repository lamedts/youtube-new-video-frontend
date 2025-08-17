

export function isFirebaseConfigured(): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ]

  return requiredEnvVars.every(envVar =>
    process.env[envVar] && process.env[envVar] !== 'your_api_key_here'
  )
}
