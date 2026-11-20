#!/usr/bin/env node
/**
 * Diety Platform - 7-Day Automated Dependency Recency Auditor
 * 
 * Inspects all core packages across the monorepo against the live npm registry
 * and flags newer major, minor, or patch releases.
 * 
 * Usage:
 *   node scripts/check-dependency-updates.mjs
 */

import https from 'node:https';

const CORE_DEPENDENCIES = [
  // Backend & Real-time API
  { name: '@nestjs/core', category: 'Backend API', current: '12.6.0' },
  { name: '@nestjs/common', category: 'Backend API', current: '12.6.0' },
  { name: '@nestjs/platform-express', category: 'Backend API', current: '12.6.0' },
  { name: '@nestjs/websockets', category: 'Backend API', current: '12.6.0' },
  { name: '@nestjs/platform-socket.io', category: 'Backend API', current: '12.6.0' },
  { name: '@prisma/client', category: 'Database ORM', current: '7.10.1' },
  { name: 'prisma', category: 'Database ORM (CLI)', current: '7.10.1' },
  { name: 'ioredis', category: 'Infrastructure', current: '6.0.0' },
  { name: 'bullmq', category: 'Infrastructure', current: '6.7.8' },
  { name: 'ollama', category: 'AI Client', current: '0.6.4' },
  { name: 'minio', category: 'Object Storage', current: '8.0.7' },
  { name: 'argon2', category: 'Security', current: '0.45.2' },
  { name: 'zod', category: 'Validation', current: '4.6.7' },
  { name: 'socket.io', category: 'Real-time Gateway', current: '4.8.4' },

  // Web & Admin Console
  { name: 'next', category: 'Web & Admin Framework', current: '16.4.6' },
  { name: 'react', category: 'UI Core', current: '19.3.1' },
  { name: 'react-dom', category: 'UI Core', current: '19.3.1' },
  { name: 'tailwindcss', category: 'Styling', current: '4.3.5' },
  { name: '@tanstack/react-query', category: 'State Management', current: '5.108.2' },
  { name: 'zustand', category: 'State Management', current: '5.1.0' },
  { name: '@tanstack/react-table', category: 'Data Grid', current: '9.3.1' },
  { name: 'lucide-react', category: 'Icons', current: '1.77.0' },
  { name: 'recharts', category: 'Visualization', current: '3.11.0' },

  // Mobile App
  { name: 'expo', category: 'Mobile Framework', current: '58.0.26' },
  { name: 'react-native', category: 'Mobile Core', current: '0.88.1' },
  { name: 'expo-router', category: 'Mobile Navigation', current: '58.0.32' },
  { name: 'react-native-webrtc', category: 'Mobile WebRTC', current: '155.0.1' },
  { name: 'nativewind', category: 'Mobile Styling', current: '4.2.7' },

  // Monorepo & Tooling
  { name: 'turbo', category: 'Build Orchestration', current: '2.11.13' },
  { name: 'typescript', category: 'Compiler', current: '7.0.2' },
  { name: 'vitest', category: 'Testing Engine', current: '5.1.1' },
  { name: 'eslint', category: 'Linter', current: '10.15.0' },
  { name: 'prettier', category: 'Formatter', current: '3.10.1' }
];

async function fetchNpmData(pkgName) {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`, {
      headers: { 'User-Agent': 'Diety-Dependency-Auditor/1.0.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve({
              latest: parsed['dist-tags']?.latest || 'UNKNOWN',
              homepage: parsed.homepage || 'N/A'
            });
          } else {
            resolve({ latest: 'ERROR_' + res.statusCode, homepage: 'N/A' });
          }
        } catch (e) {
          resolve({ latest: 'PARSE_ERROR', homepage: 'N/A' });
        }
      });
    }).on('error', (err) => {
      resolve({ latest: 'NET_ERROR', homepage: 'N/A' });
    });
  });
}

function parseSemVer(v) {
  const cleaned = v.replace(/^[^\d]*/, '').split('-')[0];
  const parts = cleaned.split('.').map(n => parseInt(n, 10) || 0);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function getUpgradeType(current, latest) {
  if (current === latest) return 'CURRENT';
  const c = parseSemVer(current);
  const l = parseSemVer(latest);
  if (l.major > c.major) return 'MAJOR_UPGRADE';
  if (l.minor > c.minor) return 'MINOR_UPGRADE';
  if (l.patch > c.patch) return 'PATCH_UPGRADE';
  return 'DIFFERENT';
}

async function runAudit() {
  console.log('='.repeat(80));
  console.log('DIETY PLATFORM - 7-DAY RECURRING DEPENDENCY RECENCY AUDIT');
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const results = [];
  let updatesAvailable = 0;

  for (const dep of CORE_DEPENDENCIES) {
    process.stdout.write(`Scanning ${dep.name}... `);
    const npmInfo = await fetchNpmData(dep.name);
    const status = getUpgradeType(dep.current, npmInfo.latest);
    
    if (status !== 'CURRENT') {
      updatesAvailable++;
      console.log(`[!] ${status}: ${dep.current} -> ${npmInfo.latest}`);
    } else {
      console.log(`[OK] Current (${dep.current})`);
    }

    results.push({
      ...dep,
      latest: npmInfo.latest,
      status,
      homepage: npmInfo.homepage
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('AUDIT SUMMARY REPORT');
  console.log('='.repeat(80));
  console.table(results.map(r => ({
    Package: r.name,
    Category: r.category,
    'Current Target': r.current,
    'Latest Registry': r.latest,
    Status: r.status
  })));

  if (updatesAvailable > 0) {
    console.warn(`\n[WARNING] ${updatesAvailable} package(s) have newer versions available on npm.`);
    console.warn('Action: Review changelogs, test compatibility, and update CODE_SPECIFICATION_AND_DEPENDENCIES.md.');
  } else {
    console.log('\n[SUCCESS] All core dependencies are at their exact latest live releases!');
  }
  console.log('='.repeat(80));
}

runAudit();
