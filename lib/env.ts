// Environment variable validation
// This runs at build time and startup

const requiredEnvVars = [
  'GROQ_API_KEY',
];

const allVarsPresent = requiredEnvVars.every((envVar) => {
  const isPresent = process.env[envVar];
  if (!isPresent) {
    console.warn(`⚠️  Missing environment variable: ${envVar}`);
  }
  return isPresent;
});

if (!allVarsPresent) {
  console.warn('⚠️  Some environment variables are missing. Check .env.local file.');
  console.warn('📝 Copy .env.example to .env.local and fill in the required values.');
}

export function validateEnvironment() {
  if (typeof window !== 'undefined') {
    // Client-side validation
    return true;
  }

  // Server-side validation
  const errors: string[] = [];

  if (!process.env.GROQ_API_KEY) {
    errors.push('GROQ_API_KEY is required but not set');
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical environment variables are missing');
    }
  }

  return errors.length === 0;
}

export const ENV = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
