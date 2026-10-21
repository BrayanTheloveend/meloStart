# 🎵 melostars - Plateforme de Génération Musicale par IA

Plateforme SaaS de composition et génération de morceaux musicaux par IA (modèles Suno V6), combinant une interface studio réactive, un système de paiement par Notes (Stripe), une supervision complète de VPS Hostinger et une architecture de traitement distribuée avec **Redis** et **BullMQ** (100% gratuits et open-source).

---

## ⚡ Architecture BullMQ & Redis (100% Gratuit)

La plateforme utilise **Redis** (moteur in-memory) et **BullMQ** (gestionnaire de files de tâches distribuées) pour orchestrer les rendus audio en arrière-plan sans bloquer l'Event Loop HTTP :

1. **Producteur (Next.js)** : Lorsqu'un utilisateur lance une génération (`POST /api/tracks/generate`), le travail est inséré dans la file `music-generation` (`src/lib/queue.js`).
2. **Consommateur (Worker BullMQ)** : Le worker (`workers/musicProcessor.js`) traite les tâches avec une concurrence paramétrable (`WORKER_CONCURRENCY=2`), met à jour la progression (15% ➔ 50% ➔ 80% ➔ 100%) et persiste les masters audio dans PostgreSQL et le stockage local.
3. **Résilience Hybride** : Si Redis est temporairement hors ligne, un mécanisme de relais immédiat assure qu'aucune requête utilisateur n'échoue.

---

## 🚀 Démarrage Rapide

### 1. Prérequis

- **Node.js** 18+
- **PostgreSQL** 14+ (ex: `localhost:5432`)
- **Redis Server** (gratuit, port 6379) :
  - Sur Ubuntu / Debian (VPS Hostinger) :
    ```bash
    sudo apt update && sudo apt install -y redis-server
    sudo systemctl enable redis-server && sudo systemctl start redis-server
    ```
  - Sur macOS :
    ```bash
    brew install redis
    brew services start redis
    ```

### 2. Configuration d'environnement (`.env`)

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/melostart_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_jwt_32_caracteres"

# File d'Attente BullMQ & Broker Redis (Gratuit)
REDIS_URL="redis://localhost:6379"
WORKER_CONCURRENCY="2"

# Clé API Suno (optionnel)
AI_MUSIC_API_KEY="7bc836ab5b03534d3cfda2ac3acde911"
```

### 3. Lancer l'Application & les Workers

```bash
# Terminal 1 : Serveur Web Next.js (Dashboard & Studio)
npm run dev

# Terminal 2 : Worker BullMQ de Rendu Audio (Optionnel en local, recommandé en production)
npm run worker
```

---

## 📊 Tableaux de Bord Administrateur

- `/dashboard` : Vue d'ensemble des revenus, utilisateurs, titres générés et métriques globales.
- `/dashboard/vps` : Supervision hardware Hostinger KVM (CPU, RAM, NVMe SSD, bande passante, console live syslog).
- `/dashboard/system` : État de santé BullMQ, Redis (port 6379), PostgreSQL, Suno AI API et bouton de purge de la file.
- `/studio` : Studio interactif de composition musicale pour les utilisateurs.

