/**
 * Visual TODO Renderer
 *
 * Provides rich, visual rendering of TODO lists with:
 * - Agent assignments
 * - Progress bars
 * - Dependency trees
 * - Color-coded status
 * - Time estimates
 */

import { Task } from '../types/progress-tracker.types';
import { DependencyGraphRenderer } from './dependency-graph-renderer';

interface AgentInfo {
  emoji: string;
  name: string;
  color: string;
}

const AGENTS: Record<string, AgentInfo> = {
  Alex: { emoji: '🙂', name: 'Alex', color: '\x1b[36m' },    // Cyan
  Riley: { emoji: '🧐', name: 'Riley', color: '\x1b[35m' },   // Magenta
  Skye: { emoji: '😐', name: 'Skye', color: '\x1b[34m' },     // Blue
  Finn: { emoji: '😤', name: 'Finn', color: '\x1b[33m' },     // Yellow
  Eden: { emoji: '🤓', name: 'Eden', color: '\x1b[32m' },     // Green
  Kai: { emoji: '🤔', name: 'Kai', color: '\x1b[36m' },       // Cyan
  Leo: { emoji: '😌', name: 'Leo', color: '\x1b[35m' },       // Magenta
  Iris: { emoji: '🤨', name: 'Iris', color: '\x1b[31m' },     // Red
  Nova: { emoji: '😄', name: 'Nova', color: '\x1b[33m' },     // Yellow
  Mina: { emoji: '😊', name: 'Mina', color: '\x1b[32m' },     // Green
  Theo: { emoji: '😬', name: 'Theo', color: '\x1b[34m' },     // Blue
  Blake: { emoji: '😎', name: 'Blake', color: '\x1b[35m' },   // Magenta
};

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  GRAY: '\x1b[90m',
  CYAN: '\x1b[36m',
};

const STATUS_ICONS = {
  pending: '⏳',
  in_progress: '⚡',
  completed: '✅',
  blocked: '🚫',
  failed: '❌',
};

export class VisualTodoRenderer {
  private language: string;
  private dependencyRenderer: DependencyGraphRenderer;

  constructor(language: string = 'en') {
    this.language = language;
    this.dependencyRenderer = new DependencyGraphRenderer(language);
  }

  /**
   * Extract agent name from task content
   */
  private extractAgent(content: string): string | null {
    const match = content.match(/\[([A-Z][a-z]+)\]/);
    return match ? match[1] : null;
  }

  /**
   * Clean task content by removing agent tag
   */
  private cleanContent(content: string): string {
    return content.replace(/\[([A-Z][a-z]+)\]\s*/, '');
  }

  /**
   * Get agent info
   */
  private getAgentInfo(agentName: string): AgentInfo | null {
    return AGENTS[agentName] || null;
  }

  /**
   * Render a single task with visual enhancements
   */
  private renderTask(task: Task, index: number, isLast: boolean): string {
    const agent = this.extractAgent(task.content);
    const cleanContent = this.cleanContent(task.content);
    const agentInfo = agent ? this.getAgentInfo(agent) : null;

    // Tree structure
    const prefix = isLast ? '└─' : '├─';

    // Status icon
    const statusIcon = STATUS_ICONS[task.status] || '○';

    // Agent display
    const agentDisplay = agentInfo
      ? `${agentInfo.color}${agentInfo.emoji} ${agentInfo.name}${COLORS.RESET}`
      : '';

    // Status color
    let statusColor = COLORS.GRAY;
    if (task.status === 'completed') statusColor = COLORS.GREEN;
    else if (task.status === 'in_progress') statusColor = COLORS.YELLOW;
    else if (task.status === 'failed') statusColor = COLORS.RED;
    else if (task.status === 'blocked') statusColor = COLORS.RED;

    // Format the line
    const line = [
      `  ${COLORS.GRAY}${prefix}${COLORS.RESET}`,
      `${statusIcon}`,
      agentDisplay ? `${agentDisplay}` : '',
      `${statusColor}${cleanContent}${COLORS.RESET}`,
    ]
      .filter(Boolean)
      .join(' ');

    return line;
  }

  /**
   * Render progress bar
   */
  private renderProgressBar(completed: number, total: number, width: number = 30): string {
    if (total === 0) return '░'.repeat(width);

    const percentage = completed / total;
    const filled = Math.round(width * percentage);
    const empty = width - filled;

    const bar = '▓'.repeat(filled) + '░'.repeat(empty);
    const percentText = `${Math.round(percentage * 100)}%`;

    return `${COLORS.CYAN}[${bar}]${COLORS.RESET} ${COLORS.BRIGHT}${percentText}${COLORS.RESET}`;
  }

  /**
   * Render header with stats
   */
  private renderHeader(stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    failed: number;
  }): string {
    const lines: string[] = [];

    // Title
    const title = this.language === 'ja' ? '📋 TODO リスト' : '📋 TODO List';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(60));

    // Progress bar
    lines.push(this.renderProgressBar(stats.completed, stats.total));
    lines.push('');

    // Stats
    const statsLine = [
      `${COLORS.GREEN}✅ ${stats.completed}${COLORS.RESET}`,
      `${COLORS.YELLOW}⚡ ${stats.inProgress}${COLORS.RESET}`,
      `${COLORS.GRAY}⏳ ${stats.pending}${COLORS.RESET}`,
    ];

    if (stats.blocked > 0) {
      statsLine.push(`${COLORS.RED}🚫 ${stats.blocked}${COLORS.RESET}`);
    }
    if (stats.failed > 0) {
      statsLine.push(`${COLORS.RED}❌ ${stats.failed}${COLORS.RESET}`);
    }

    lines.push(statsLine.join('  '));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render footer with agent summary
   */
  private renderFooter(tasks: Task[]): string {
    const lines: string[] = [];

    // Count tasks by agent
    const agentCounts: Record<string, number> = {};
    tasks.forEach((task) => {
      const agent = this.extractAgent(task.content);
      if (agent && task.status !== 'completed') {
        agentCounts[agent] = (agentCounts[agent] || 0) + 1;
      }
    });

    if (Object.keys(agentCounts).length > 0) {
      lines.push('');
      lines.push('━'.repeat(60));
      const assignedLabel = this.language === 'ja' ? '担当エージェント' : 'Assigned Agents';
      lines.push(`${COLORS.BRIGHT}${assignedLabel}:${COLORS.RESET}`);

      Object.entries(agentCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([agent, count]) => {
          const agentInfo = this.getAgentInfo(agent);
          if (agentInfo) {
            lines.push(
              `  ${agentInfo.color}${agentInfo.emoji} ${agentInfo.name}${COLORS.RESET}: ${count} ${
                this.language === 'ja' ? 'タスク' : 'tasks'
              }`
            );
          }
        });
    }

    return lines.join('\n');
  }

  /**
   * Render complete TODO list
   */
  public render(tasks: Task[]): string {
    const lines: string[] = [];

    // Calculate stats
    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };

    // Header
    lines.push(this.renderHeader(stats));

    // Tasks
    if (tasks.length === 0) {
      const emptyMsg = this.language === 'ja' ? 'タスクがありません' : 'No tasks';
      lines.push(`  ${COLORS.DIM}${emptyMsg}${COLORS.RESET}`);
    } else {
      tasks.forEach((task, index) => {
        lines.push(this.renderTask(task, index, index === tasks.length - 1));
      });
    }

    // Footer
    lines.push(this.renderFooter(tasks));
    lines.push('━'.repeat(60));

    return lines.join('\n');
  }

  /**
   * Render compact summary (for inline display)
   */
  public renderCompact(tasks: Task[]): string {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const total = tasks.length;

    const progressBar = this.renderProgressBar(completed, total, 20);

    return `${progressBar}  ${COLORS.GREEN}✅${completed}${COLORS.RESET} ${COLORS.YELLOW}⚡${inProgress}${COLORS.RESET} ${COLORS.GRAY}⏳${
      total - completed - inProgress
    }${COLORS.RESET}`;
  }

  /**
   * Render dependency graph view
   */
  public renderDependencyGraph(tasks: Task[]): string {
    return this.dependencyRenderer.render(tasks);
  }

  /**
   * Render compact dependency summary
   */
  public renderDependencySummary(tasks: Task[]): string {
    return this.dependencyRenderer.renderCompact(tasks);
  }

  /**
   * Check if tasks have dependencies
   */
  private hasDependencies(tasks: Task[]): boolean {
    return tasks.some((task) => task.metadata.dependencies && task.metadata.dependencies.length > 0);
  }

  /**
   * Render complete view with optional dependency graph
   */
  public renderComplete(tasks: Task[], showDependencies: boolean = false): string {
    const lines: string[] = [];

    // Standard TODO list
    lines.push(this.render(tasks));

    // Add dependency graph if tasks have dependencies
    if (showDependencies && this.hasDependencies(tasks)) {
      lines.push('');
      lines.push(this.renderDependencyGraph(tasks));
    }

    return lines.join('\n');
  }
}
