# Dockerisation de l'environnement de dev local

## Contexte

Le dev travaille sur 2 PC et doit aujourd'hui recopier manuellement `server/config/.env`
et reconfigurer son environnement Node sur chaque machine. Objectif : un environnement
de dev local reproductible, lancé en une commande, avec hot reload back + front.

La prod (déploiement FTP vers hébergement mutualisé o2switch) est hors scope — ce
document ne couvre que le développement local.

## Décisions issues du brainstorming

- **Base de données** : pas de Mongo conteneurisé. Le backend continue de se connecter
  à l'Atlas existant (même DB qu'aujourd'hui, y compris en dev) via `server/config/.env`.
  Aucun changement de comportement sur ce point — hors sujet pour cette tâche.
- **Secrets** : `server/config/.env` reste un fichier local par PC, copié manuellement
  une fois (pas de solution de sync automatique). Docker Compose le lit via `env_file`.
- **Approche** : tout dockerisé (backend + frontend), plutôt qu'un hybride
  backend-only + frontend natif — répond à l'exigence d'une commande unique.
- **Hot reload fiable sur Windows** : le repo vit sur le filesystem Windows, pas dans
  WSL2 natif, donc les événements filesystem ne traversent pas toujours le bind mount
  Docker Desktop de façon fiable. Le polling est activé explicitement (nodemon `-L`,
  Angular CLI `--poll 500`) pour garantir la détection des changements, au prix d'un
  léger surcoût CPU en tâche de fond jugé acceptable.

## Architecture

```
docker-compose.yml (racine)
├── service "server"  → build server/Dockerfile.dev
│     - bind mount ./server:/app (code source)
│     - volume anonyme /app/node_modules (isolé du host)
│     - env_file: server/config/.env
│     - port 4000:4000
│     - CMD: npm run dev:docker  (nodemon -L --exec ts-node index.ts)
│
└── service "client"  → build client-ng/Dockerfile.dev
      - bind mount ./client-ng:/app (code source)
      - volume anonyme /app/node_modules (isolé du host)
      - port 4200:4200
      - depends_on: server
      - CMD: npm run start:docker  (ng serve --host 0.0.0.0
             --proxy-config proxy.conf.docker.json --poll 500)
```

Le frontend proxifie `/api`, `/jwtid`, `/uploads` vers `http://server:4000`
(nom de service Compose, résolu par le DNS interne Docker) au lieu de
`http://localhost:4000` utilisé par `proxy.conf.json` en natif — d'où le fichier
`proxy.conf.docker.json` séparé, sans toucher au comportement natif existant.

## Fichiers à créer

- `docker-compose.yml`
- `server/Dockerfile.dev`
- `server/.dockerignore` (exclut `node_modules`, `dist`, `coverage`)
- `client-ng/Dockerfile.dev`
- `client-ng/.dockerignore` (exclut `node_modules`, `dist`, `.angular`)
- `client-ng/proxy.conf.docker.json` (copie de `proxy.conf.json`, cible `http://server:4000`)

## Fichiers à modifier

- `server/package.json` : ajout du script `dev:docker` (`nodemon -L --exec ts-node index.ts`).
  Le script `dev` natif existant n'est pas touché.
- `client-ng/package.json` : ajout du script `start:docker`
  (`ng serve --host 0.0.0.0 --proxy-config proxy.conf.docker.json --poll 500`).
  Le script `start` natif existant n'est pas touché.

## Pourquoi exclure node_modules du bind mount

Le bind mount monte tout le dossier source dans le conteneur, `node_modules` inclus.
Or l'image installe ses dépendances pour Linux (ex. binaires natifs `bcrypt` compilés
pour Alpine), alors que le `node_modules` présent sur l'hôte Windows contient des
binaires compilés pour Windows. Un volume anonyme sur `/app/node_modules` masque le
contenu du bind mount à cet endroit précis et conserve celui installé dans l'image au
build, évitant un crash au démarrage du conteneur.

## Vérification

Pas de tests automatisés pour cette tâche (infra de dev, pas de logique applicative
modifiée). Vérification manuelle :

1. `docker compose up --build`
2. Ouvrir `http://localhost:4200`, confirmer que l'app charge et que les appels API
   (proxifiés vers le conteneur `server`) fonctionnent
3. Modifier un fichier dans `client-ng/src/` → confirmer le hot reload navigateur
4. Modifier un fichier dans `server/` (ex. un controller) → confirmer le redémarrage
   nodemon dans les logs du conteneur `server`

## Hors scope

- Dockerisation de la prod (bloquée par l'hébergement mutualisé o2switch actuel,
  incompatible avec des conteneurs — nécessiterait une migration d'hébergement,
  discussion séparée)
- Isolation de la DB de dev vis-à-vis de la prod (base Atlas unique conservée telle quelle)
