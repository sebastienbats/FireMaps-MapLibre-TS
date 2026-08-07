#!/usr/bin/env node

/**
 * Vérifie que la version de Node.js est >= 20.0.0
 * Exécuté automatiquement avant npm install (preinstall)
 */

const REQUIRED_NODE_MAJOR = 20;
const REQUIRED_NODE_MINOR = 0;
const REQUIRED_NODE_PATCH = 0;

const currentNodeVersion = process.versions.node;
const [major, minor, patch] = currentNodeVersion.split('.').map(Number);

const isVersionValid =
  major > REQUIRED_NODE_MAJOR ||
  (major === REQUIRED_NODE_MAJOR && minor > REQUIRED_NODE_MINOR) ||
  (major === REQUIRED_NODE_MAJOR && minor === REQUIRED_NODE_MINOR && patch >= REQUIRED_NODE_PATCH);

if (!isVersionValid) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════╗');
  console.error('║  ❌ VERSION DE NODE.JS INCOMPATIBLE                     ║');
  console.error('╠══════════════════════════════════════════════════════════╣');
  console.error(`║  Version actuelle : v${currentNodeVersion.padEnd(37)}║`);
  console.error(`║  Version requise  : v${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR}.${REQUIRED_NODE_PATCH} ou supérieure${' '.repeat(22)}║`);
  console.error('╠══════════════════════════════════════════════════════════╣');
  console.error('║  Solutions :                                            ║');
  console.error('║                                                         ║');
  console.error('║  Option 1 — nvm (recommandé) :                          ║');
  console.error('║    nvm install 20                                       ║');
  console.error('║    nvm use 20                                           ║');
  console.error('║                                                         ║');
  console.error('║  Option 2 — NodeSource :                                ║');
  console.error('║    curl -fsSL https://deb.nodesource.com/setup_20.x \\  ║');
  console.error('║      | sudo -E bash -                                   ║');
  console.error('║    sudo apt-get install -y nodejs                       ║');
  console.error('║                                                         ║');
  console.error('║  Option 3 — Docker :                                    ║');
  console.error('║    docker-compose up -d                                 ║');
  console.error('╚══════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

console.log(`✅ Node.js v${currentNodeVersion} — version compatible (>= ${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR}.${REQUIRED_NODE_PATCH})`);
