# PostCSS config
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOL