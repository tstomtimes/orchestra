/**
 * Default Configuration Values for Progress Tracker
 *
 * Provides sensible defaults for all configuration options.
 */

import {
  ProgressTrackerConfig,
  RenderTheme,
  MilestoneRule,
  MilestoneType,
  Priority,
} from '../types/progress-tracker.types';

/**
 * Default render options
 */
export const DEFAULT_RENDER_OPTIONS = {
  theme: RenderTheme.UNICODE,
  showStatus: true,
  showProgress: true,
  showTimestamps: false,
  showMetadata: false,
  maxDepth: undefined,
  collapseCompleted: false,
  highlightCurrent: true,
  colorize: true,
  maxWidth: 120,
  indent: 2,
};

/**
 * Default progress tracker configuration
 */
export const DEFAULT_CONFIG: ProgressTrackerConfig = {
  autoDetectMilestones: true,
  persistState: false,
  stateFilePath: '.orchestra/progress-state.json',
  maxTaskHistory: 1000,
  renderOptions: DEFAULT_RENDER_OPTIONS,
  performanceMode: false,
  maxTasks: 10000,
};

/**
 * Default milestone detection rules
 */
export const DEFAULT_MILESTONE_RULES: MilestoneRule[] = [
  {
    id: 'phase-detection',
    name: 'Phase Detection',
    pattern: /^(?:Phase|フェーズ)\s*(\d+)/i,
    type: MilestoneType.PHASE,
    priority: Priority.HIGH,
    autoCreate: true,
  },
  {
    id: 'setup-detection',
    name: 'Setup Detection',
    pattern: /^(?:Setup|セットアップ|初期化)/i,
    type: MilestoneType.CHECKPOINT,
    priority: Priority.MEDIUM,
    autoCreate: true,
  },
  {
    id: 'implementation-detection',
    name: 'Implementation Detection',
    pattern: /^(?:Implement|実装|作成|Create)/i,
    type: MilestoneType.FEATURE,
    priority: Priority.MEDIUM,
    autoCreate: true,
  },
  {
    id: 'testing-detection',
    name: 'Testing Detection',
    pattern: /^(?:Test|テスト|検証)/i,
    type: MilestoneType.CHECKPOINT,
    priority: Priority.MEDIUM,
    autoCreate: true,
  },
  {
    id: 'release-detection',
    name: 'Release Detection',
    pattern: /^(?:Release|リリース|Deploy|デプロイ)/i,
    type: MilestoneType.RELEASE,
    priority: Priority.CRITICAL,
    autoCreate: true,
  },
];

/**
 * Status icons for different themes
 */
export const STATUS_ICONS = {
  [RenderTheme.UNICODE]: {
    pending: '○',
    in_progress: '◐',
    completed: '●',
    blocked: '⊗',
    failed: '✗',
  },
  [RenderTheme.ASCII]: {
    pending: '[ ]',
    in_progress: '[~]',
    completed: '[x]',
    blocked: '[!]',
    failed: '[X]',
  },
  [RenderTheme.EMOJI]: {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    blocked: '🚫',
    failed: '❌',
  },
  [RenderTheme.MINIMAL]: {
    pending: '-',
    in_progress: '>',
    completed: '+',
    blocked: '!',
    failed: 'x',
  },
};

/**
 * Tree drawing characters for different themes
 */
export const TREE_CHARS = {
  [RenderTheme.UNICODE]: {
    vertical: '│',
    horizontal: '─',
    branch: '├',
    last: '└',
    space: ' ',
  },
  [RenderTheme.ASCII]: {
    vertical: '|',
    horizontal: '-',
    branch: '+',
    last: '`',
    space: ' ',
  },
  [RenderTheme.EMOJI]: {
    vertical: '┃',
    horizontal: '━',
    branch: '┣',
    last: '┗',
    space: ' ',
  },
  [RenderTheme.MINIMAL]: {
    vertical: ' ',
    horizontal: ' ',
    branch: ' ',
    last: ' ',
    space: ' ',
  },
};

/**
 * ANSI color codes
 */
export const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

/**
 * Maximum values for safety
 */
export const LIMITS = {
  MAX_TASK_CONTENT_LENGTH: 500,
  MAX_TASK_DEPTH: 10,
  MAX_CHILDREN_PER_TASK: 100,
  MAX_MILESTONES: 50,
  MAX_TASKS_PER_MILESTONE: 500,
};
