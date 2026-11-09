#!/bin/bash
set -e

echo "🚀 Début du déploiement de meloStart..."

# Charger nvm ou le path Node si installé
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "📥 1/5 - Récupération du code le plus récent (branche main)..."
git fetch origin main
git reset --hard origin/main

echo "📦 2/5 - Installation propre des dépendances..."
npm ci --prefer-offline --no-audit

echo "🗄️ 3/5 - Génération du client Prisma et synchronisation de la BDD..."
npx prisma generate
npx prisma db push

echo "🏗️ 4/5 - Construction du projet Next.js..."
npm run build

echo "🔄 5/5 - Rechargement PM2 (Web + Worker BullMQ)..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
  pm2 save
else
  npx pm2 reload ecosystem.config.cjs --update-env || npx pm2 start ecosystem.config.cjs
  npx pm2 save
fi

echo "🎉 Déploiement terminé avec succès !"

