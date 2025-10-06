#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Copies assets from monorepo root to package dist directory
 */
function copyAssets() {
  const rootDir = path.join(__dirname, '../../../')
  const distDir = path.join(__dirname, '../dist')

  const files = ['README.md', 'LICENSE']

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory does not exist. Run build first.')
    process.exit(1)
  }

  let copiedCount = 0

  files.forEach(file => {
    const sourcePath = path.join(rootDir, file)
    const destPath = path.join(distDir, file)

    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${sourcePath}`)
      process.exit(1)
    }

    try {
      fs.copyFileSync(sourcePath, destPath)
      console.log(`✅ Copied ${file}`)
      copiedCount += 1
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error.message)
      process.exit(1)
    }
  })

  console.log(`🎉 Successfully copied ${copiedCount} files to dist/`)
}

if (require.main === module) {
  copyAssets()
}

module.exports = { copyAssets }
