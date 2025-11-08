/**
 * Dependency Graph Renderer
 *
 * Visualizes task dependencies in a graph format with:
 * - Dependency arrows showing task relationships
 * - Critical path highlighting
 * - Cycle detection and warnings
 * - Parallel execution opportunities
 */

import { Task } from '../types/progress-tracker.types';

interface AgentInfo {
  emoji: string;
  name: string;
  color: string;
}

const AGENTS: Record<string, AgentInfo> = {
  Alex: { emoji: '🙂', name: 'Alex', color: '\x1b[36m' },
  Riley: { emoji: '🧐', name: 'Riley', color: '\x1b[35m' },
  Skye: { emoji: '😐', name: 'Skye', color: '\x1b[34m' },
  Finn: { emoji: '😤', name: 'Finn', color: '\x1b[33m' },
  Eden: { emoji: '🤓', name: 'Eden', color: '\x1b[32m' },
  Kai: { emoji: '🤔', name: 'Kai', color: '\x1b[36m' },
  Leo: { emoji: '😌', name: 'Leo', color: '\x1b[35m' },
  Iris: { emoji: '🤨', name: 'Iris', color: '\x1b[31m' },
  Nova: { emoji: '😄', name: 'Nova', color: '\x1b[33m' },
  Mina: { emoji: '😊', name: 'Mina', color: '\x1b[32m' },
  Theo: { emoji: '😬', name: 'Theo', color: '\x1b[34m' },
  Blake: { emoji: '😎', name: 'Blake', color: '\x1b[35m' },
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
  MAGENTA: '\x1b[35m',
};

const STATUS_ICONS = {
  pending: '⏳',
  in_progress: '⚡',
  completed: '✅',
  blocked: '🚫',
  failed: '❌',
};

interface DependencyEdge {
  from: string;
  to: string;
  type: 'hard' | 'soft';
}

interface DependencyNode {
  id: string;
  task: Task;
  level: number;
  dependsOn: string[];
  dependents: string[];
  isCriticalPath: boolean;
  canRunParallel: boolean;
}

interface CycleInfo {
  nodes: string[];
  detected: boolean;
}

export class DependencyGraphRenderer {
  private language: string;

  constructor(language: string = 'en') {
    this.language = language;
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
   * Build dependency graph from tasks
   */
  private buildDependencyGraph(tasks: Task[]): Map<string, DependencyNode> {
    const graph = new Map<string, DependencyNode>();

    // Create nodes
    tasks.forEach((task) => {
      const dependsOn = task.metadata.dependencies || [];
      graph.set(task.id, {
        id: task.id,
        task,
        level: 0,
        dependsOn,
        dependents: [],
        isCriticalPath: false,
        canRunParallel: false,
      });
    });

    // Build dependent relationships
    graph.forEach((node) => {
      node.dependsOn.forEach((depId) => {
        const depNode = graph.get(depId);
        if (depNode) {
          depNode.dependents.push(node.id);
        }
      });
    });

    // Calculate levels (topological sort)
    this.calculateLevels(graph);

    // Identify critical path
    this.identifyCriticalPath(graph);

    // Identify parallel execution opportunities
    this.identifyParallelTasks(graph);

    return graph;
  }

  /**
   * Calculate task levels using topological sort
   */
  private calculateLevels(graph: Map<string, DependencyNode>): void {
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string): number => {
      if (temp.has(nodeId)) {
        // Cycle detected
        return 0;
      }
      if (visited.has(nodeId)) {
        const node = graph.get(nodeId);
        return node ? node.level : 0;
      }

      temp.add(nodeId);
      const node = graph.get(nodeId);
      if (!node) return 0;

      let maxLevel = 0;
      node.dependsOn.forEach((depId) => {
        const depLevel = visit(depId);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      });

      node.level = maxLevel;
      temp.delete(nodeId);
      visited.add(nodeId);

      return maxLevel;
    };

    graph.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });
  }

  /**
   * Identify critical path (longest path through dependencies)
   */
  private identifyCriticalPath(graph: Map<string, DependencyNode>): void {
    // Find nodes with no dependents (end nodes)
    const endNodes: DependencyNode[] = [];
    graph.forEach((node) => {
      if (node.dependents.length === 0) {
        endNodes.push(node);
      }
    });

    // Trace back from end nodes to find longest path
    const visited = new Set<string>();
    const onPath = new Set<string>();

    const findLongestPath = (nodeId: string, currentLength: number): number => {
      if (visited.has(nodeId)) return currentLength;

      const node = graph.get(nodeId);
      if (!node) return currentLength;

      let maxLength = currentLength;
      node.dependsOn.forEach((depId) => {
        const length = findLongestPath(depId, currentLength + 1);
        if (length > maxLength) {
          maxLength = length;
        }
      });

      return maxLength;
    };

    // Find the longest path
    let longestPath = 0;
    let longestEndNode: DependencyNode | null = null;

    endNodes.forEach((node) => {
      const pathLength = findLongestPath(node.id, 0);
      if (pathLength > longestPath) {
        longestPath = pathLength;
        longestEndNode = node;
      }
    });

    // Mark critical path
    if (longestEndNode) {
      const markCriticalPath = (nodeId: string): void => {
        const node = graph.get(nodeId);
        if (!node || onPath.has(nodeId)) return;

        node.isCriticalPath = true;
        onPath.add(nodeId);

        // Find the dependency with the highest level
        let maxLevel = -1;
        let criticalDep: string | null = null;

        node.dependsOn.forEach((depId) => {
          const depNode = graph.get(depId);
          if (depNode && depNode.level > maxLevel) {
            maxLevel = depNode.level;
            criticalDep = depId;
          }
        });

        if (criticalDep) {
          markCriticalPath(criticalDep);
        }
      };

      markCriticalPath(longestEndNode.id);
    }
  }

  /**
   * Identify tasks that can run in parallel
   */
  private identifyParallelTasks(graph: Map<string, DependencyNode>): void {
    // Group tasks by level
    const levelGroups = new Map<number, DependencyNode[]>();

    graph.forEach((node) => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });

    // Mark tasks that can run in parallel (same level, independent)
    levelGroups.forEach((nodes) => {
      if (nodes.length > 1) {
        nodes.forEach((node) => {
          node.canRunParallel = true;
        });
      }
    });
  }

  /**
   * Detect dependency cycles
   */
  private detectCycles(graph: Map<string, DependencyNode>): CycleInfo {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycle: string[] = [];

    const hasCycle = (nodeId: string, path: string[]): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recStack.add(nodeId);
        path.push(nodeId);

        const node = graph.get(nodeId);
        if (node) {
          for (const depId of node.dependsOn) {
            if (!visited.has(depId) && hasCycle(depId, path)) {
              return true;
            } else if (recStack.has(depId)) {
              // Cycle found
              const cycleStart = path.indexOf(depId);
              cycle.push(...path.slice(cycleStart), depId);
              return true;
            }
          }
        }
      }

      recStack.delete(nodeId);
      path.pop();
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (hasCycle(nodeId, [])) {
        return { nodes: cycle, detected: true };
      }
    }

    return { nodes: [], detected: false };
  }

  /**
   * Render dependency graph
   */
  public render(tasks: Task[]): string {
    const lines: string[] = [];

    if (tasks.length === 0) {
      return this.language === 'ja' ? 'タスクがありません' : 'No tasks';
    }

    const graph = this.buildDependencyGraph(tasks);

    // Header
    const title = this.language === 'ja' ? '🔗 依存関係グラフ' : '🔗 Dependency Graph';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    // Check for cycles
    const cycleInfo = this.detectCycles(graph);
    if (cycleInfo.detected) {
      const warningMsg = this.language === 'ja'
        ? '⚠️  循環依存が検出されました！'
        : '⚠️  Circular dependency detected!';
      lines.push(`${COLORS.RED}${COLORS.BRIGHT}${warningMsg}${COLORS.RESET}`);
      lines.push(`${COLORS.RED}Cycle: ${cycleInfo.nodes.join(' → ')}${COLORS.RESET}`);
      lines.push('');
    }

    // Group tasks by level
    const levelGroups = new Map<number, DependencyNode[]>();
    graph.forEach((node) => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });

    // Render by levels
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

    sortedLevels.forEach((level) => {
      const nodes = levelGroups.get(level) || [];

      // Level header
      const levelLabel = this.language === 'ja' ? `レベル ${level}` : `Level ${level}`;
      lines.push(`${COLORS.BRIGHT}${levelLabel}${COLORS.RESET}`);

      // Show parallel execution hint
      if (nodes.length > 1 && nodes[0].canRunParallel) {
        const parallelMsg = this.language === 'ja'
          ? `  💡 ${nodes.length}個のタスクを並行実行可能`
          : `  💡 ${nodes.length} tasks can run in parallel`;
        lines.push(`${COLORS.CYAN}${parallelMsg}${COLORS.RESET}`);
      }

      lines.push('');

      // Render nodes at this level
      nodes.forEach((node, index) => {
        const isLast = index === nodes.length - 1;
        lines.push(this.renderNode(node, isLast, graph));

        // Show dependencies
        if (node.dependsOn.length > 0) {
          node.dependsOn.forEach((depId, depIndex) => {
            const depNode = graph.get(depId);
            if (depNode) {
              const isLastDep = depIndex === node.dependsOn.length - 1;
              lines.push(this.renderDependency(depNode, isLastDep));
            }
          });
        }

        if (!isLast) lines.push('');
      });

      lines.push('');
    });

    // Critical path summary
    const criticalPathNodes = Array.from(graph.values()).filter((n) => n.isCriticalPath);
    if (criticalPathNodes.length > 0) {
      lines.push('━'.repeat(70));
      const criticalLabel = this.language === 'ja' ? '🎯 クリティカルパス' : '🎯 Critical Path';
      lines.push(`${COLORS.BRIGHT}${COLORS.MAGENTA}${criticalLabel}${COLORS.RESET}`);
      lines.push('');

      criticalPathNodes
        .sort((a, b) => a.level - b.level)
        .forEach((node, index) => {
          const arrow = index < criticalPathNodes.length - 1 ? ' ↓' : '';
          lines.push(this.renderCriticalNode(node) + arrow);
        });

      lines.push('');
    }

    // Execution plan
    lines.push('━'.repeat(70));
    const planLabel = this.language === 'ja' ? '📋 実行プラン' : '📋 Execution Plan';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${planLabel}${COLORS.RESET}`);
    lines.push('');
    lines.push(this.renderExecutionPlan(graph));

    lines.push('━'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Render a single node
   */
  private renderNode(node: DependencyNode, isLast: boolean, graph: Map<string, DependencyNode>): string {
    const task = node.task;
    const agent = this.extractAgent(task.content);
    const cleanContent = this.cleanContent(task.content);
    const agentInfo = agent ? this.getAgentInfo(agent) : null;

    const statusIcon = STATUS_ICONS[task.status] || '○';

    // Critical path indicator
    const criticalMark = node.isCriticalPath ? `${COLORS.MAGENTA}⭐${COLORS.RESET} ` : '';

    // Parallel indicator
    const parallelMark = node.canRunParallel ? `${COLORS.CYAN}⚡${COLORS.RESET} ` : '';

    // Agent display
    const agentDisplay = agentInfo
      ? `${agentInfo.color}${agentInfo.emoji} ${agentInfo.name}${COLORS.RESET}`
      : '';

    // Status color
    let statusColor = COLORS.GRAY;
    if (task.status === 'completed') statusColor = COLORS.GREEN;
    else if (task.status === 'in_progress') statusColor = COLORS.YELLOW;
    else if (task.status === 'failed') statusColor = COLORS.RED;

    return `  ${criticalMark}${parallelMark}${statusIcon} ${agentDisplay} ${statusColor}${cleanContent}${COLORS.RESET}`;
  }

  /**
   * Render a dependency arrow
   */
  private renderDependency(depNode: DependencyNode, isLast: boolean): string {
    const task = depNode.task;
    const agent = this.extractAgent(task.content);
    const cleanContent = this.cleanContent(task.content);
    const agentInfo = agent ? this.getAgentInfo(agent) : null;

    const arrow = isLast ? '    └─→ ' : '    ├─→ ';
    const statusIcon = STATUS_ICONS[task.status] || '○';

    const agentDisplay = agentInfo ? `${agentInfo.emoji}` : '';

    return `${COLORS.DIM}${arrow}${statusIcon} ${agentDisplay} ${cleanContent}${COLORS.RESET}`;
  }

  /**
   * Render critical path node
   */
  private renderCriticalNode(node: DependencyNode): string {
    const task = node.task;
    const agent = this.extractAgent(task.content);
    const cleanContent = this.cleanContent(task.content);
    const agentInfo = agent ? this.getAgentInfo(agent) : null;

    const statusIcon = STATUS_ICONS[task.status] || '○';
    const agentDisplay = agentInfo
      ? `${agentInfo.color}${agentInfo.emoji} ${agentInfo.name}${COLORS.RESET}`
      : '';

    return `  ${statusIcon} ${agentDisplay} ${COLORS.MAGENTA}${cleanContent}${COLORS.RESET}`;
  }

  /**
   * Render execution plan
   */
  private renderExecutionPlan(graph: Map<string, DependencyNode>): string {
    const lines: string[] = [];

    // Group by level
    const levelGroups = new Map<number, DependencyNode[]>();
    graph.forEach((node) => {
      if (node.task.status !== 'completed') {
        if (!levelGroups.has(node.level)) {
          levelGroups.set(node.level, []);
        }
        levelGroups.get(node.level)!.push(node);
      }
    });

    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

    sortedLevels.forEach((level, index) => {
      const nodes = levelGroups.get(level) || [];

      const stepLabel = this.language === 'ja' ? `ステップ ${index + 1}` : `Step ${index + 1}`;
      lines.push(`${COLORS.BRIGHT}${stepLabel}:${COLORS.RESET}`);

      if (nodes.length > 1) {
        const parallelMsg = this.language === 'ja' ? '（並行実行）' : '(Run in parallel)';
        lines.push(`  ${COLORS.CYAN}${parallelMsg}${COLORS.RESET}`);
      }

      nodes.forEach((node) => {
        const agent = this.extractAgent(node.task.content);
        const cleanContent = this.cleanContent(node.task.content);
        const agentInfo = agent ? this.getAgentInfo(agent) : null;

        const agentDisplay = agentInfo ? `${agentInfo.emoji}` : '';
        lines.push(`  - ${agentDisplay} ${cleanContent}`);
      });

      if (index < sortedLevels.length - 1) {
        lines.push('');
      }
    });

    if (lines.length === 0) {
      const allDoneMsg = this.language === 'ja' ? '全てのタスクが完了しました！' : 'All tasks completed!';
      lines.push(`  ${COLORS.GREEN}${allDoneMsg}${COLORS.RESET}`);
    }

    return lines.join('\n');
  }

  /**
   * Render compact dependency summary
   */
  public renderCompact(tasks: Task[]): string {
    const graph = this.buildDependencyGraph(tasks);
    const cycleInfo = this.detectCycles(graph);

    const totalTasks = tasks.length;
    const criticalPathLength = Array.from(graph.values()).filter((n) => n.isCriticalPath).length;
    const parallelOpportunities = Array.from(graph.values()).filter((n) => n.canRunParallel).length;

    const parts: string[] = [];

    if (cycleInfo.detected) {
      parts.push(`${COLORS.RED}⚠️ Cycles${COLORS.RESET}`);
    }

    parts.push(`${COLORS.MAGENTA}⭐ Critical: ${criticalPathLength}${COLORS.RESET}`);
    parts.push(`${COLORS.CYAN}⚡ Parallel: ${parallelOpportunities}${COLORS.RESET}`);

    return parts.join('  ');
  }
}
