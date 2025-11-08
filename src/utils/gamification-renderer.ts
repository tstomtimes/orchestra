/**
 * Gamification Renderer
 *
 * Renders agent stats, badges, achievements, and leaderboards
 * in beautiful visual format.
 */

import {
  AgentName,
  AgentStats,
  Badge,
  Achievement,
  LeaderboardEntry,
  BadgeRarity,
} from '../types/gamification.types';

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m',
  WHITE: '\x1b[37m',
};

const AGENT_EMOJIS: Record<AgentName, string> = {
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

const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: COLORS.GRAY,
  rare: COLORS.BLUE,
  epic: COLORS.MAGENTA,
  legendary: COLORS.YELLOW,
};

export class GamificationRenderer {
  private language: string;

  constructor(language: string = 'en') {
    this.language = language;
  }

  /**
   * Render XP progress bar
   */
  private renderXPBar(current: number, max: number, width: number = 30): string {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(width * percentage);
    const empty = width - filled;

    const bar = '▓'.repeat(filled) + '░'.repeat(empty);
    return `${COLORS.CYAN}[${bar}]${COLORS.RESET} ${COLORS.BRIGHT}${current}/${max} XP${COLORS.RESET}`;
  }

  /**
   * Render level up celebration
   */
  public renderLevelUp(agent: AgentName, newLevel: number, title: string, titleJa: string): string {
    const lines: string[] = [];
    const emoji = AGENT_EMOJIS[agent];
    const displayTitle = this.language === 'ja' ? titleJa : title;

    lines.push('');
    lines.push('╔═══════════════════════════════════════════════════════════╗');
    lines.push('║                                                           ║');
    lines.push(
      `║  ${COLORS.BRIGHT}${COLORS.YELLOW}🎉 LEVEL UP! 🎉${COLORS.RESET}                                      ║`
    );
    lines.push('║                                                           ║');
    lines.push(
      `║  ${emoji} ${COLORS.BRIGHT}${agent}${COLORS.RESET} ${
        this.language === 'ja' ? 'がレベルアップしました' : 'leveled up'
      }!              ║`
    );
    lines.push(
      `║  ${COLORS.BRIGHT}${COLORS.CYAN}Level ${newLevel}${COLORS.RESET} - ${COLORS.MAGENTA}${displayTitle}${COLORS.RESET}                          ║`
    );
    lines.push('║                                                           ║');
    lines.push('╚═══════════════════════════════════════════════════════════╝');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render badge earned celebration
   */
  public renderBadgeEarned(agent: AgentName, badge: Badge): string {
    const lines: string[] = [];
    const emoji = AGENT_EMOJIS[agent];
    const rarityColor = RARITY_COLORS[badge.rarity];
    const displayName = this.language === 'ja' ? badge.nameJa : badge.name;
    const displayDesc = this.language === 'ja' ? badge.descriptionJa : badge.description;

    lines.push('');
    lines.push('┌───────────────────────────────────────────────────────────┐');
    lines.push(`│  ${COLORS.BRIGHT}${COLORS.YELLOW}✨ NEW BADGE EARNED! ✨${COLORS.RESET}                          │`);
    lines.push('│                                                           │');
    lines.push(
      `│  ${emoji} ${COLORS.BRIGHT}${agent}${COLORS.RESET} earned ${badge.icon} ${rarityColor}${COLORS.BRIGHT}${displayName}${COLORS.RESET}`
    );
    lines.push(`│  ${COLORS.DIM}${displayDesc}${COLORS.RESET}`);
    lines.push('│                                                           │');
    lines.push('└───────────────────────────────────────────────────────────┘');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render agent stats card
   */
  public renderAgentStats(stats: AgentStats): string {
    const lines: string[] = [];
    const emoji = AGENT_EMOJIS[stats.agent];
    const title = this.language === 'ja' ? stats.level.titleJa : stats.level.title;

    lines.push('');
    lines.push('┌───────────────────────────────────────────────────────────┐');
    lines.push(
      `│  ${emoji} ${COLORS.BRIGHT}${COLORS.CYAN}${stats.agent}${COLORS.RESET} - Lv.${stats.level.level} ${COLORS.MAGENTA}${title}${COLORS.RESET}`
    );
    lines.push('├───────────────────────────────────────────────────────────┤');

    // XP Bar
    lines.push(
      `│  ${this.renderXPBar(stats.level.experience, stats.level.experienceToNextLevel)}`
    );
    lines.push('│                                                           │');

    // Statistics
    const statsLabel = this.language === 'ja' ? '統計' : 'Statistics';
    lines.push(`│  ${COLORS.BRIGHT}${statsLabel}:${COLORS.RESET}`);
    lines.push(`│    ${COLORS.GREEN}✅${COLORS.RESET} Tasks: ${stats.statistics.tasksCompleted}`);
    lines.push(
      `│    ${COLORS.YELLOW}⚡${COLORS.RESET} Avg Time: ${this.formatDuration(
        stats.statistics.averageTaskTime
      )}`
    );
    lines.push(
      `│    ${COLORS.CYAN}🏆${COLORS.RESET} Badges: ${stats.badges.filter((b) => b.earnedAt).length}`
    );
    lines.push(
      `│    ${COLORS.MAGENTA}🔥${COLORS.RESET} Streak: ${stats.statistics.currentStreak} ${
        this.language === 'ja' ? '日' : 'days'
      }`
    );

    // Badges
    if (stats.badges.length > 0) {
      lines.push('│                                                           │');
      const badgesLabel = this.language === 'ja' ? 'バッジ' : 'Badges';
      lines.push(`│  ${COLORS.BRIGHT}${badgesLabel}:${COLORS.RESET}`);

      stats.badges.slice(0, 5).forEach((badge) => {
        const rarityColor = RARITY_COLORS[badge.rarity];
        const displayName = this.language === 'ja' ? badge.nameJa : badge.name;
        lines.push(
          `│    ${badge.icon} ${rarityColor}${displayName}${COLORS.RESET}`
        );
      });

      if (stats.badges.length > 5) {
        const more = this.language === 'ja' ? 'さらに' : 'more';
        lines.push(`│    ${COLORS.DIM}...${stats.badges.length - 5} ${more}${COLORS.RESET}`);
      }
    }

    lines.push('└───────────────────────────────────────────────────────────┘');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render leaderboard
   */
  public renderLeaderboard(entries: LeaderboardEntry[], topN: number = 10): string {
    const lines: string[] = [];
    const title = this.language === 'ja' ? '🏆 リーダーボード' : '🏆 Leaderboard';

    lines.push('');
    lines.push(`${COLORS.BRIGHT}${COLORS.YELLOW}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    // Header
    const rankLabel = this.language === 'ja' ? '順位' : 'Rank';
    const agentLabel = this.language === 'ja' ? 'エージェント' : 'Agent';
    const levelLabel = this.language === 'ja' ? 'レベル' : 'Level';
    const xpLabel = 'XP';
    const tasksLabel = this.language === 'ja' ? 'タスク' : 'Tasks';
    const badgesLabel = this.language === 'ja' ? 'バッジ' : 'Badges';

    lines.push(
      `  ${COLORS.DIM}${rankLabel.padEnd(6)}${agentLabel.padEnd(15)}${levelLabel.padEnd(10)}${xpLabel.padEnd(10)}${tasksLabel.padEnd(10)}${badgesLabel}${COLORS.RESET}`
    );
    lines.push('  ' + '─'.repeat(65));

    // Entries
    entries.slice(0, topN).forEach((entry) => {
      const emoji = AGENT_EMOJIS[entry.agent];
      let rankColor = COLORS.WHITE;

      if (entry.rank === 1) rankColor = COLORS.YELLOW;
      else if (entry.rank === 2) rankColor = COLORS.CYAN;
      else if (entry.rank === 3) rankColor = COLORS.MAGENTA;

      const rankDisplay = `${rankColor}#${entry.rank}${COLORS.RESET}`;
      const agentDisplay = `${emoji} ${COLORS.BRIGHT}${entry.agent}${COLORS.RESET}`;
      const levelDisplay = `${COLORS.CYAN}Lv.${entry.level}${COLORS.RESET}`;

      lines.push(
        `  ${rankDisplay.padEnd(6 + 9)}${agentDisplay.padEnd(15 + 9)}${levelDisplay.padEnd(
          10 + 9
        )}${entry.experience.toString().padEnd(10)}${entry.tasksCompleted
          .toString()
          .padEnd(10)}${entry.badges}`
      );
    });

    lines.push('');
    lines.push('━'.repeat(70));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render recent achievements
   */
  public renderRecentAchievements(achievements: Achievement[], limit: number = 5): string {
    const lines: string[] = [];
    const title = this.language === 'ja' ? '⭐ 最近の実績' : '⭐ Recent Achievements';

    lines.push('');
    lines.push(`${COLORS.BRIGHT}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(60));
    lines.push('');

    if (achievements.length === 0) {
      const empty = this.language === 'ja' ? '実績なし' : 'No achievements yet';
      lines.push(`  ${COLORS.DIM}${empty}${COLORS.RESET}`);
    } else {
      achievements.slice(0, limit).forEach((achievement) => {
        const emoji = AGENT_EMOJIS[achievement.agent];
        const rarityColor = RARITY_COLORS[achievement.badge.rarity];
        const message = this.language === 'ja' ? achievement.messageJa : achievement.message;
        const timeAgo = this.formatTimeAgo(achievement.timestamp);

        lines.push(`  ${emoji} ${achievement.badge.icon} ${rarityColor}${COLORS.BRIGHT}${message}${COLORS.RESET}`);
        lines.push(`     ${COLORS.DIM}${timeAgo}${COLORS.RESET}`);
        lines.push('');
      });
    }

    lines.push('━'.repeat(60));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms === Infinity || ms === 0) return 'N/A';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Format time ago
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (this.language === 'ja') {
      if (diffDays > 0) return `${diffDays}日前`;
      if (diffHours > 0) return `${diffHours}時間前`;
      if (diffMinutes > 0) return `${diffMinutes}分前`;
      return 'たった今';
    } else {
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMinutes > 0) return `${diffMinutes}m ago`;
      return 'just now';
    }
  }

  /**
   * Render XP gain notification
   */
  public renderXPGain(agent: AgentName, xp: number, reason: string, reasonJa: string): string {
    const emoji = AGENT_EMOJIS[agent];
    const displayReason = this.language === 'ja' ? reasonJa : reason;

    return `${emoji} ${COLORS.BRIGHT}${agent}${COLORS.RESET} ${COLORS.GREEN}+${xp} XP${COLORS.RESET} ${COLORS.DIM}(${displayReason})${COLORS.RESET}`;
  }

  /**
   * Render compact stats summary
   */
  public renderCompactSummary(
    tasksCompleted: number,
    totalXP: number,
    badgesEarned: number
  ): string {
    return `${COLORS.GREEN}✅ ${tasksCompleted}${COLORS.RESET}  ${COLORS.CYAN}⭐ ${totalXP} XP${COLORS.RESET}  ${COLORS.YELLOW}🏆 ${badgesEarned}${COLORS.RESET}`;
  }
}
