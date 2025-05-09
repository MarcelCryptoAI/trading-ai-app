#!/usr/bin/env bash
set -e

echo "🚀 TailwindCSS & PostCSS Setup Script"

# 1) Ga naar de frontend-map
cd frontend

# 2) Installeer de dev-deps
echo "📦 Installing devDependencies..."
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss

# 3) Initialiseer Tailwind (maakt tailwind.config.js + postcss.config.js)
echo "🎛️  Running npx tailwindcss init -p ..."
npx tailwindcss init -p

# 4) Hernoem de PostCSS-config naar CommonJS
echo "✏️  Renaming postcss.config.js → postcss.config.cjs ..."
mv postcss.config.js postcss.config.cjs

# 5) Overschrijf postcss.config.cjs
cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
EOF
echo "✅ postcss.config.cjs configured."

# 6) Overschrijf tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF
echo "✅ tailwind.config.js configured."

# 7) Schrijf de Tailwind-directieven in src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
echo "✅ src/index.css updated."

echo ""
echo "🎉 All set! Now:"
echo "   cd frontend"
echo "   npm run dev"
