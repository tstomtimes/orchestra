/**
 * Gamification System Types
 *
 * Defines types for agent leveling, badges, achievements,
 * and statistics tracking.
 */

export type AgentName =
  | 'Alex'
  | 'Riley'
  | 'Skye'
  | 'Finn'
  | 'Eden'
  | 'Kai'
  | 'Leo'
  | 'Iris'
  | 'Nova'
  | 'Mina'
  | 'Theo'
  | 'Blake';

export type BadgeType =
  | 'first_task'
  | 'speed_demon'
  | 'perfectionist'
  | 'team_player'
  | 'milestone_master'
  | 'bug_hunter'
  | 'security_sentinel'
  | 'doc_master'
  | 'architect'
  | 'deploy_champion'
  | 'streak_warrior'
  | 'century_club'
  | 'all_rounder';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: BadgeType;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  icon: string;
  rarity: BadgeRarity;
  earnedAt?: Date;
  progress?: number; // 0-100 percentage towards earning
  requirement?: number; // Number needed to earn
}

export interface AgentLevel {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  title: string;
  titleJa: string;
}

export interface AgentStats {
  agent: AgentName;
  level: AgentLevel;
  badges: Badge[];
  statistics: {
    tasksCompleted: number;
    tasksFailed: number;
    totalTaskTime: number; // milliseconds
    averageTaskTime: number; // milliseconds
    fastestTask: number; // milliseconds
    longestStreak: number; // consecutive days
    currentStreak: number; // consecutive days
    lastActive: Date;
    firstSeen: Date;
    totalExperience: number;
  };
  specialties: string[]; // e.g., ["TypeScript", "Security", "Testing"]
}

export interface GamificationState {
  agents: Record<AgentName, AgentStats>;
  globalStats: {
    totalTasks: number;
    totalBadges: number;
    teamLevel: number;
    projectMilestones: number;
  };
  recentAchievements: Achievement[];
  leaderboard: LeaderboardEntry[];
}

export interface Achievement {
  agent: AgentName;
  badge: Badge;
  timestamp: Date;
  message: string;
  messageJa: string;
}

export interface LeaderboardEntry {
  agent: AgentName;
  level: number;
  experience: number;
  tasksCompleted: number;
  badges: number;
  rank: number;
}

export interface ExperienceGain {
  agent: AgentName;
  amount: number;
  reason: string;
  reasonJa: string;
  levelUp?: boolean;
  newLevel?: number;
}

/**
 * Experience point values for different actions
 */
export const XP_VALUES = {
  TASK_COMPLETED: 10,
  TASK_COMPLETED_FAST: 15, // Completed in < 50% of average time
  TASK_COMPLETED_PERFECT: 20, // No revisions needed
  FIRST_TASK_OF_DAY: 5,
  STREAK_BONUS: 10, // Per day in streak
  PARALLEL_EXECUTION: 15, // Completing parallel tasks efficiently
  HELP_OTHER_AGENT: 8,
  MILESTONE_ACHIEVED: 50,
  BADGE_EARNED: 25,
} as const;

/**
 * Level thresholds and titles
 */
export const LEVEL_DATA: Array<{
  level: number;
  xpRequired: number;
  title: string;
  titleJa: string;
}> = [
  { level: 1, xpRequired: 0, title: 'Novice', titleJa: '見習い' },
  { level: 2, xpRequired: 50, title: 'Apprentice', titleJa: '初級' },
  { level: 3, xpRequired: 100, title: 'Competent', titleJa: '中級' },
  { level: 4, xpRequired: 200, title: 'Proficient', titleJa: '上級' },
  { level: 5, xpRequired: 350, title: 'Expert', titleJa: '熟練' },
  { level: 6, xpRequired: 550, title: 'Master', titleJa: '達人' },
  { level: 7, xpRequired: 800, title: 'Grandmaster', titleJa: '名人' },
  { level: 8, xpRequired: 1100, title: 'Legend', titleJa: '伝説' },
  { level: 9, xpRequired: 1500, title: 'Mythic', titleJa: '神話' },
  { level: 10, xpRequired: 2000, title: 'Transcendent', titleJa: '超越者' },
];

/**
 * Badge definitions
 */
export const BADGE_DEFINITIONS: Record<BadgeType, Omit<Badge, 'earnedAt' | 'progress'>> = {
  first_task: {
    id: 'first_task',
    name: 'First Steps',
    nameJa: '第一歩',
    description: 'Complete your first task',
    descriptionJa: '最初のタスクを完了',
    icon: '🎯',
    rarity: 'common',
    requirement: 1,
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    nameJa: '電光石火',
    description: 'Complete 10 tasks in under 50% of average time',
    descriptionJa: '平均時間の50%以下で10タスクを完了',
    icon: '⚡',
    rarity: 'rare',
    requirement: 10,
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    nameJa: '完璧主義者',
    description: 'Complete 20 tasks without any revisions',
    descriptionJa: '修正なしで20タスクを完了',
    icon: '💎',
    rarity: 'epic',
    requirement: 20,
  },
  team_player: {
    id: 'team_player',
    name: 'Team Player',
    nameJa: 'チームプレイヤー',
    description: 'Help other agents 25 times',
    descriptionJa: '他のエージェントを25回サポート',
    icon: '🤝',
    rarity: 'rare',
    requirement: 25,
  },
  milestone_master: {
    id: 'milestone_master',
    name: 'Milestone Master',
    nameJa: 'マイルストーンマスター',
    description: 'Contribute to 10 project milestones',
    descriptionJa: '10のプロジェクトマイルストーンに貢献',
    icon: '🏆',
    rarity: 'epic',
    requirement: 10,
  },
  bug_hunter: {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    nameJa: 'バグハンター',
    description: 'Find and fix 50 bugs (Finn)',
    descriptionJa: '50のバグを発見・修正（Finn）',
    icon: '🐛',
    rarity: 'rare',
    requirement: 50,
  },
  security_sentinel: {
    id: 'security_sentinel',
    name: 'Security Sentinel',
    nameJa: 'セキュリティ番人',
    description: 'Pass 100 security checks (Iris)',
    descriptionJa: '100のセキュリティチェックをクリア（Iris）',
    icon: '🛡️',
    rarity: 'epic',
    requirement: 100,
  },
  doc_master: {
    id: 'doc_master',
    name: 'Documentation Master',
    nameJa: 'ドキュメント達人',
    description: 'Create 30 comprehensive docs (Eden)',
    descriptionJa: '30の包括的なドキュメントを作成（Eden）',
    icon: '📚',
    rarity: 'rare',
    requirement: 30,
  },
  architect: {
    id: 'architect',
    name: 'Master Architect',
    nameJa: 'マスターアーキテクト',
    description: 'Design 15 system architectures (Kai)',
    descriptionJa: '15のシステムアーキテクチャを設計（Kai）',
    icon: '🏗️',
    rarity: 'epic',
    requirement: 15,
  },
  deploy_champion: {
    id: 'deploy_champion',
    name: 'Deploy Champion',
    nameJa: 'デプロイチャンピオン',
    description: 'Successfully deploy 50 releases (Blake)',
    descriptionJa: '50回のリリースに成功（Blake）',
    icon: '🚀',
    rarity: 'rare',
    requirement: 50,
  },
  streak_warrior: {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    nameJa: '連続記録の戦士',
    description: 'Maintain a 30-day active streak',
    descriptionJa: '30日連続でアクティブ',
    icon: '🔥',
    rarity: 'legendary',
    requirement: 30,
  },
  century_club: {
    id: 'century_club',
    name: 'Century Club',
    nameJa: '百人力',
    description: 'Complete 100 tasks',
    descriptionJa: '100タスクを完了',
    icon: '💯',
    rarity: 'epic',
    requirement: 100,
  },
  all_rounder: {
    id: 'all_rounder',
    name: 'All-Rounder',
    nameJa: 'オールラウンダー',
    description: 'Earn at least 5 badges',
    descriptionJa: '5つ以上のバッジを獲得',
    icon: '⭐',
    rarity: 'legendary',
    requirement: 5,
  },
};
