/**
 * Tree Renderer
 *
 * Renders task hierarchies as visual tree structures with:
 * - Multiple theme support (Unicode, ASCII, Emoji, Minimal)
 * - Status indicators and progress bars
 * - Color coding
 * - Japanese text support
 */

import {
  Task,
  TreeNode,
  RenderOptions,
  TaskStatus,
} from '../types/progress-tracker.types';
import {
  STATUS_ICONS,
  TREE_CHARS,
  COLORS,
} from '../config/progress-tracker-defaults';
import { TextMeasurer } from './text-measurer';

/**
 * TreeRenderer class for visualizing task hierarchies
 */
export class TreeRenderer {
  private measurer: TextMeasurer;
  private options: RenderOptions;

  constructor(options: RenderOptions) {
    this.options = options;
    this.measurer = new TextMeasurer();
  }

  /**
   * Render a tree of tasks
   * @param rootNodes - Array of root tree nodes
   * @returns Rendered tree as string
   */
  public render(rootNodes: TreeNode[]): string {
    const lines: string[] = [];

    for (let i = 0; i < rootNodes.length; i++) {
      const node = rootNodes[i];
      const isLast = i === rootNodes.length - 1;
      this.renderNode(node, [], isLast, lines);
    }

    return lines.join('\n');
  }

  /**
   * Render a single node and its children
   */
  private renderNode(
    node: TreeNode,
    parentChain: boolean[],
    isLast: boolean,
    lines: string[]
  ): void {
    // Check depth limit
    if (
      this.options.maxDepth !== undefined &&
      node.depth > this.options.maxDepth
    ) {
      return;
    }

    // Skip completed tasks if collapsed
    if (
      this.options.collapseCompleted &&
      node.task.status === TaskStatus.COMPLETED
    ) {
      return;
    }

    // Build the line for this node
    const line = this.buildNodeLine(node, parentChain, isLast);
    lines.push(line);

    // Render children
    if (node.children.length > 0) {
      const newParentChain = [...parentChain, !isLast];

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childIsLast = i === node.children.length - 1;
        this.renderNode(child, newParentChain, childIsLast, lines);
      }
    }
  }

  /**
   * Build the display line for a node
   */
  private buildNodeLine(
    node: TreeNode,
    parentChain: boolean[],
    isLast: boolean
  ): string {
    const parts: string[] = [];

    // Add tree structure
    const prefix = this.buildPrefix(parentChain, isLast);
    parts.push(prefix);

    // Add status icon
    if (this.options.showStatus) {
      const statusIcon = this.getStatusIcon(node.task.status);
      parts.push(this.colorize(statusIcon, node.task.status));
      parts.push(' ');
    }

    // Add task content
    const content =
      node.task.status === TaskStatus.IN_PROGRESS
        ? node.task.activeForm
        : node.task.content;

    const coloredContent =
      this.options.highlightCurrent &&
      node.task.status === TaskStatus.IN_PROGRESS
        ? this.colorize(content, TaskStatus.IN_PROGRESS)
        : content;

    // Truncate if necessary
    let displayContent = coloredContent;
    if (this.options.maxWidth) {
      const currentWidth = this.measurer.getWidth(
        this.measurer.stripAnsi(parts.join('') + coloredContent)
      );
      if (currentWidth > this.options.maxWidth) {
        const availableWidth =
          this.options.maxWidth -
          this.measurer.getWidth(this.measurer.stripAnsi(parts.join('')));
        displayContent = this.measurer.truncate(
          this.measurer.stripAnsi(coloredContent),
          availableWidth
        );
      }
    }

    parts.push(displayContent);

    // Add progress indicator if enabled
    if (this.options.showProgress && node.children.length > 0) {
      const progress = this.calculateProgress(node);
      parts.push(' ');
      parts.push(this.formatProgress(progress));
    }

    // Add timestamps if enabled
    if (this.options.showTimestamps && node.task.metadata.updatedAt) {
      parts.push(' ');
      parts.push(
        this.colorize(
          `[${this.formatTimestamp(node.task.metadata.updatedAt)}]`,
          'timestamp'
        )
      );
    }

    // Add metadata if enabled
    if (this.options.showMetadata && node.task.metadata.tags) {
      parts.push(' ');
      parts.push(this.formatTags(node.task.metadata.tags));
    }

    return parts.join('');
  }

  /**
   * Build the tree prefix (lines and branches)
   */
  private buildPrefix(parentChain: boolean[], isLast: boolean): string {
    const chars = TREE_CHARS[this.options.theme];
    const parts: string[] = [];

    // Add vertical lines for parent levels
    for (const hasMore of parentChain) {
      if (hasMore) {
        parts.push(chars.vertical);
        parts.push(chars.space.repeat(this.options.indent));
      } else {
        parts.push(chars.space.repeat(1 + this.options.indent));
      }
    }

    // Add branch character for current level
    if (parentChain.length > 0) {
      parts.push(isLast ? chars.last : chars.branch);
      parts.push(chars.horizontal.repeat(this.options.indent - 1));
      parts.push(' ');
    }

    return parts.join('');
  }

  /**
   * Get status icon for theme
   */
  private getStatusIcon(status: TaskStatus): string {
    const icons = STATUS_ICONS[this.options.theme];
    return icons[status] || icons.pending;
  }

  /**
   * Calculate progress for a node with children
   */
  private calculateProgress(node: TreeNode): number {
    const allTasks = this.collectAllTasks(node);
    const completed = allTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;
    return allTasks.length > 0 ? completed / allTasks.length : 0;
  }

  /**
   * Collect all tasks in a subtree
   */
  private collectAllTasks(node: TreeNode): Task[] {
    const tasks: Task[] = [node.task];
    for (const child of node.children) {
      tasks.push(...this.collectAllTasks(child));
    }
    return tasks;
  }

  /**
   * Format progress as percentage or bar
   */
  private formatProgress(progress: number): string {
    const percentage = Math.round(progress * 100);
    const bar = this.buildProgressBar(progress, 10);
    return this.colorize(`${bar} ${percentage}%`, 'progress');
  }

  /**
   * Build a progress bar
   */
  private buildProgressBar(progress: number, width: number): string {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60000) {
      return 'just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // More than 24 hours
    return date.toLocaleDateString();
  }

  /**
   * Format tags
   */
  private formatTags(tags: string[]): string {
    return tags.map((tag) => this.colorize(`#${tag}`, 'tag')).join(' ');
  }

  /**
   * Apply color to text if colorization is enabled
   */
  private colorize(text: string, context: TaskStatus | string): string {
    if (!this.options.colorize) {
      return text;
    }

    let color = COLORS.reset;

    switch (context) {
      case TaskStatus.PENDING:
        color = COLORS.gray;
        break;
      case TaskStatus.IN_PROGRESS:
        color = COLORS.yellow;
        break;
      case TaskStatus.COMPLETED:
        color = COLORS.green;
        break;
      case TaskStatus.BLOCKED:
        color = COLORS.red;
        break;
      case TaskStatus.FAILED:
        color = COLORS.red + COLORS.bright;
        break;
      case 'progress':
        color = COLORS.cyan;
        break;
      case 'timestamp':
        color = COLORS.gray;
        break;
      case 'tag':
        color = COLORS.magenta;
        break;
      default:
        color = COLORS.reset;
    }

    return `${color}${text}${COLORS.reset}`;
  }

  /**
   * Update render options
   */
  public updateOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  public getOptions(): RenderOptions {
    return { ...this.options };
  }
}
