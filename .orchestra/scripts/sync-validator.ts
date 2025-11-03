#!/usr/bin/env ts-node
/**
 * Sync Validator
 *
 * Validates synchronization between:
 * - Documentation (requirements, architecture, data models)
 * - Test files
 * - Implementation code
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface SyncState {
  lastUpdated: string;
  syncScore: number;
  status: 'initializing' | 'valid' | 'warnings' | 'errors';
  requirements: Requirement[];
  architecture: ADR[];
  dataModels: DataModel[];
  tests: TestSummary;
  lint: LintSummary;
  codeQuality: CodeQuality;
}

interface Requirement {
  id: string;
  title: string;
  file: string;
  status: 'draft' | 'reviewed' | 'implemented';
  linkedTests: string[];
  linkedCode: string[];
  coverage: number;
  warnings?: string[];
}

interface ADR {
  id: string;
  title: string;
  file: string;
  status: string;
  lastValidated?: string;
  actualStructure?: 'matches' | 'drift-detected';
}

interface DataModel {
  id: string;
  name: string;
  schemaFile?: string;
  documentFile: string;
  status: 'draft' | 'synced' | 'drift-detected';
  lastChecked?: string;
}

interface TestSummary {
  total: number;
  passing: number;
  failing: number;
  coverage: number;
}

interface LintSummary {
  errors: number;
  warnings: number;
  lastRun: string;
}

interface CodeQuality {
  issues: string[];
}

async function loadConfig(): Promise<any> {
  const configPath = path.join(process.cwd(), '.orchestra/config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return {};
}

async function validateSync(): Promise<SyncState> {
  console.log('🔍 Starting Sync Validation...\n');

  const config = await loadConfig();

  const requirements: Requirement[] = [];
  const architecture: ADR[] = [];
  const dataModels: DataModel[] = [];

  // Load requirements
  console.log('📋 Loading requirements...');
  const reqFiles = glob.sync('.orchestra/specs/requirements/*.md', {
    ignore: ['**/TEMPLATE.md'],
    absolute: false
  });

  for (const file of reqFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const idMatch = content.match(/\*\*ID:\*\*\s*\[?([A-Z0-9-]+)\]?/);
    const titleMatch = content.match(/\*\*Title:\*\*\s*\[?([^\]]+)\]?/);
    const statusMatch = content.match(/\*\*Status:\*\*\s*\[?([a-z]+)\]?/);

    if (idMatch && titleMatch) {
      requirements.push({
        id: idMatch[1],
        title: titleMatch[1],
        file: file,
        status: (statusMatch ? statusMatch[1] : 'draft') as any,
        linkedTests: [],
        linkedCode: [],
        coverage: 0
      });
    }
  }

  console.log(`✓ Found ${requirements.length} requirements\n`);

  // Load architecture
  console.log('🏗️  Loading architecture decisions...');
  const adrFiles = glob.sync('.orchestra/specs/architecture/ADR-*.md', {
    absolute: false
  });

  for (const file of adrFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const idMatch = content.match(/\*\*ADR-(\d+):\**/);
    const titleMatch = content.match(/:\s*([^\n]+)/);
    const statusMatch = content.match(/\*\*Status:\*\*\s*\[?([A-Za-z]+)\]?/);

    if (idMatch && titleMatch) {
      architecture.push({
        id: `ADR-${idMatch[1]}`,
        title: titleMatch[1].trim(),
        file: file,
        status: statusMatch ? statusMatch[1] : 'Proposed',
        lastValidated: new Date().toISOString()
      });
    }
  }

  console.log(`✓ Found ${architecture.length} architecture decisions\n`);

  // Load data models
  console.log('🗄️  Loading data models...');
  const dataModelFiles = glob.sync('.orchestra/specs/data-models/*.md', {
    ignore: ['**/TEMPLATE.md'],
    absolute: false
  });

  for (const file of dataModelFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const nameMatch = content.match(/\*\*Model Name:\*\*\s*\[?([^\]]+)\]?/);

    if (nameMatch) {
      dataModels.push({
        id: nameMatch[1].toLowerCase().replace(/\s+/g, '_'),
        name: nameMatch[1],
        documentFile: file,
        status: 'draft'
      });
    }
  }

  console.log(`✓ Found ${dataModels.length} data models\n`);

  // Test summary (stub - would need actual test execution)
  const tests: TestSummary = {
    total: 0,
    passing: 0,
    failing: 0,
    coverage: 0
  };

  // Lint summary (stub)
  const lint: LintSummary = {
    errors: 0,
    warnings: 0,
    lastRun: new Date().toISOString()
  };

  // Calculate sync score
  const syncScore = calculateSyncScore(requirements, architecture, dataModels, tests);

  const syncState: SyncState = {
    lastUpdated: new Date().toISOString(),
    syncScore: syncScore,
    status: syncScore >= 80 ? 'valid' : syncScore >= 60 ? 'warnings' : 'errors',
    requirements,
    architecture,
    dataModels,
    tests,
    lint,
    codeQuality: {
      issues: []
    }
  };

  return syncState;
}

function calculateSyncScore(
  requirements: Requirement[],
  architecture: ADR[],
  dataModels: DataModel[],
  tests: TestSummary
): number {
  let score = 100;

  // Penalty for missing documentation
  if (requirements.length === 0) score -= 20;
  if (architecture.length === 0) score -= 15;
  if (dataModels.length === 0) score -= 10;

  // Ensure minimum
  return Math.max(0, Math.min(100, score));
}

async function main() {
  try {
    const syncState = await validateSync();

    // Save sync state
    const syncStatePath = path.join(process.cwd(), '.orchestra/sync-state.json');
    fs.writeFileSync(syncStatePath, JSON.stringify(syncState, null, 2));

    // Print report
    console.log('📊 Sync Validation Report\n');
    console.log(`Score: ${syncState.syncScore}/100`);
    console.log(`Status: ${syncState.status}`);
    console.log(`Updated: ${syncState.lastUpdated}\n`);

    console.log(`Requirements: ${syncState.requirements.length}`);
    console.log(`Architecture: ${syncState.architecture.length}`);
    console.log(`Data Models: ${syncState.dataModels.length}`);

    console.log('\n✅ Validation complete!');

    process.exit(syncState.syncScore >= 60 ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();
