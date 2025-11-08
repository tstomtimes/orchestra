/**
 * Agent Load Balancer
 *
 * Automatically distributes tasks across agents based on:
 * - Current workload (active tasks)
 * - Historical performance (completion times)
 * - Agent specialization (expertise matching)
 * - Availability (blocked/failed task count)
 * - Fairness (even distribution)
 */

import { Task, TaskStatus } from '../types/progress-tracker.types';
import { AgentName } from '../types/gamification.types';

interface AgentWorkload {
  agent: AgentName;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  blockedTasks: number;
  averageCompletionTime: number;
  totalWorkTime: number;
  successRate: number;
  currentLoad: number;
}

interface TaskAssignment {
  task: Task;
  recommendedAgent: AgentName;
  score: number;
  reasoning: string;
  alternativeAgents: Array<{ agent: AgentName; score: number }>;
}

interface LoadBalancingStrategy {
  prioritize: 'fairness' | 'performance' | 'expertise' | 'balanced';
  maxTasksPerAgent?: number;
  considerSpecialization: boolean;
  avoidOverload: boolean;
}

const AGENT_SPECIALIZATIONS: Record<AgentName, string[]> = {
  Alex: ['coordination', 'planning', 'management', 'delegation'],
  Riley: ['requirements', 'analysis', 'clarification', 'discovery'],
  Skye: ['implementation', 'coding', 'refactoring', 'clean-code'],
  Finn: ['testing', 'qa', 'debugging', 'quality-assurance'],
  Eden: ['documentation', 'writing', 'guides', 'tutorials'],
  Kai: ['architecture', 'design', 'patterns', 'adr'],
  Leo: ['database', 'schema', 'migration', 'sql'],
  Iris: ['security', 'audit', 'vulnerability', 'compliance'],
  Nova: ['ui', 'ux', 'accessibility', 'performance', 'frontend'],
  Mina: ['api', 'integration', 'external', 'third-party'],
  Theo: ['monitoring', 'observability', 'logging', 'metrics'],
  Blake: ['deployment', 'devops', 'release', 'ci-cd'],
};

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  MAGENTA: '\x1b[35m',
  GRAY: '\x1b[90m',
};

export class AgentLoadBalancer {
  private language: string;
  private strategy: LoadBalancingStrategy;

  constructor(
    language: string = 'en',
    strategy?: Partial<LoadBalancingStrategy>
  ) {
    this.language = language;
    this.strategy = {
      prioritize: strategy?.prioritize || 'balanced',
      maxTasksPerAgent: strategy?.maxTasksPerAgent || 5,
      considerSpecialization: strategy?.considerSpecialization ?? true,
      avoidOverload: strategy?.avoidOverload ?? true,
    };
  }

  /**
   * Extract agent name from task content
   */
  private extractAgent(content: string): AgentName | null {
    const match = content.match(/\[([A-Z][a-z]+)\]/);
    const agentName = match ? match[1] : null;

    const validAgents: AgentName[] = [
      'Alex', 'Riley', 'Skye', 'Finn', 'Eden', 'Kai',
      'Leo', 'Iris', 'Nova', 'Mina', 'Theo', 'Blake',
    ];

    return agentName && validAgents.includes(agentName as AgentName)
      ? (agentName as AgentName)
      : null;
  }

  /**
   * Calculate workload for each agent
   */
  public calculateWorkloads(tasks: Task[]): Map<AgentName, AgentWorkload> {
    const workloads = new Map<AgentName, AgentWorkload>();

    // Initialize workloads for all agents
    const allAgents: AgentName[] = [
      'Alex', 'Riley', 'Skye', 'Finn', 'Eden', 'Kai',
      'Leo', 'Iris', 'Nova', 'Mina', 'Theo', 'Blake',
    ];

    allAgents.forEach((agent) => {
      workloads.set(agent, {
        agent,
        activeTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        blockedTasks: 0,
        averageCompletionTime: 0,
        totalWorkTime: 0,
        successRate: 1.0,
        currentLoad: 0,
      });
    });

    // Calculate stats from tasks
    tasks.forEach((task) => {
      const agent = this.extractAgent(task.content);
      if (!agent) return;

      const workload = workloads.get(agent);
      if (!workload) return;

      switch (task.status) {
        case TaskStatus.IN_PROGRESS:
          workload.activeTasks++;
          break;
        case TaskStatus.PENDING:
          workload.pendingTasks++;
          break;
        case TaskStatus.COMPLETED:
          workload.completedTasks++;
          if (task.metadata.actualDuration) {
            workload.totalWorkTime += task.metadata.actualDuration;
          }
          break;
        case TaskStatus.FAILED:
          workload.failedTasks++;
          break;
        case TaskStatus.BLOCKED:
          workload.blockedTasks++;
          break;
      }
    });

    // Calculate derived metrics
    workloads.forEach((workload) => {
      const totalTasks = workload.completedTasks + workload.failedTasks;
      if (totalTasks > 0) {
        workload.successRate = workload.completedTasks / totalTasks;
      }

      if (workload.completedTasks > 0 && workload.totalWorkTime > 0) {
        workload.averageCompletionTime = workload.totalWorkTime / workload.completedTasks;
      }

      // Current load: active + pending tasks
      workload.currentLoad = workload.activeTasks + workload.pendingTasks;
    });

    return workloads;
  }

  /**
   * Match task keywords with agent specializations
   */
  private calculateExpertiseScore(taskContent: string, agent: AgentName): number {
    const specializations = AGENT_SPECIALIZATIONS[agent] || [];
    const contentLower = taskContent.toLowerCase();

    let score = 0;
    specializations.forEach((specialization) => {
      if (contentLower.includes(specialization)) {
        score += 1;
      }
    });

    // Normalize score (0-1)
    return specializations.length > 0 ? score / specializations.length : 0;
  }

  /**
   * Recommend agent for a task
   */
  public recommendAgent(
    task: Task,
    currentTasks: Task[]
  ): TaskAssignment {
    const workloads = this.calculateWorkloads(currentTasks);
    const scores = new Map<AgentName, number>();

    workloads.forEach((workload, agent) => {
      let score = 100;

      // Factor 1: Expertise match (0-40 points)
      if (this.strategy.considerSpecialization) {
        const expertiseScore = this.calculateExpertiseScore(task.content, agent);
        score += expertiseScore * 40;
      }

      // Factor 2: Current load (0-30 points, inverted)
      const maxLoad = this.strategy.maxTasksPerAgent || 5;
      const loadPenalty = (workload.currentLoad / maxLoad) * 30;
      score -= loadPenalty;

      // Factor 3: Success rate (0-20 points)
      score += workload.successRate * 20;

      // Factor 4: Average completion time (0-10 points, inverted)
      if (workload.averageCompletionTime > 0) {
        const avgTime = workload.averageCompletionTime / (1000 * 60 * 60); // hours
        const timePenalty = Math.min(avgTime / 10, 1) * 10;
        score -= timePenalty;
      }

      // Apply strategy adjustments
      switch (this.strategy.prioritize) {
        case 'fairness':
          // Heavily penalize agents with high load
          score -= workload.currentLoad * 20;
          break;
        case 'performance':
          // Favor agents with high success rate and fast completion
          score += workload.successRate * 30;
          break;
        case 'expertise':
          // Heavily favor expertise match
          const expertiseBonus = this.calculateExpertiseScore(task.content, agent);
          score += expertiseBonus * 50;
          break;
      }

      // Penalize if overloaded
      if (this.strategy.avoidOverload && workload.currentLoad >= (this.strategy.maxTasksPerAgent || 5)) {
        score -= 100;
      }

      scores.set(agent, Math.max(0, score));
    });

    // Sort by score
    const sortedAgents = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    const recommended = sortedAgents[0];
    const alternatives = sortedAgents.slice(1, 4).map(([agent, score]) => ({
      agent,
      score: Math.round(score),
    }));

    // Generate reasoning
    const reasoning = this.generateReasoning(
      recommended[0],
      workloads.get(recommended[0])!,
      task
    );

    return {
      task,
      recommendedAgent: recommended[0],
      score: Math.round(recommended[1]),
      reasoning,
      alternativeAgents: alternatives,
    };
  }

  /**
   * Generate human-readable reasoning for recommendation
   */
  private generateReasoning(
    agent: AgentName,
    workload: AgentWorkload,
    task: Task
  ): string {
    const reasons: string[] = [];

    // Expertise match
    const expertiseScore = this.calculateExpertiseScore(task.content, agent);
    if (expertiseScore > 0.3) {
      if (this.language === 'ja') {
        reasons.push('専門知識が一致');
      } else {
        reasons.push('Expertise match');
      }
    }

    // Low load
    if (workload.currentLoad <= 2) {
      if (this.language === 'ja') {
        reasons.push('負荷が低い');
      } else {
        reasons.push('Low workload');
      }
    }

    // High success rate
    if (workload.successRate >= 0.9 && workload.completedTasks > 0) {
      if (this.language === 'ja') {
        reasons.push('高い成功率');
      } else {
        reasons.push('High success rate');
      }
    }

    // Fast completion
    if (workload.averageCompletionTime > 0 && workload.averageCompletionTime < 2 * 60 * 60 * 1000) {
      if (this.language === 'ja') {
        reasons.push('高速完了');
      } else {
        reasons.push('Fast completion');
      }
    }

    if (reasons.length === 0) {
      return this.language === 'ja' ? '利用可能' : 'Available';
    }

    return reasons.join(', ');
  }

  /**
   * Rebalance all pending tasks
   */
  public rebalanceAll(tasks: Task[]): TaskAssignment[] {
    const pendingTasks = tasks.filter((t) => {
      const agent = this.extractAgent(t.content);
      return !agent && t.status === TaskStatus.PENDING;
    });

    return pendingTasks.map((task) => this.recommendAgent(task, tasks));
  }

  /**
   * Detect overloaded agents
   */
  public detectOverload(tasks: Task[]): Array<{ agent: AgentName; load: number; threshold: number }> {
    const workloads = this.calculateWorkloads(tasks);
    const threshold = this.strategy.maxTasksPerAgent || 5;
    const overloaded: Array<{ agent: AgentName; load: number; threshold: number }> = [];

    workloads.forEach((workload, agent) => {
      if (workload.currentLoad > threshold) {
        overloaded.push({
          agent,
          load: workload.currentLoad,
          threshold,
        });
      }
    });

    return overloaded;
  }

  /**
   * Render workload report
   */
  public renderWorkloadReport(tasks: Task[]): string {
    const lines: string[] = [];
    const workloads = this.calculateWorkloads(tasks);

    const title = this.language === 'ja' ? '📊 エージェント負荷レポート' : '📊 Agent Workload Report';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    // Sort by current load
    const sortedWorkloads = Array.from(workloads.entries())
      .sort((a, b) => b[1].currentLoad - a[1].currentLoad);

    sortedWorkloads.forEach(([agent, workload]) => {
      const agentInfo = AGENT_SPECIALIZATIONS[agent];
      const emoji = this.getAgentEmoji(agent);

      // Load bar
      const maxLoad = this.strategy.maxTasksPerAgent || 5;
      const loadPercentage = Math.min(workload.currentLoad / maxLoad, 1);
      const barWidth = 20;
      const filled = Math.round(barWidth * loadPercentage);
      const empty = barWidth - filled;

      let barColor = COLORS.GREEN;
      if (loadPercentage > 0.8) barColor = COLORS.RED;
      else if (loadPercentage > 0.5) barColor = COLORS.YELLOW;

      const loadBar = `${barColor}${'▓'.repeat(filled)}${COLORS.GRAY}${'░'.repeat(empty)}${COLORS.RESET}`;

      lines.push(`${emoji} ${COLORS.BRIGHT}${agent}${COLORS.RESET}`);
      lines.push(`  ${loadBar} ${workload.currentLoad}/${maxLoad}`);

      // Stats
      const stats: string[] = [];
      if (workload.activeTasks > 0) {
        stats.push(`${COLORS.YELLOW}⚡ ${workload.activeTasks}${COLORS.RESET}`);
      }
      if (workload.pendingTasks > 0) {
        stats.push(`${COLORS.GRAY}⏳ ${workload.pendingTasks}${COLORS.RESET}`);
      }
      if (workload.completedTasks > 0) {
        stats.push(`${COLORS.GREEN}✅ ${workload.completedTasks}${COLORS.RESET}`);
      }

      if (stats.length > 0) {
        lines.push(`  ${stats.join('  ')}`);
      }

      // Success rate
      if (workload.completedTasks > 0 || workload.failedTasks > 0) {
        const successPercent = Math.round(workload.successRate * 100);
        const rateColor = successPercent >= 90 ? COLORS.GREEN : successPercent >= 70 ? COLORS.YELLOW : COLORS.RED;
        lines.push(`  ${this.language === 'ja' ? '成功率' : 'Success rate'}: ${rateColor}${successPercent}%${COLORS.RESET}`);
      }

      lines.push('');
    });

    // Overload warnings
    const overloaded = this.detectOverload(tasks);
    if (overloaded.length > 0) {
      lines.push('━'.repeat(70));
      const warningTitle = this.language === 'ja' ? '⚠️  過負荷警告' : '⚠️  Overload Warning';
      lines.push(`${COLORS.RED}${COLORS.BRIGHT}${warningTitle}${COLORS.RESET}`);
      lines.push('');

      overloaded.forEach(({ agent, load, threshold }) => {
        const emoji = this.getAgentEmoji(agent);
        const msg = this.language === 'ja'
          ? `${emoji} ${agent}: ${load}タスク (上限: ${threshold})`
          : `${emoji} ${agent}: ${load} tasks (limit: ${threshold})`;
        lines.push(`  ${COLORS.RED}${msg}${COLORS.RESET}`);
      });

      lines.push('');
    }

    lines.push('━'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Render task assignment recommendation
   */
  public renderRecommendation(assignment: TaskAssignment): string {
    const lines: string[] = [];
    const emoji = this.getAgentEmoji(assignment.recommendedAgent);

    const title = this.language === 'ja' ? '💡 推奨割り当て' : '💡 Recommended Assignment';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('');

    // Task
    const taskLabel = this.language === 'ja' ? 'タスク' : 'Task';
    lines.push(`${COLORS.BRIGHT}${taskLabel}:${COLORS.RESET} ${assignment.task.content}`);
    lines.push('');

    // Recommended agent
    const recommendedLabel = this.language === 'ja' ? '推奨エージェント' : 'Recommended Agent';
    lines.push(`${COLORS.BRIGHT}${recommendedLabel}:${COLORS.RESET} ${emoji} ${assignment.recommendedAgent}`);
    lines.push(`${COLORS.GRAY}Score: ${assignment.score}/100${COLORS.RESET}`);
    lines.push(`${COLORS.GRAY}Reason: ${assignment.reasoning}${COLORS.RESET}`);

    // Alternatives
    if (assignment.alternativeAgents.length > 0) {
      lines.push('');
      const alternativesLabel = this.language === 'ja' ? '代替候補' : 'Alternatives';
      lines.push(`${COLORS.BRIGHT}${alternativesLabel}:${COLORS.RESET}`);

      assignment.alternativeAgents.forEach((alt) => {
        const altEmoji = this.getAgentEmoji(alt.agent);
        lines.push(`  ${altEmoji} ${alt.agent} (${alt.score}/100)`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Get agent emoji
   */
  private getAgentEmoji(agent: AgentName): string {
    const emojis: Record<AgentName, string> = {
      Alex: '🙂',
      Riley: '🧐',
      Skye: '😐',
      Finn: '😤',
      Eden: '🤓',
      Kai: '🤔',
      Leo: '😌',
      Iris: '🤨',
      Nova: '😄',
      Mina: '😊',
      Theo: '😬',
      Blake: '😎',
    };

    return emojis[agent] || '👤';
  }

  /**
   * Update strategy
   */
  public setStrategy(strategy: Partial<LoadBalancingStrategy>): void {
    this.strategy = {
      ...this.strategy,
      ...strategy,
    };
  }

  /**
   * Get current strategy
   */
  public getStrategy(): LoadBalancingStrategy {
    return { ...this.strategy };
  }
}
