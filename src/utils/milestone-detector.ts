/**
 * Milestone Detector
 *
 * Automatically detects and creates milestones based on task patterns.
 * Supports both English and Japanese task descriptions.
 */

import {
  Milestone,
  MilestoneRule,
  Task,
  TaskStatus,
  Priority,
} from '../types/progress-tracker.types';
import { DEFAULT_MILESTONE_RULES } from '../config/progress-tracker-defaults';

/**
 * MilestoneDetector class for automatic milestone detection
 */
export class MilestoneDetector {
  private rules: MilestoneRule[];
  private detectedMilestones: Map<string, Milestone>;

  constructor(customRules?: MilestoneRule[]) {
    this.rules = customRules || DEFAULT_MILESTONE_RULES;
    this.detectedMilestones = new Map();
  }

  /**
   * Detect milestones from a list of tasks
   * @param tasks - Array of tasks to analyze
   * @returns Array of detected milestones
   */
  public detectMilestones(tasks: Task[]): Milestone[] {
    this.detectedMilestones.clear();

    for (const task of tasks) {
      this.analyzeTask(task);
    }

    return Array.from(this.detectedMilestones.values());
  }

  /**
   * Analyze a single task for milestone patterns
   */
  private analyzeTask(task: Task): void {
    for (const rule of this.rules) {
      if (!rule.autoCreate) {
        continue;
      }

      const match = task.content.match(rule.pattern);
      if (match) {
        const milestoneId = this.generateMilestoneId(rule, match);

        if (!this.detectedMilestones.has(milestoneId)) {
          const milestone = this.createMilestone(rule, match, task);
          this.detectedMilestones.set(milestoneId, milestone);
        } else {
          // Add task to existing milestone
          const milestone = this.detectedMilestones.get(milestoneId)!;
          if (!milestone.taskIds.includes(task.id)) {
            milestone.taskIds.push(task.id);
          }
        }

        // Only match one rule per task
        break;
      }
    }
  }

  /**
   * Create a milestone from a rule match
   */
  private createMilestone(
    rule: MilestoneRule,
    match: RegExpMatchArray,
    task: Task
  ): Milestone {
    const name = this.extractMilestoneName(rule, match);
    const milestoneId = this.generateMilestoneId(rule, match);

    return {
      id: milestoneId,
      name,
      description: `Auto-detected ${rule.type} milestone`,
      type: rule.type,
      status: task.status,
      priority: rule.priority,
      taskIds: [task.id],
      startDate: task.metadata.createdAt,
      metadata: {
        ruleId: rule.id,
        autoDetected: true,
        detectionPattern: rule.pattern.source,
      },
    };
  }

  /**
   * Generate unique milestone ID
   */
  private generateMilestoneId(
    rule: MilestoneRule,
    match: RegExpMatchArray
  ): string {
    const identifier = match[1] || match[0];
    return `milestone_${rule.id}_${this.sanitizeIdentifier(identifier)}`;
  }

  /**
   * Extract milestone name from match
   */
  private extractMilestoneName(
    rule: MilestoneRule,
    match: RegExpMatchArray
  ): string {
    if (match[1]) {
      return `${rule.name} ${match[1]}`;
    }
    return rule.name;
  }

  /**
   * Sanitize identifier for use in IDs
   */
  private sanitizeIdentifier(identifier: string): string {
    return identifier
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Group tasks by detected milestones
   * @param tasks - Array of tasks
   * @returns Map of milestone ID to task array
   */
  public groupTasksByMilestone(tasks: Task[]): Map<string, Task[]> {
    const milestones = this.detectMilestones(tasks);
    const grouped = new Map<string, Task[]>();

    for (const milestone of milestones) {
      const milestoneTasks = tasks.filter((task) =>
        milestone.taskIds.includes(task.id)
      );
      grouped.set(milestone.id, milestoneTasks);
    }

    return grouped;
  }

  /**
   * Calculate milestone completion status
   * @param milestone - Milestone to analyze
   * @param tasks - All tasks
   * @returns Updated milestone with completion info
   */
  public calculateMilestoneStatus(
    milestone: Milestone,
    tasks: Task[]
  ): Milestone {
    const milestoneTasks = tasks.filter((task) =>
      milestone.taskIds.includes(task.id)
    );

    if (milestoneTasks.length === 0) {
      return milestone;
    }

    const completedCount = milestoneTasks.filter(
      (task) => task.status === TaskStatus.COMPLETED
    ).length;
    const inProgressCount = milestoneTasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS
    ).length;
    const blockedCount = milestoneTasks.filter(
      (task) => task.status === TaskStatus.BLOCKED
    ).length;

    let status: TaskStatus;
    if (completedCount === milestoneTasks.length) {
      status = TaskStatus.COMPLETED;
      milestone.completedDate = Date.now();
    } else if (blockedCount > 0) {
      status = TaskStatus.BLOCKED;
    } else if (inProgressCount > 0) {
      status = TaskStatus.IN_PROGRESS;
    } else {
      status = TaskStatus.PENDING;
    }

    return {
      ...milestone,
      status,
    };
  }

  /**
   * Add a custom detection rule
   * @param rule - Milestone detection rule
   */
  public addRule(rule: MilestoneRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a detection rule
   * @param ruleId - Rule ID to remove
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter((rule) => rule.id !== ruleId);
  }

  /**
   * Get all active rules
   * @returns Array of detection rules
   */
  public getRules(): MilestoneRule[] {
    return [...this.rules];
  }

  /**
   * Clear detected milestones cache
   */
  public clearCache(): void {
    this.detectedMilestones.clear();
  }

  /**
   * Suggest milestone groupings based on task similarity
   * @param tasks - Array of tasks
   * @returns Suggested milestone groupings
   */
  public suggestGroupings(
    tasks: Task[]
  ): Array<{ name: string; taskIds: string[]; confidence: number }> {
    const suggestions: Array<{
      name: string;
      taskIds: string[];
      confidence: number;
    }> = [];

    // Group by common prefixes
    const prefixGroups = this.groupByPrefix(tasks);
    for (const [prefix, groupTasks] of prefixGroups) {
      if (groupTasks.length >= 2) {
        suggestions.push({
          name: prefix,
          taskIds: groupTasks.map((t) => t.id),
          confidence: Math.min(0.9, 0.5 + groupTasks.length * 0.1),
        });
      }
    }

    // Group by priority
    const highPriorityTasks = tasks.filter(
      (task) => task.priority === Priority.HIGH || task.priority === Priority.CRITICAL
    );
    if (highPriorityTasks.length >= 2) {
      suggestions.push({
        name: 'High Priority Tasks',
        taskIds: highPriorityTasks.map((t) => t.id),
        confidence: 0.6,
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Group tasks by common prefix
   */
  private groupByPrefix(tasks: Task[]): Map<string, Task[]> {
    const groups = new Map<string, Task[]>();

    for (const task of tasks) {
      const words = task.content.split(/\s+/);
      if (words.length > 0) {
        const prefix = words[0];
        if (!groups.has(prefix)) {
          groups.set(prefix, []);
        }
        groups.get(prefix)!.push(task);
      }
    }

    return groups;
  }

  /**
   * Generate milestone summary report
   * @param milestones - Array of milestones
   * @param tasks - All tasks
   * @returns Summary report string
   */
  public generateReport(milestones: Milestone[], tasks: Task[]): string {
    const lines: string[] = [];
    lines.push('=== Milestone Report ===');
    lines.push('');

    for (const milestone of milestones) {
      const milestoneTasks = tasks.filter((task) =>
        milestone.taskIds.includes(task.id)
      );
      const completed = milestoneTasks.filter(
        (t) => t.status === TaskStatus.COMPLETED
      ).length;
      const total = milestoneTasks.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      lines.push(`📍 ${milestone.name}`);
      lines.push(`   Type: ${milestone.type}`);
      lines.push(`   Status: ${milestone.status}`);
      lines.push(`   Progress: ${completed}/${total} (${percentage}%)`);
      lines.push('');
    }

    return lines.join('\n');
  }
}
