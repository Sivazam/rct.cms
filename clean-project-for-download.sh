#!/bin/bash

# Clean Project for Download Script
# This script removes unnecessary files and folders to reduce project size for download

echo "🧹 Starting project cleanup for download..."

# Remove functions node_modules (150MB+)
if [ -d "functions/node_modules" ]; then
    echo "📦 Removing functions node_modules..."
    rm -rf functions/node_modules
    echo "✅ Functions node_modules removed"
else
    echo "ℹ️  Functions node_modules not found"
fi

# Remove main node_modules if requested (warning: this will break local development)
read -p "❗ Remove main node_modules? This will break local development! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Removing main node_modules..."
    rm -rf node_modules
    echo "✅ Main node_modules removed"
    echo "⚠️  Run 'npm install' to restore dependencies"
else
    echo "ℹ️  Keeping main node_modules"
fi

# Remove .next folder (build cache)
if [ -d ".next" ]; then
    echo "🗂️  Removing .next folder..."
    rm -rf .next
    echo "✅ .next folder removed"
else
    echo "ℹ️  .next folder not found"
fi

# Remove Firebase debug logs
if [ -f "firebase-debug.log" ]; then
    echo "🗑️  Removing Firebase debug logs..."
    rm -f firebase-debug.log*
    echo "✅ Firebase debug logs removed"
else
    echo "ℹ️  No Firebase debug logs found"
fi

# Remove development logs
if [ -f "dev.log" ]; then
    echo "🗑️  Removing development logs..."
    rm -f dev.log
    echo "✅ Development logs removed"
else
    echo "ℹ️  No development logs found"
fi

# Remove test files
if [ -d "test" ]; then
    echo "🗑️  Removing test directory..."
    rm -rf test
    echo "✅ Test directory removed"
else
    echo "ℹ️  No test directory found"
fi

# Remove .firebase folder (Firebase emulator cache)
if [ -d ".firebase" ]; then
    echo "🗑️  Removing .firebase folder..."
    rm -rf .firebase
    echo "✅ .firebase folder removed"
else
    echo "ℹ️  No .firebase folder found"
fi

# Remove IDE files
echo "🗑️  Removing IDE files..."
find . -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".idea" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.swp" -delete 2>/dev/null || true
find . -name "*.swo" -delete 2>/dev/null || true
echo "✅ IDE files removed"

# Remove OS generated files
echo "🗑️  Removing OS generated files..."
find . -name "Thumbs.db" -delete 2>/dev/null || true
find . -name "Desktop.ini" -delete 2>/dev/null || true
echo "✅ OS generated files removed"

# Remove temporary files
echo "🗑️  Removing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true
echo "✅ Temporary files removed"

# Show final size
echo "📊 Final project size:"
du -sh . | head -n 1

echo ""
echo "✨ Project cleanup complete!"
echo ""
echo "📋 Summary of what was removed:"
echo "   • functions/node_modules (150MB+)"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   • main node_modules (800MB+)"
fi
echo "   • .next folder (build cache)"
echo "   • Firebase debug logs"
echo "   • Development logs"
echo "   • IDE files (.vscode, .idea)"
echo "   • OS generated files"
echo "   • Temporary files"
echo ""
echo "🔄 To restore the project for development:"
echo "   1. Run 'npm install' in the root directory"
echo "   2. Run 'cd functions && npm install' for functions dependencies"
echo ""
echo "📦 Project is now ready for download!"