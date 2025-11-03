/**
 * Progress Tracker System
 *
 * Main entry point for the Orchestra Progress Tracker.
 * Exports all public APIs, types, and utilities.
 */

// Core classes
export { ProgressTracker } from './utils/progress-tracker';
export { TextMeasurer, measureWidth, stripAnsi, truncateText } from './utils/text-measurer';
export { TreeRenderer } from './utils/tree-renderer';
export { MilestoneDetector } from './utils/milestone-detector';

// Hooks
export { TodoWriteHook, createTodoWriteHook } from './hooks/on-todo-write';

// Types
export {
  TaskStatus,
  Priority,
  MilestoneType,
  RenderTheme,
  ErrorType,
  EventType,
  Task,
  TaskDiff,
  TaskMetadata,
  Milestone,
  MilestoneRule,
  ProgressStats,
  RenderOptions,
  TreeNode,
  TodoWriteData,
  ProgressTrackerConfig,
  StateSnapshot,
  ProgressTrackerError,
  ProgressEvent,
  EventListener,
  TextMeasurement,
  isTask,
  isMilestone,
  isTodoWriteData,
} from './types/progress-tracker.types';

// Configuration
export {
  DEFAULT_CONFIG,
  DEFAULT_RENDER_OPTIONS,
  DEFAULT_MILESTONE_RULES,
  STATUS_ICONS,
  TREE_CHARS,
  COLORS,
  LIMITS,
} from './config/progress-tracker-defaults';
