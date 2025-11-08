/**
 * Gamification Manager
 *
 * Manages agent levels, experience, badges, and achievements.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  AgentName,
  AgentStats,
  Badge,
  BadgeType,
  Achievement,
  ExperienceGain,
  GamificationState,
  LeaderboardEntry,
  BADGE_DEFINITIONS,
  LEVEL_DATA,
  XP_VALUES,
} from '../types/gamification.types';

export class GamificationManager {
  private state: GamificationState;
  private stateFilePath: string;
  private language: string;

  constructor(options?: { stateFilePath?: string; language?: string }) {
    this.language = options?.language || process.env.ORCHESTRA_LANGUAGE || 'en';
    this.stateFilePath =
      options?.stateFilePath ||
      path.join(process.cwd(), '.orchestra', 'cache', 'gamification.json');

    this.state = this.loadState();
  }

  /**
   * Load gamification state from file or create new
   */
  private loadState(): GamificationState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        const parsed = JSON.parse(data);

        // Convert date strings back to Date objects
        Object.values(parsed.agents as Record<AgentName, AgentStats>).forEach((agent) => {
          agent.statistics.lastActive = new Date(agent.statistics.lastActive);
          agent.statistics.firstSeen = new Date(agent.statistics.firstSeen);
          agent.badges.forEach((badge) => {
            if (badge.earnedAt) {
              badge.earnedAt = new Date(badge.earnedAt);
            }
          });
        });

        parsed.recentAchievements.forEach((achievement: Achievement) => {
          achievement.timestamp = new Date(achievement.timestamp);
        });

        return parsed;
      }
    } catch (error) {
      console.error('Error loading gamification state:', error);
    }

    return this.createInitialState();
  }

  /**
   * Create initial state with all agents
   */
  private createInitialState(): GamificationState {
    const agents: Record<AgentName, AgentStats> = {} as Record<AgentName, AgentStats>;

    const agentNames: AgentName[] = [
      'Alex',
      'Riley',
      'Skye',
      'Finn',
      'Eden',
      'Kai',
      'Leo',
      'Iris',
      'Nova',
      'Mina',
      'Theo',
      'Blake',
    ];

    agentNames.forEach((agent) => {
      agents[agent] = {
        agent,
        level: {
          level: 1,
          experience: 0,
          experienceToNextLevel: LEVEL_DATA[1].xpRequired,
          title: LEVEL_DATA[0].title,
          titleJa: LEVEL_DATA[0].titleJa,
        },
        badges: [],
        statistics: {
          tasksCompleted: 0,
          tasksFailed: 0,
          totalTaskTime: 0,
          averageTaskTime: 0,
          fastestTask: Infinity,
          longestStreak: 0,
          currentStreak: 0,
          lastActive: new Date(),
          firstSeen: new Date(),
          totalExperience: 0,
        },
        specialties: [],
      };
    });

    return {
      agents,
      globalStats: {
        totalTasks: 0,
        totalBadges: 0,
        teamLevel: 1,
        projectMilestones: 0,
      },
      recentAchievements: [],
      leaderboard: [],
    };
  }

  /**
   * Save state to file
   */
  private saveState(): void {
    try {
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving gamification state:', error);
    }
  }

  /**
   * Award experience to an agent
   */
  public awardExperience(agent: AgentName, amount: number, reason: string, reasonJa: string): ExperienceGain {
    const agentStats = this.state.agents[agent];
    const oldLevel = agentStats.level.level;

    agentStats.level.experience += amount;
    agentStats.statistics.totalExperience += amount;

    // Check for level up
    let levelUp = false;
    let newLevel = oldLevel;

    while (agentStats.level.experience >= agentStats.level.experienceToNextLevel) {
      const nextLevelData = LEVEL_DATA.find((ld) => ld.level === agentStats.level.level + 1);
      if (nextLevelData) {
        agentStats.level.level++;
        agentStats.level.title = nextLevelData.title;
        agentStats.level.titleJa = nextLevelData.titleJa;
        newLevel = agentStats.level.level;
        levelUp = true;

        // Set next level XP requirement
        const nextNextLevel = LEVEL_DATA.find((ld) => ld.level === agentStats.level.level + 1);
        agentStats.level.experienceToNextLevel = nextNextLevel
          ? nextNextLevel.xpRequired
          : agentStats.level.experienceToNextLevel;

        // Award XP bonus for leveling up
        agentStats.level.experience += XP_VALUES.BADGE_EARNED;
      } else {
        break; // Max level reached
      }
    }

    this.saveState();

    return {
      agent,
      amount,
      reason,
      reasonJa,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
    };
  }

  /**
   * Complete a task and award XP
   */
  public completeTask(
    agent: AgentName,
    taskDuration: number,
    isPerfect: boolean = false,
    isFast: boolean = false
  ): ExperienceGain {
    const agentStats = this.state.agents[agent];

    // Update statistics
    agentStats.statistics.tasksCompleted++;
    agentStats.statistics.totalTaskTime += taskDuration;
    agentStats.statistics.averageTaskTime =
      agentStats.statistics.totalTaskTime / agentStats.statistics.tasksCompleted;
    agentStats.statistics.fastestTask = Math.min(agentStats.statistics.fastestTask, taskDuration);
    agentStats.statistics.lastActive = new Date();

    this.state.globalStats.totalTasks++;

    // Calculate XP
    let xp = XP_VALUES.TASK_COMPLETED;
    let reason = 'Task completed';
    let reasonJa = 'タスク完了';

    if (isPerfect) {
      xp = XP_VALUES.TASK_COMPLETED_PERFECT;
      reason = 'Perfect task completion';
      reasonJa = '完璧なタスク完了';
    } else if (isFast) {
      xp = XP_VALUES.TASK_COMPLETED_FAST;
      reason = 'Fast task completion';
      reasonJa = '高速タスク完了';
    }

    // Check for first task badge
    if (agentStats.statistics.tasksCompleted === 1) {
      this.awardBadge(agent, 'first_task');
    }

    // Check for century club
    if (agentStats.statistics.tasksCompleted === 100) {
      this.awardBadge(agent, 'century_club');
    }

    this.saveState();

    return this.awardExperience(agent, xp, reason, reasonJa);
  }

  /**
   * Award a badge to an agent
   */
  public awardBadge(agent: AgentName, badgeId: BadgeType): Badge | null {
    const agentStats = this.state.agents[agent];

    // Check if already earned
    if (agentStats.badges.some((b) => b.id === badgeId)) {
      return null;
    }

    const badgeDef = BADGE_DEFINITIONS[badgeId];
    const badge: Badge = {
      ...badgeDef,
      earnedAt: new Date(),
    };

    agentStats.badges.push(badge);
    this.state.globalStats.totalBadges++;

    // Create achievement
    const achievement: Achievement = {
      agent,
      badge,
      timestamp: new Date(),
      message: `${agent} earned the "${badge.name}" badge!`,
      messageJa: `${agent}が「${badge.nameJa}」バッジを獲得しました！`,
    };

    this.state.recentAchievements.unshift(achievement);
    if (this.state.recentAchievements.length > 10) {
      this.state.recentAchievements.pop();
    }

    // Award XP for badge
    this.awardExperience(agent, XP_VALUES.BADGE_EARNED, `Earned badge: ${badge.name}`, `バッジ獲得: ${badge.nameJa}`);

    // Check for all-rounder badge
    if (agentStats.badges.length >= 5) {
      this.awardBadge(agent, 'all_rounder');
    }

    this.saveState();

    return badge;
  }

  /**
   * Update badge progress
   */
  public updateBadgeProgress(agent: AgentName, badgeId: BadgeType, current: number): void {
    const agentStats = this.state.agents[agent];
    const badgeDef = BADGE_DEFINITIONS[badgeId];

    // Check if already earned
    if (agentStats.badges.some((b) => b.id === badgeId && b.earnedAt)) {
      return;
    }

    // Check if earned
    if (badgeDef.requirement && current >= badgeDef.requirement) {
      this.awardBadge(agent, badgeId);
    }

    this.saveState();
  }

  /**
   * Get agent stats
   */
  public getAgentStats(agent: AgentName): AgentStats {
    return this.state.agents[agent];
  }

  /**
   * Get leaderboard
   */
  public getLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = Object.values(this.state.agents).map((agent) => ({
      agent: agent.agent,
      level: agent.level.level,
      experience: agent.statistics.totalExperience,
      tasksCompleted: agent.statistics.tasksCompleted,
      badges: agent.badges.length,
      rank: 0,
    }));

    // Sort by level, then by experience
    entries.sort((a, b) => {
      if (a.level !== b.level) {
        return b.level - a.level;
      }
      return b.experience - a.experience;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.state.leaderboard = entries;
    return entries;
  }

  /**
   * Get recent achievements
   */
  public getRecentAchievements(): Achievement[] {
    return this.state.recentAchievements;
  }

  /**
   * Get global stats
   */
  public getGlobalStats() {
    return this.state.globalStats;
  }

  /**
   * Get full state
   */
  public getState(): GamificationState {
    return this.state;
  }
}
