/**
 * TodoWrite Hook
 *
 * Integrates with Orchestra's TodoWrite tool to automatically
 * update progress tracking when tasks are modified.
 */

import { ProgressTracker } from '../utils/progress-tracker';
import { TodoWriteData } from '../types/progress-tracker.types';
import { MilestoneDetector } from '../utils/milestone-detector';
import { VisualTodoRenderer } from '../utils/visual-todo-renderer';
import { GamificationManager } from '../utils/gamification-manager';
import { GamificationRenderer } from '../utils/gamification-renderer';
import { AgentName } from '../types/gamification.types';

/**
 * Hook handler for TodoWrite events
 */
export class TodoWriteHook {
  private tracker: ProgressTracker;
  private detector: MilestoneDetector;
  private visualRenderer: VisualTodoRenderer;
  private gamificationManager: GamificationManager;
  private gamificationRenderer: GamificationRenderer;
  private autoDetectMilestones: boolean;
  private language: string;
  private previousTasks: Map<string, { status: string; startTime?: number }>;

  constructor(
    tracker: ProgressTracker,
    options?: {
      autoDetectMilestones?: boolean;
      language?: string;
    }
  ) {
    this.tracker = tracker;
    this.detector = new MilestoneDetector();
    this.language = options?.language || process.env.ORCHESTRA_LANGUAGE || 'en';
    this.visualRenderer = new VisualTodoRenderer(this.language);
    this.gamificationManager = new GamificationManager({ language: this.language });
    this.gamificationRenderer = new GamificationRenderer(this.language);
    this.autoDetectMilestones = options?.autoDetectMilestones ?? true;
    this.previousTasks = new Map();
  }

  /**
   * Handle TodoWrite data update
   * @param data - TodoWrite data from the tool
   */
  /**
   * Extract agent name from task content
   */
  private extractAgent(content: string): AgentName | null {
    const match = content.match(/\[([A-Z][a-z]+)\]/);
    const agentName = match ? match[1] : null;

    const validAgents: AgentName[] = [
      'Alex', 'Riley', 'Skye', 'Finn', 'Eden', 'Kai',
      'Leo', 'Iris', 'Nova', 'Mina', 'Theo', 'Blake'
    ];

    return agentName && validAgents.includes(agentName as AgentName)
      ? (agentName as AgentName)
      : null;
  }

  public handle(data: TodoWriteData): void {
    try {
      // Get tasks before update
      const oldTasks = this.tracker.getAllTasks();

      // Process the TodoWrite data
      this.tracker.processTodoWrite(data);

      // Get tasks after update
      const tasks = this.tracker.getAllTasks();

      // Process gamification updates
      tasks.forEach((task, index) => {
        const taskId = `${index}-${task.content}`;
        const agent = this.extractAgent(task.content);

        if (!agent) return;

        const previousTask = this.previousTasks.get(taskId);

        // Task just started (pending → in_progress)
        if (task.status === 'in_progress' && previousTask?.status !== 'in_progress') {
          this.previousTasks.set(taskId, {
            status: task.status,
            startTime: Date.now(),
          });
        }

        // Task completed
        if (task.status === 'completed' && previousTask?.status !== 'completed') {
          const taskDuration = previousTask?.startTime
            ? Date.now() - previousTask.startTime
            : 60000; // Default 1 minute if no start time

          // Award XP for task completion
          const xpGain = this.gamificationManager.completeTask(
            agent,
            taskDuration,
            false, // isPerfect - can be enhanced later
            false  // isFast - can be enhanced later
          );

          // Display XP gain
          console.log(
            this.gamificationRenderer.renderXPGain(
              agent,
              xpGain.amount,
              xpGain.reason,
              xpGain.reasonJa
            )
          );

          // Display level up if applicable
          if (xpGain.levelUp && xpGain.newLevel) {
            const agentStats = this.gamificationManager.getAgentStats(agent);
            console.log(
              this.gamificationRenderer.renderLevelUp(
                agent,
                xpGain.newLevel,
                agentStats.level.title,
                agentStats.level.titleJa
              )
            );
          }

          // Update previous task state
          this.previousTasks.set(taskId, { status: task.status });
        }
      });

      // Auto-detect milestones if enabled
      if (this.autoDetectMilestones) {
        const milestones = this.detector.detectMilestones(tasks);

        if (milestones.length > 0) {
          console.log(`Detected ${milestones.length} milestone(s)`);
        }
      }

      // Render updated progress with visual enhancements
      const visualOutput = this.visualRenderer.render(tasks);

      console.log('\n');
      console.log(visualOutput);
      console.log('\n');

      // Display recent achievements periodically
      const achievements = this.gamificationManager.getRecentAchievements();
      if (achievements.length > 0 && Math.random() < 0.2) {
        console.log(this.gamificationRenderer.renderRecentAchievements(achievements, 3));
      }
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
    language?: string;
  }
): TodoWriteHook {
  return new TodoWriteHook(tracker, options);
}
