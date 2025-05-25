# Tailwind config
cat > tailwind.config.js << 'EOL'
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
EOL

# PostCSS config
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOL

# Vite config
cat > vite.config.ts << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react()] })
EOL