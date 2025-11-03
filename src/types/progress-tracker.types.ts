/**
 * Progress Tracker Type Definitions
 *
 * Core type system for the Orchestra Progress Tracker.
 * Supports task management, milestone detection, and tree visualization.
 */

/**
 * Task status enum representing the current state of a task
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  FAILED = 'failed',
}

/**
 * Priority levels for tasks and milestones
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Milestone type classification
 */
export enum MilestoneType {
  PHASE = 'phase',
  FEATURE = 'feature',
  RELEASE = 'release',
  CHECKPOINT = 'checkpoint',
  CUSTOM = 'custom',
}

/**
 * Visual theme for tree rendering
 */
export enum RenderTheme {
  ASCII = 'ascii',
  UNICODE = 'unicode',
  EMOJI = 'emoji',
  MINIMAL = 'minimal',
}

/**
 * Represents a change in task properties
 */
export interface TaskDiff {
  field: 'status' | 'content' | 'activeForm' | 'metadata';
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

/**
 * Metadata associated with a task
 */
export interface TaskMetadata {
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  tags?: string[];
  assignee?: string;
  dependencies?: string[];
  notes?: string;
  [key: string]: unknown;
}

/**
 * Core Task interface
 */
export interface Task {
  id: string;
  content: string;
  activeForm: string;
  status: TaskStatus;
  priority?: Priority;
  parentId?: string;
  milestoneId?: string;
  metadata: TaskMetadata;
  children?: string[];
}

/**
 * Milestone grouping related tasks
 */
export interface Milestone {
  id: string;
  name: string;
  description?: string;
  type: MilestoneType;
  status: TaskStatus;
  priority?: Priority;
  taskIds: string[];
  startDate?: number;
  targetDate?: number;
  completedDate?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Progress statistics
 */
export interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  failed: number;
  completionRate: number;
  estimatedTimeRemaining?: number;
}

/**
 * Rendering configuration options
 */
export interface RenderOptions {
  theme: RenderTheme;
  showStatus: boolean;
  showProgress: boolean;
  showTimestamps: boolean;
  showMetadata: boolean;
  maxDepth?: number;
  collapseCompleted: boolean;
  highlightCurrent: boolean;
  colorize: boolean;
  maxWidth?: number;
  indent: number;
}

/**
 * Tree node for rendering
 */
export interface TreeNode {
  task: Task;
  children: TreeNode[];
  depth: number;
  isLast: boolean;
  parentChain: boolean[];
}

/**
 * TodoWrite hook data structure
 */
export interface TodoWriteData {
  todos: Array<{
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
  }>;
}

/**
 * Progress Tracker configuration
 */
export interface ProgressTrackerConfig {
  autoDetectMilestones: boolean;
  persistState: boolean;
  stateFilePath?: string;
  maxTaskHistory: number;
  renderOptions: RenderOptions;
  performanceMode: boolean;
  maxTasks: number;
}

/**
 * Milestone detection rule
 */
export interface MilestoneRule {
  id: string;
  name: string;
  pattern: RegExp;
  type: MilestoneType;
  priority?: Priority;
  autoCreate: boolean;
}

/**
 * State snapshot for persistence
 */
export interface StateSnapshot {
  version: string;
  timestamp: number;
  tasks: Record<string, Task>;
  milestones: Record<string, Milestone>;
  config: ProgressTrackerConfig;
  stats: ProgressStats;
}

/**
 * Error types for progress tracker
 */
export enum ErrorType {
  INVALID_TASK_ID = 'INVALID_TASK_ID',
  DUPLICATE_TASK_ID = 'DUPLICATE_TASK_ID',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  MILESTONE_NOT_FOUND = 'MILESTONE_NOT_FOUND',
  STATE_CORRUPTION = 'STATE_CORRUPTION',
  PERSISTENCE_ERROR = 'PERSISTENCE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Custom error class for progress tracker
 */
export class ProgressTrackerError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ProgressTrackerError';
    Object.setPrototypeOf(this, ProgressTrackerError.prototype);
  }
}

/**
 * Event types for progress tracker
 */
export enum EventType {
  TASK_ADDED = 'task_added',
  TASK_UPDATED = 'task_updated',
  TASK_REMOVED = 'task_removed',
  TASK_STATUS_CHANGED = 'task_status_changed',
  MILESTONE_CREATED = 'milestone_created',
  MILESTONE_COMPLETED = 'milestone_completed',
  STATE_SAVED = 'state_saved',
  STATE_LOADED = 'state_loaded',
  ERROR_OCCURRED = 'error_occurred',
}

/**
 * Event payload for progress tracker events
 */
export interface ProgressEvent<T = unknown> {
  type: EventType;
  timestamp: number;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Event listener callback
 */
export type EventListener<T = unknown> = (event: ProgressEvent<T>) => void;

/**
 * Text measurement result
 */
export interface TextMeasurement {
  displayWidth: number;
  byteLength: number;
  charCount: number;
  hasMultibyte: boolean;
  hasAnsiCodes: boolean;
}

/**
 * Type guard for Task
 */
export function isTask(obj: unknown): obj is Task {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    'activeForm' in obj &&
    'status' in obj &&
    'metadata' in obj
  );
}

/**
 * Type guard for Milestone
 */
export function isMilestone(obj: unknown): obj is Milestone {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'type' in obj &&
    'taskIds' in obj
  );
}

/**
 * Type guard for TodoWriteData
 */
export function isTodoWriteData(obj: unknown): obj is TodoWriteData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'todos' in obj &&
    Array.isArray((obj as TodoWriteData).todos)
  );
}
