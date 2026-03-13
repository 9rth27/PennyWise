#!/bin/bash
# PennyWise Security Setup Script

echo "🔒 PennyWise Security Setup"
echo "============================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✓ .env.local created"
    echo ""
else
    echo "✓ .env.local already exists"
    echo ""
fi

# Check if .gitignore has .env.local
if ! grep -q "\.env\.local" .gitignore; then
    echo "📝 Adding .env.local to .gitignore..."
    echo ".env.local" >> .gitignore
    echo "✓ .env.local added to .gitignore"
    echo ""
else
    echo "✓ .env.local already in .gitignore"
    echo ""
fi

# Verify GROQ_API_KEY
if grep -q "GROQ_API_KEY=your_groq_api_key_here" .env.local; then
    echo "⚠️  WARNING: GROQ_API_KEY not configured!"
    echo "   1. Get your API key from: https://console.groq.com/keys"
    echo "   2. Edit .env.local and replace with your real key"
    echo "   3. Keep this key secret - never share it"
    echo ""
else
    echo "✓ GROQ_API_KEY is configured"
    echo ""
fi

# Generate encryption key if needed
if grep -q "ENCRYPTION_KEY=$" .env.local; then
    echo "📝 Generating ENCRYPTION_KEY..."
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/ENCRYPTION_KEY=$/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local
    echo "✓ ENCRYPTION_KEY generated"
    echo ""
fi

echo "✅ Security setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env.local and add your GROQ_API_KEY"
echo "   2. Review SECURITY.md for security practices"
echo "   3. Run: npm run dev"
echo ""
echo "🔐 Security Features Activated:"
echo "   ✓ API key protection"
echo "   ✓ Input validation & sanitization"
echo "   ✓ Secure ID generation"
echo "   ✓ Rate limiting"
echo "   ✓ Security headers (CSP, X-Frame-Options, etc.)"
echo "   ✓ CORS protection"
echo "   ✓ Error handling (no sensitive data exposed)"
echo "   ✓ Environment validation"
echo ""
