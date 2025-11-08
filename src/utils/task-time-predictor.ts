/**
 * Task Time Predictor
 *
 * Predicts task completion times using:
 * - Historical data (agent-specific completion times)
 * - Task complexity analysis (word count, dependencies, etc.)
 * - Agent performance metrics
 * - Similar task patterns
 * - Machine learning-inspired weighted averaging
 */

import { Task, TaskStatus } from '../types/progress-tracker.types';
import { AgentName } from '../types/gamification.types';

interface TaskComplexity {
  score: number;
  factors: {
    contentLength: number;
    dependencyCount: number;
    keywordComplexity: number;
  };
}

interface TimePrediction {
  estimatedMinutes: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
  basedOn: string;
  factors: string[];
}

interface AgentPerformance {
  agent: AgentName;
  averageTime: number;
  taskCount: number;
  standardDeviation: number;
  fastestTime: number;
  slowestTime: number;
}

interface PredictionReport {
  task: Task;
  agent: AgentName | null;
  prediction: TimePrediction;
  recommendedAgent?: {
    agent: AgentName;
    estimatedMinutes: number;
  };
}

const COMPLEXITY_KEYWORDS = {
  high: ['refactor', 'migration', 'architecture', 'redesign', 'implement', 'integration'],
  medium: ['add', 'update', 'modify', 'enhance', 'improve', 'create'],
  low: ['fix', 'update', 'change', 'adjust', 'tweak', 'minor'],
};

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m',
};

export class TaskTimePredictor {
  private language: string;
  private historicalData: Map<AgentName, number[]>;

  constructor(language: string = 'en') {
    this.language = language;
    this.historicalData = new Map();
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
   * Clean task content
   */
  private cleanContent(content: string): string {
    return content.replace(/\[([A-Z][a-z]+)\]\s*/, '');
  }

  /**
   * Analyze task complexity
   */
  private analyzeComplexity(task: Task): TaskComplexity {
    const content = this.cleanContent(task.content).toLowerCase();
    let score = 50; // Base complexity

    // Factor 1: Content length
    const wordCount = content.split(/\s+/).length;
    const lengthScore = Math.min(wordCount * 2, 30);

    // Factor 2: Dependencies
    const dependencyCount = task.metadata.dependencies?.length || 0;
    const dependencyScore = dependencyCount * 10;

    // Factor 3: Keyword complexity
    let keywordScore = 0;
    COMPLEXITY_KEYWORDS.high.forEach((keyword) => {
      if (content.includes(keyword)) keywordScore += 15;
    });
    COMPLEXITY_KEYWORDS.medium.forEach((keyword) => {
      if (content.includes(keyword)) keywordScore += 5;
    });
    COMPLEXITY_KEYWORDS.low.forEach((keyword) => {
      if (content.includes(keyword)) keywordScore -= 5;
    });

    score += lengthScore + dependencyScore + keywordScore;
    score = Math.max(10, Math.min(100, score)); // Clamp to 10-100

    return {
      score,
      factors: {
        contentLength: lengthScore,
        dependencyCount: dependencyScore,
        keywordComplexity: keywordScore,
      },
    };
  }

  /**
   * Calculate agent performance metrics from historical data
   */
  private calculateAgentPerformance(
    agent: AgentName,
    tasks: Task[]
  ): AgentPerformance | null {
    const agentTasks = tasks.filter((t) => {
      const taskAgent = this.extractAgent(t.content);
      return (
        taskAgent === agent &&
        t.status === TaskStatus.COMPLETED &&
        t.metadata.actualDuration &&
        t.metadata.actualDuration > 0
      );
    });

    if (agentTasks.length === 0) return null;

    const times = agentTasks
      .map((t) => t.metadata.actualDuration!)
      .map((ms) => ms / (1000 * 60)); // Convert to minutes

    const averageTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const variance =
      times.reduce((sum, t) => sum + Math.pow(t - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      agent,
      averageTime,
      taskCount: agentTasks.length,
      standardDeviation,
      fastestTime: Math.min(...times),
      slowestTime: Math.max(...times),
    };
  }

  /**
   * Predict task completion time
   */
  public predictTime(task: Task, historicalTasks: Task[]): TimePrediction {
    const agent = this.extractAgent(task.content);
    const complexity = this.analyzeComplexity(task);
    const factors: string[] = [];

    let estimatedMinutes = 60; // Default: 1 hour
    let confidence = 0.3; // Low confidence by default
    let basedOn = this.language === 'ja' ? 'デフォルト推定' : 'Default estimate';

    // Method 1: Use agent-specific historical data
    if (agent) {
      const performance = this.calculateAgentPerformance(agent, historicalTasks);

      if (performance && performance.taskCount >= 3) {
        // Adjust based on complexity
        const complexityMultiplier = complexity.score / 50; // 50 is baseline
        estimatedMinutes = performance.averageTime * complexityMultiplier;
        confidence = Math.min(0.9, 0.5 + performance.taskCount * 0.05);
        basedOn = this.language === 'ja'
          ? `${agent}の過去${performance.taskCount}件のタスク`
          : `${performance.taskCount} historical tasks from ${agent}`;

        factors.push(
          this.language === 'ja'
            ? `エージェント実績: 平均${Math.round(performance.averageTime)}分`
            : `Agent history: avg ${Math.round(performance.averageTime)}min`
        );
      }
    }

    // Method 2: Find similar tasks
    const similarTasks = this.findSimilarTasks(task, historicalTasks);
    if (similarTasks.length >= 2) {
      const similarTimes = similarTasks
        .filter((t) => t.metadata.actualDuration)
        .map((t) => t.metadata.actualDuration! / (1000 * 60));

      if (similarTimes.length >= 2) {
        const avgSimilar = similarTimes.reduce((sum, t) => sum + t, 0) / similarTimes.length;

        // Blend with agent data if available
        if (confidence > 0.5) {
          estimatedMinutes = (estimatedMinutes + avgSimilar) / 2;
          confidence = Math.min(0.95, confidence + 0.1);
        } else {
          estimatedMinutes = avgSimilar;
          confidence = 0.6;
          basedOn = this.language === 'ja'
            ? `類似タスク${similarTimes.length}件`
            : `${similarTimes.length} similar tasks`;
        }

        factors.push(
          this.language === 'ja'
            ? `類似タスク: 平均${Math.round(avgSimilar)}分`
            : `Similar tasks: avg ${Math.round(avgSimilar)}min`
        );
      }
    }

    // Method 3: Complexity-based estimation
    if (confidence < 0.5) {
      // Use complexity score to estimate
      // 10 complexity = 15min, 100 complexity = 180min
      estimatedMinutes = 15 + (complexity.score - 10) * (165 / 90);
      confidence = 0.4;

      factors.push(
        this.language === 'ja'
          ? `複雑度スコア: ${complexity.score}/100`
          : `Complexity score: ${complexity.score}/100`
      );
    }

    // Add complexity factors
    if (complexity.factors.dependencyCount > 0) {
      factors.push(
        this.language === 'ja'
          ? `依存関係: ${task.metadata.dependencies?.length || 0}件`
          : `Dependencies: ${task.metadata.dependencies?.length || 0}`
      );
    }

    // Calculate range (±20% with higher uncertainty for low confidence)
    const uncertainty = 1 - confidence * 0.5; // 0.5 to 1.0
    const minMultiplier = 1 - (0.3 * uncertainty);
    const maxMultiplier = 1 + (0.5 * uncertainty);

    return {
      estimatedMinutes: Math.round(estimatedMinutes),
      confidence: Math.round(confidence * 100) / 100,
      range: {
        min: Math.round(estimatedMinutes * minMultiplier),
        max: Math.round(estimatedMinutes * maxMultiplier),
      },
      basedOn,
      factors,
    };
  }

  /**
   * Find similar tasks based on content and complexity
   */
  private findSimilarTasks(task: Task, historicalTasks: Task[]): Task[] {
    const content = this.cleanContent(task.content).toLowerCase();
    const words = new Set(content.split(/\s+/).filter((w) => w.length > 3));
    const complexity = this.analyzeComplexity(task);

    const scored = historicalTasks
      .filter((t) => t.status === TaskStatus.COMPLETED && t.metadata.actualDuration)
      .map((t) => {
        const tContent = this.cleanContent(t.content).toLowerCase();
        const tWords = new Set(tContent.split(/\s+/).filter((w) => w.length > 3));
        const tComplexity = this.analyzeComplexity(t);

        // Jaccard similarity for words
        const intersection = new Set([...words].filter((w) => tWords.has(w)));
        const union = new Set([...words, ...tWords]);
        const wordSimilarity = intersection.size / union.size;

        // Complexity similarity
        const complexityDiff = Math.abs(complexity.score - tComplexity.score);
        const complexitySimilarity = 1 - complexityDiff / 100;

        // Combined score
        const score = wordSimilarity * 0.7 + complexitySimilarity * 0.3;

        return { task: t, score };
      })
      .filter((s) => s.score > 0.3) // Only reasonably similar tasks
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored.map((s) => s.task);
  }

  /**
   * Predict times for all pending tasks
   */
  public predictAll(tasks: Task[]): PredictionReport[] {
    const pendingTasks = tasks.filter((t) => t.status === TaskStatus.PENDING);
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);

    return pendingTasks.map((task) => {
      const agent = this.extractAgent(task.content);
      const prediction = this.predictTime(task, completedTasks);

      return {
        task,
        agent,
        prediction,
      };
    });
  }

  /**
   * Calculate total estimated time remaining
   */
  public calculateTotalRemaining(tasks: Task[]): {
    totalMinutes: number;
    totalHours: number;
    byAgent: Map<AgentName, number>;
    confidence: number;
  } {
    const predictions = this.predictAll(tasks);
    let totalMinutes = 0;
    let totalConfidence = 0;
    const byAgent = new Map<AgentName, number>();

    predictions.forEach((pred) => {
      totalMinutes += pred.prediction.estimatedMinutes;
      totalConfidence += pred.prediction.confidence;

      if (pred.agent) {
        const current = byAgent.get(pred.agent) || 0;
        byAgent.set(pred.agent, current + pred.prediction.estimatedMinutes);
      }
    });

    const avgConfidence = predictions.length > 0 ? totalConfidence / predictions.length : 0;

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      byAgent,
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  /**
   * Render prediction report
   */
  public renderPrediction(prediction: TimePrediction): string {
    const lines: string[] = [];

    // Estimated time
    const hours = Math.floor(prediction.estimatedMinutes / 60);
    const minutes = prediction.estimatedMinutes % 60;
    const timeStr =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    lines.push(`${COLORS.BRIGHT}⏱️  ${timeStr}${COLORS.RESET}`);

    // Confidence
    const confPercent = Math.round(prediction.confidence * 100);
    let confColor = COLORS.GREEN;
    if (confPercent < 50) confColor = COLORS.RED;
    else if (confPercent < 70) confColor = COLORS.YELLOW;

    const confLabel = this.language === 'ja' ? '信頼度' : 'Confidence';
    lines.push(`${confLabel}: ${confColor}${confPercent}%${COLORS.RESET}`);

    // Range
    const rangeLabel = this.language === 'ja' ? '予測範囲' : 'Range';
    lines.push(
      `${COLORS.GRAY}${rangeLabel}: ${prediction.range.min}-${prediction.range.max} min${COLORS.RESET}`
    );

    // Based on
    lines.push(`${COLORS.GRAY}${prediction.basedOn}${COLORS.RESET}`);

    return lines.join('\n');
  }

  /**
   * Render full prediction report
   */
  public renderReport(tasks: Task[]): string {
    const lines: string[] = [];
    const predictions = this.predictAll(tasks);
    const totals = this.calculateTotalRemaining(tasks);

    const title = this.language === 'ja' ? '⏱️  完了時間予測' : '⏱️  Time Predictions';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    // Summary
    const summaryLabel = this.language === 'ja' ? '概要' : 'Summary';
    lines.push(`${COLORS.BRIGHT}${summaryLabel}${COLORS.RESET}`);
    lines.push(
      `  ${this.language === 'ja' ? '総予測時間' : 'Total estimated time'}: ${COLORS.BRIGHT}${
        totals.totalHours
      }h${COLORS.RESET} (${totals.totalMinutes} min)`
    );

    const confPercent = Math.round(totals.confidence * 100);
    let confColor = COLORS.GREEN;
    if (confPercent < 50) confColor = COLORS.RED;
    else if (confPercent < 70) confColor = COLORS.YELLOW;

    lines.push(
      `  ${this.language === 'ja' ? '平均信頼度' : 'Average confidence'}: ${confColor}${confPercent}%${COLORS.RESET}`
    );
    lines.push('');

    // By agent
    if (totals.byAgent.size > 0) {
      const byAgentLabel = this.language === 'ja' ? 'エージェント別' : 'By Agent';
      lines.push(`${COLORS.BRIGHT}${byAgentLabel}${COLORS.RESET}`);

      const sortedAgents = Array.from(totals.byAgent.entries()).sort((a, b) => b[1] - a[1]);

      sortedAgents.forEach(([agent, minutes]) => {
        const emoji = this.getAgentEmoji(agent);
        const hours = Math.round((minutes / 60) * 10) / 10;
        lines.push(`  ${emoji} ${agent}: ${hours}h (${minutes} min)`);
      });

      lines.push('');
    }

    // Individual predictions
    if (predictions.length > 0) {
      lines.push('━'.repeat(70));
      const detailsLabel = this.language === 'ja' ? 'タスク別予測' : 'Task Predictions';
      lines.push(`${COLORS.BRIGHT}${detailsLabel}${COLORS.RESET}`);
      lines.push('');

      predictions.forEach((pred, index) => {
        const emoji = pred.agent ? this.getAgentEmoji(pred.agent) : '📝';
        const cleanContent = this.cleanContent(pred.task.content);

        lines.push(`${emoji} ${cleanContent}`);

        const hours = Math.floor(pred.prediction.estimatedMinutes / 60);
        const minutes = pred.prediction.estimatedMinutes % 60;
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const confPercent = Math.round(pred.prediction.confidence * 100);
        let confColor = COLORS.GREEN;
        if (confPercent < 50) confColor = COLORS.RED;
        else if (confPercent < 70) confColor = COLORS.YELLOW;

        lines.push(
          `  ${COLORS.CYAN}⏱️  ${timeStr}${COLORS.RESET}  ${confColor}${confPercent}%${COLORS.RESET}  ${COLORS.GRAY}(${pred.prediction.range.min}-${pred.prediction.range.max}min)${COLORS.RESET}`
        );

        if (index < predictions.length - 1) {
          lines.push('');
        }
      });
    }

    lines.push('');
    lines.push('━'.repeat(70));

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
}
