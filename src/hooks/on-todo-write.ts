/**
 * TodoWrite Hook
 *
 * Integrates with Orchestra's TodoWrite tool to automatically
 * update progress tracking when tasks are modified.
 */

import { ProgressTracker } from '../utils/progress-tracker';
import { TodoWriteData } from '../types/progress-tracker.types';
import { MilestoneDetector } from '../utils/milestone-detector';

/**
 * Hook handler for TodoWrite events
 */
export class TodoWriteHook {
  private tracker: ProgressTracker;
  private detector: MilestoneDetector;
  private autoDetectMilestones: boolean;

  constructor(
    tracker: ProgressTracker,
    options?: {
      autoDetectMilestones?: boolean;
    }
  ) {
    this.tracker = tracker;
    this.detector = new MilestoneDetector();
    this.autoDetectMilestones = options?.autoDetectMilestones ?? true;
  }

  /**
   * Handle TodoWrite data update
   * @param data - TodoWrite data from the tool
   */
  public handle(data: TodoWriteData): void {
    try {
      // Process the TodoWrite data
      this.tracker.processTodoWrite(data);

      // Auto-detect milestones if enabled
      if (this.autoDetectMilestones) {
        const tasks = this.tracker.getAllTasks();
        const milestones = this.detector.detectMilestones(tasks);

        // Log detected milestones (can be extended to add them to tracker)
        if (milestones.length > 0) {
          console.log(`Detected ${milestones.length} milestone(s)`);
        }
      }

      // Render updated progress
      const rendered = this.tracker.render();
      console.log('\n=== Progress Update ===\n');
      console.log(rendered);
      console.log('\n');

      // Display statistics
      const stats = this.tracker.getProgressStats();
      console.log(this.formatStats(stats));
    } catch (error) {
      console.error('Error processing TodoWrite data:', error);
    }
  }

  /**
   * Format statistics for display
   */
  private formatStats(stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    failed: number;
    completionRate: number;
  }): string {
    const lines: string[] = [];
    lines.push('=== Statistics ===');
    lines.push(`Total: ${stats.total}`);
    lines.push(`Completed: ${stats.completed}`);
    lines.push(`In Progress: ${stats.inProgress}`);
    lines.push(`Pending: ${stats.pending}`);
    if (stats.blocked > 0) {
      lines.push(`Blocked: ${stats.blocked}`);
    }
    if (stats.failed > 0) {
      lines.push(`Failed: ${stats.failed}`);
    }
    lines.push(
      `Completion Rate: ${Math.round(stats.completionRate * 100)}%`
    );
    return lines.join('\n');
  }

  /**
   * Enable or disable automatic milestone detection
   */
  public setAutoDetectMilestones(enabled: boolean): void {
    this.autoDetectMilestones = enabled;
  }

  /**
   * Get the milestone detector instance
   */
  public getDetector(): MilestoneDetector {
    return this.detector;
  }

  /**
   * Get the progress tracker instance
   */
  public getTracker(): ProgressTracker {
    return this.tracker;
  }
}

/**
 * Create and configure a TodoWrite hook
 * @param tracker - ProgressTracker instance
 * @param options - Configuration options
 * @returns Configured hook instance
 */
export function createTodoWriteHook(
  tracker: ProgressTracker,
  options?: {
    autoDetectMilestones?: boolean;
  }
): TodoWriteHook {
  return new TodoWriteHook(tracker, options);
}
