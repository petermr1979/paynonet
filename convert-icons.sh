#!/bin/bash
# Скрипт для конвертации SVG иконок в PNG формат
# Требуется установленный ImageMagick

echo "🔄 Конвертация иконок PNN Wallet..."

# Проверка наличия ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick не найден. Установите командой:"
    echo "   brew install imagemagick"
    exit 1
fi

# Создание директории если не существует
mkdir -p assets/icons

# Конвертация иконок
echo "📱 Создание apple-touch-icon.png (180x180)..."
convert assets/icons/icon.svg -resize 180x180 assets/icons/apple-touch-icon.png

echo "📱 Создание icon-192.png (192x192)..."
convert assets/icons/icon-192.svg -resize 192x192 assets/icons/icon-192.png

echo "📱 Создание icon-512.png (512x512)..."
convert assets/icons/icon-512.svg -resize 512x512 assets/icons/icon-512.png

echo "✅ Конвертация завершена!"
echo ""
echo "Созданные файлы:"
ls -la assets/icons/*.png 2>/dev/null || echo "❌ Файлы не созданы"
