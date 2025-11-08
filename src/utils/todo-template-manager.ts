/**
 * TODO Template Manager
 *
 * Provides pre-built TODO templates for common tasks:
 * - Authentication system
 * - API endpoint creation
 * - Database migration
 * - Feature implementation
 * - Bug fix workflow
 * - Performance optimization
 * - Security audit
 * - Documentation update
 */

import { Task, TaskStatus, TaskMetadata } from '../types/progress-tracker.types';
import { AgentName } from '../types/gamification.types';

interface TemplateTask {
  agent: AgentName;
  title: string;
  titleJa: string;
  description: string;
  descriptionJa: string;
  estimatedMinutes?: number;
  dependencies?: number[]; // Indices of dependent tasks in template
  tags?: string[];
}

interface TodoTemplate {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  category: TemplateCategory;
  tasks: TemplateTask[];
  variables?: string[]; // Variables that can be customized (e.g., {featureName})
}

type TemplateCategory =
  | 'feature'
  | 'infrastructure'
  | 'maintenance'
  | 'bugfix'
  | 'security'
  | 'documentation';

const TEMPLATES: TodoTemplate[] = [
  {
    id: 'auth-system',
    name: 'Authentication System',
    nameJa: '認証システム',
    description: 'Complete authentication system with user management',
    descriptionJa: 'ユーザー管理を含む完全な認証システム',
    category: 'feature',
    variables: ['authMethod'],
    tasks: [
      {
        agent: 'Riley',
        title: 'Clarify authentication requirements',
        titleJa: '認証要件を明確化する',
        description: 'Define auth method, session management, and security requirements',
        descriptionJa: '認証方式、セッション管理、セキュリティ要件を定義',
        estimatedMinutes: 30,
        tags: ['requirements', 'planning'],
      },
      {
        agent: 'Kai',
        title: 'Design authentication architecture',
        titleJa: '認証アーキテクチャを設計する',
        description: 'Create ADR for auth system design and token flow',
        descriptionJa: '認証システム設計とトークンフローのADRを作成',
        estimatedMinutes: 60,
        dependencies: [0],
        tags: ['architecture', 'design'],
      },
      {
        agent: 'Leo',
        title: 'Design user database schema',
        titleJa: 'ユーザーデータベーススキーマを設計する',
        description: 'Create user tables, indexes, and RLS policies',
        descriptionJa: 'ユーザーテーブル、インデックス、RLSポリシーを作成',
        estimatedMinutes: 45,
        dependencies: [1],
        tags: ['database', 'schema'],
      },
      {
        agent: 'Skye',
        title: 'Implement backend authentication API',
        titleJa: 'バックエンド認証APIを実装する',
        description: 'Create login, register, logout, and refresh endpoints',
        descriptionJa: 'ログイン、登録、ログアウト、リフレッシュエンドポイントを作成',
        estimatedMinutes: 120,
        dependencies: [2],
        tags: ['implementation', 'backend'],
      },
      {
        agent: 'Mina',
        title: 'Integrate authentication UI',
        titleJa: '認証UIを統合する',
        description: 'Create login/register forms and handle auth state',
        descriptionJa: 'ログイン/登録フォームを作成、認証状態を管理',
        estimatedMinutes: 90,
        dependencies: [3],
        tags: ['frontend', 'ui'],
      },
      {
        agent: 'Finn',
        title: 'Write authentication tests',
        titleJa: '認証テストを作成する',
        description: 'Unit and integration tests for auth flow',
        descriptionJa: '認証フローのユニットテストと統合テスト',
        estimatedMinutes: 60,
        dependencies: [4],
        tags: ['testing', 'quality'],
      },
      {
        agent: 'Iris',
        title: 'Security audit of auth system',
        titleJa: '認証システムのセキュリティ監査',
        description: 'Check for vulnerabilities, validate token security',
        descriptionJa: '脆弱性チェック、トークンセキュリティ検証',
        estimatedMinutes: 45,
        dependencies: [5],
        tags: ['security', 'audit'],
      },
      {
        agent: 'Eden',
        title: 'Document authentication system',
        titleJa: '認証システムのドキュメント作成',
        description: 'API docs, user guide, and security best practices',
        descriptionJa: 'APIドキュメント、ユーザーガイド、セキュリティベストプラクティス',
        estimatedMinutes: 60,
        dependencies: [6],
        tags: ['documentation'],
      },
      {
        agent: 'Blake',
        title: 'Deploy authentication system',
        titleJa: '認証システムをデプロイする',
        description: 'Production deployment with rollback plan',
        descriptionJa: 'ロールバックプラン付きで本番デプロイ',
        estimatedMinutes: 30,
        dependencies: [7],
        tags: ['deployment', 'devops'],
      },
    ],
  },
  {
    id: 'api-endpoint',
    name: 'New API Endpoint',
    nameJa: '新規APIエンドポイント',
    description: 'Create a new RESTful API endpoint',
    descriptionJa: '新しいRESTful APIエンドポイントを作成',
    category: 'feature',
    variables: ['endpointName', 'resourceType'],
    tasks: [
      {
        agent: 'Riley',
        title: 'Define API endpoint requirements',
        titleJa: 'APIエンドポイントの要件を定義する',
        description: 'Specify request/response format, validation rules',
        descriptionJa: 'リクエスト/レスポンス形式、検証ルールを指定',
        estimatedMinutes: 20,
        tags: ['requirements', 'api'],
      },
      {
        agent: 'Leo',
        title: 'Design database changes',
        titleJa: 'データベースの変更を設計する',
        description: 'Create or update tables for new endpoint',
        descriptionJa: '新しいエンドポイント用のテーブル作成/更新',
        estimatedMinutes: 30,
        dependencies: [0],
        tags: ['database'],
      },
      {
        agent: 'Skye',
        title: 'Implement API endpoint',
        titleJa: 'APIエンドポイントを実装する',
        description: 'Create controller, service, and route handlers',
        descriptionJa: 'コントローラー、サービス、ルートハンドラーを作成',
        estimatedMinutes: 60,
        dependencies: [1],
        tags: ['implementation', 'backend'],
      },
      {
        agent: 'Finn',
        title: 'Write API tests',
        titleJa: 'APIテストを作成する',
        description: 'Integration tests for all endpoint scenarios',
        descriptionJa: 'すべてのエンドポイントシナリオの統合テスト',
        estimatedMinutes: 45,
        dependencies: [2],
        tags: ['testing'],
      },
      {
        agent: 'Eden',
        title: 'Document API endpoint',
        titleJa: 'APIエンドポイントのドキュメント作成',
        description: 'OpenAPI spec and usage examples',
        descriptionJa: 'OpenAPI仕様と使用例',
        estimatedMinutes: 30,
        dependencies: [3],
        tags: ['documentation', 'api'],
      },
    ],
  },
  {
    id: 'database-migration',
    name: 'Database Migration',
    nameJa: 'データベースマイグレーション',
    description: 'Safely migrate database schema',
    descriptionJa: 'データベーススキーマを安全にマイグレーション',
    category: 'infrastructure',
    variables: ['migrationType'],
    tasks: [
      {
        agent: 'Riley',
        title: 'Analyze migration requirements',
        titleJa: 'マイグレーション要件を分析する',
        description: 'Assess impact, data volume, and downtime needs',
        descriptionJa: '影響、データ量、ダウンタイムのニーズを評価',
        estimatedMinutes: 30,
        tags: ['analysis', 'planning'],
      },
      {
        agent: 'Kai',
        title: 'Design migration strategy',
        titleJa: 'マイグレーション戦略を設計する',
        description: 'Create rollback plan and data integrity checks',
        descriptionJa: 'ロールバックプランとデータ整合性チェックを作成',
        estimatedMinutes: 45,
        dependencies: [0],
        tags: ['strategy', 'planning'],
      },
      {
        agent: 'Leo',
        title: 'Write migration scripts',
        titleJa: 'マイグレーションスクリプトを作成する',
        description: 'Create up/down migrations with data preservation',
        descriptionJa: 'データ保存を含むアップ/ダウンマイグレーションを作成',
        estimatedMinutes: 90,
        dependencies: [1],
        tags: ['database', 'migration'],
      },
      {
        agent: 'Finn',
        title: 'Test migration in staging',
        titleJa: 'ステージング環境でマイグレーションをテストする',
        description: 'Verify migration and rollback procedures',
        descriptionJa: 'マイグレーションとロールバック手順を検証',
        estimatedMinutes: 60,
        dependencies: [2],
        tags: ['testing', 'validation'],
      },
      {
        agent: 'Theo',
        title: 'Set up migration monitoring',
        titleJa: 'マイグレーションモニタリングを設定する',
        description: 'Monitor performance and data integrity during migration',
        descriptionJa: 'マイグレーション中のパフォーマンスとデータ整合性を監視',
        estimatedMinutes: 30,
        dependencies: [3],
        tags: ['monitoring'],
      },
      {
        agent: 'Blake',
        title: 'Execute production migration',
        titleJa: '本番マイグレーションを実行する',
        description: 'Run migration with monitoring and rollback readiness',
        descriptionJa: 'モニタリングとロールバック準備を含むマイグレーション実行',
        estimatedMinutes: 45,
        dependencies: [4],
        tags: ['deployment', 'migration'],
      },
    ],
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix Workflow',
    nameJa: 'バグ修正ワークフロー',
    description: 'Systematic bug fixing process',
    descriptionJa: '体系的なバグ修正プロセス',
    category: 'bugfix',
    variables: ['bugDescription'],
    tasks: [
      {
        agent: 'Riley',
        title: 'Reproduce and analyze bug',
        titleJa: 'バグを再現して分析する',
        description: 'Document reproduction steps and root cause',
        descriptionJa: '再現手順と根本原因をドキュメント化',
        estimatedMinutes: 30,
        tags: ['analysis', 'debugging'],
      },
      {
        agent: 'Skye',
        title: 'Implement bug fix',
        titleJa: 'バグ修正を実装する',
        description: 'Fix the issue with minimal code changes',
        descriptionJa: '最小限のコード変更で問題を修正',
        estimatedMinutes: 60,
        dependencies: [0],
        tags: ['implementation', 'bugfix'],
      },
      {
        agent: 'Finn',
        title: 'Write regression tests',
        titleJa: 'リグレッションテストを作成する',
        description: 'Ensure bug doesn\'t reoccur',
        descriptionJa: 'バグが再発しないことを保証',
        estimatedMinutes: 30,
        dependencies: [1],
        tags: ['testing', 'regression'],
      },
      {
        agent: 'Iris',
        title: 'Review fix for side effects',
        titleJa: '副作用がないか修正をレビューする',
        description: 'Check for unintended consequences',
        descriptionJa: '意図しない結果がないかチェック',
        estimatedMinutes: 20,
        dependencies: [2],
        tags: ['review', 'quality'],
      },
      {
        agent: 'Blake',
        title: 'Deploy bug fix',
        titleJa: 'バグ修正をデプロイする',
        description: 'Hotfix deployment if critical',
        descriptionJa: 'クリティカルな場合はホットフィックスデプロイ',
        estimatedMinutes: 15,
        dependencies: [3],
        tags: ['deployment'],
      },
    ],
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    nameJa: 'パフォーマンス最適化',
    description: 'Optimize system performance',
    descriptionJa: 'システムパフォーマンスの最適化',
    category: 'maintenance',
    variables: ['targetArea'],
    tasks: [
      {
        agent: 'Theo',
        title: 'Identify performance bottlenecks',
        titleJa: 'パフォーマンスのボトルネックを特定する',
        description: 'Profile and analyze slow operations',
        descriptionJa: '低速な操作をプロファイリングして分析',
        estimatedMinutes: 45,
        tags: ['analysis', 'profiling'],
      },
      {
        agent: 'Kai',
        title: 'Design optimization strategy',
        titleJa: '最適化戦略を設計する',
        description: 'Plan caching, indexing, or architectural changes',
        descriptionJa: 'キャッシング、インデックス、アーキテクチャ変更を計画',
        estimatedMinutes: 60,
        dependencies: [0],
        tags: ['strategy', 'architecture'],
      },
      {
        agent: 'Leo',
        title: 'Optimize database queries',
        titleJa: 'データベースクエリを最適化する',
        description: 'Add indexes, optimize queries, tune configuration',
        descriptionJa: 'インデックス追加、クエリ最適化、設定チューニング',
        estimatedMinutes: 90,
        dependencies: [1],
        tags: ['database', 'optimization'],
      },
      {
        agent: 'Skye',
        title: 'Implement code optimizations',
        titleJa: 'コード最適化を実装する',
        description: 'Optimize algorithms and add caching',
        descriptionJa: 'アルゴリズム最適化とキャッシング追加',
        estimatedMinutes: 120,
        dependencies: [1],
        tags: ['implementation', 'optimization'],
      },
      {
        agent: 'Finn',
        title: 'Benchmark performance improvements',
        titleJa: 'パフォーマンス改善をベンチマークする',
        description: 'Measure before/after performance metrics',
        descriptionJa: '改善前後のパフォーマンス指標を測定',
        estimatedMinutes: 45,
        dependencies: [2, 3],
        tags: ['testing', 'benchmarking'],
      },
      {
        agent: 'Theo',
        title: 'Monitor post-optimization',
        titleJa: '最適化後をモニタリングする',
        description: 'Track metrics in production',
        descriptionJa: '本番環境での指標を追跡',
        estimatedMinutes: 30,
        dependencies: [4],
        tags: ['monitoring'],
      },
    ],
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    nameJa: 'セキュリティ監査',
    description: 'Comprehensive security review',
    descriptionJa: '包括的なセキュリティレビュー',
    category: 'security',
    tasks: [
      {
        agent: 'Iris',
        title: 'Scan for vulnerabilities',
        titleJa: '脆弱性をスキャンする',
        description: 'Run automated security scanners',
        descriptionJa: '自動セキュリティスキャナーを実行',
        estimatedMinutes: 30,
        tags: ['security', 'scanning'],
      },
      {
        agent: 'Iris',
        title: 'Review authentication/authorization',
        titleJa: '認証/認可をレビューする',
        description: 'Check access controls and permissions',
        descriptionJa: 'アクセスコントロールと権限をチェック',
        estimatedMinutes: 60,
        dependencies: [0],
        tags: ['security', 'auth'],
      },
      {
        agent: 'Iris',
        title: 'Audit data protection',
        titleJa: 'データ保護を監査する',
        description: 'Verify encryption, backups, and privacy compliance',
        descriptionJa: '暗号化、バックアップ、プライバシー準拠を検証',
        estimatedMinutes: 45,
        dependencies: [0],
        tags: ['security', 'data'],
      },
      {
        agent: 'Skye',
        title: 'Fix security issues',
        titleJa: 'セキュリティ問題を修正する',
        description: 'Implement fixes for identified vulnerabilities',
        descriptionJa: '特定された脆弱性の修正を実装',
        estimatedMinutes: 120,
        dependencies: [1, 2],
        tags: ['implementation', 'security'],
      },
      {
        agent: 'Finn',
        title: 'Test security fixes',
        titleJa: 'セキュリティ修正をテストする',
        description: 'Verify all vulnerabilities are resolved',
        descriptionJa: 'すべての脆弱性が解決されたことを検証',
        estimatedMinutes: 60,
        dependencies: [3],
        tags: ['testing', 'security'],
      },
      {
        agent: 'Eden',
        title: 'Document security measures',
        titleJa: 'セキュリティ対策をドキュメント化する',
        description: 'Create security documentation and guidelines',
        descriptionJa: 'セキュリティドキュメントとガイドラインを作成',
        estimatedMinutes: 45,
        dependencies: [4],
        tags: ['documentation', 'security'],
      },
    ],
  },
  {
    id: 'feature-implementation',
    name: 'Feature Implementation',
    nameJa: '機能実装',
    description: 'Full feature development workflow',
    descriptionJa: '完全な機能開発ワークフロー',
    category: 'feature',
    variables: ['featureName'],
    tasks: [
      {
        agent: 'Riley',
        title: 'Gather and clarify requirements',
        titleJa: '要件を収集して明確化する',
        description: 'Define user stories and acceptance criteria',
        descriptionJa: 'ユーザーストーリーと受け入れ基準を定義',
        estimatedMinutes: 45,
        tags: ['requirements'],
      },
      {
        agent: 'Kai',
        title: 'Design feature architecture',
        titleJa: '機能のアーキテクチャを設計する',
        description: 'Create technical design and ADR',
        descriptionJa: '技術設計とADRを作成',
        estimatedMinutes: 90,
        dependencies: [0],
        tags: ['architecture', 'design'],
      },
      {
        agent: 'Nova',
        title: 'Design user interface',
        titleJa: 'ユーザーインターフェースを設計する',
        description: 'Create wireframes and UI mockups',
        descriptionJa: 'ワイヤーフレームとUIモックアップを作成',
        estimatedMinutes: 60,
        dependencies: [1],
        tags: ['ui', 'design'],
      },
      {
        agent: 'Leo',
        title: 'Design database schema',
        titleJa: 'データベーススキーマを設計する',
        description: 'Create tables and relationships',
        descriptionJa: 'テーブルとリレーションシップを作成',
        estimatedMinutes: 45,
        dependencies: [1],
        tags: ['database'],
      },
      {
        agent: 'Skye',
        title: 'Implement backend logic',
        titleJa: 'バックエンドロジックを実装する',
        description: 'Create APIs and business logic',
        descriptionJa: 'APIとビジネスロジックを作成',
        estimatedMinutes: 180,
        dependencies: [3],
        tags: ['implementation', 'backend'],
      },
      {
        agent: 'Nova',
        title: 'Implement frontend UI',
        titleJa: 'フロントエンドUIを実装する',
        description: 'Build user interface components',
        descriptionJa: 'ユーザーインターフェースコンポーネントを構築',
        estimatedMinutes: 150,
        dependencies: [2, 4],
        tags: ['implementation', 'frontend'],
      },
      {
        agent: 'Finn',
        title: 'Write comprehensive tests',
        titleJa: '包括的なテストを作成する',
        description: 'Unit, integration, and E2E tests',
        descriptionJa: 'ユニット、統合、E2Eテスト',
        estimatedMinutes: 120,
        dependencies: [5],
        tags: ['testing'],
      },
      {
        agent: 'Eden',
        title: 'Create feature documentation',
        titleJa: '機能ドキュメントを作成する',
        description: 'User guide and technical documentation',
        descriptionJa: 'ユーザーガイドと技術ドキュメント',
        estimatedMinutes: 60,
        dependencies: [6],
        tags: ['documentation'],
      },
      {
        agent: 'Blake',
        title: 'Deploy feature to production',
        titleJa: '機能を本番環境にデプロイする',
        description: 'Feature flag rollout and monitoring',
        descriptionJa: 'フィーチャーフラグロールアウトとモニタリング',
        estimatedMinutes: 45,
        dependencies: [7],
        tags: ['deployment'],
      },
    ],
  },
];

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  MAGENTA: '\x1b[35m',
  GRAY: '\x1b[90m',
};

export class TodoTemplateManager {
  private language: string;

  constructor(language: string = 'en') {
    this.language = language;
  }

  /**
   * Get all available templates
   */
  public getTemplates(): TodoTemplate[] {
    return TEMPLATES;
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): TodoTemplate | null {
    return TEMPLATES.find((t) => t.id === id) || null;
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: TemplateCategory): TodoTemplate[] {
    return TEMPLATES.filter((t) => t.category === category);
  }

  /**
   * Generate tasks from template
   */
  public generateFromTemplate(
    templateId: string,
    variables?: Record<string, string>
  ): Task[] {
    const template = this.getTemplate(templateId);
    if (!template) return [];

    const tasks: Task[] = [];
    const taskIdMap = new Map<number, string>();

    template.tasks.forEach((templateTask, index) => {
      const taskId = `${templateId}-${index}-${Date.now()}`;
      taskIdMap.set(index, taskId);

      let content = `[${templateTask.agent}] ${
        this.language === 'ja' ? templateTask.titleJa : templateTask.title
      }`;
      let activeForm = this.language === 'ja' ? templateTask.titleJa : templateTask.title;

      // Replace variables if provided
      if (variables && template.variables) {
        template.variables.forEach((varName) => {
          const varValue = variables[varName] || `{${varName}}`;
          content = content.replace(new RegExp(`{${varName}}`, 'g'), varValue);
          activeForm = activeForm.replace(new RegExp(`{${varName}}`, 'g'), varValue);
        });
      }

      const metadata: TaskMetadata = {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: templateTask.estimatedMinutes
          ? templateTask.estimatedMinutes * 60 * 1000
          : undefined,
        tags: templateTask.tags,
        notes: this.language === 'ja'
          ? templateTask.descriptionJa
          : templateTask.description,
        dependencies: [],
      };

      // Map dependencies
      if (templateTask.dependencies) {
        metadata.dependencies = templateTask.dependencies
          .map((depIndex) => taskIdMap.get(depIndex))
          .filter((id): id is string => id !== undefined);
      }

      tasks.push({
        id: taskId,
        content,
        activeForm,
        status: TaskStatus.PENDING,
        metadata,
      });
    });

    return tasks;
  }

  /**
   * Render template list
   */
  public renderTemplateList(): string {
    const lines: string[] = [];

    const title = this.language === 'ja' ? '📋 TODOテンプレート' : '📋 TODO Templates';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    // Group by category
    const categories: TemplateCategory[] = [
      'feature',
      'infrastructure',
      'maintenance',
      'bugfix',
      'security',
      'documentation',
    ];

    const categoryNames = {
      feature: { en: 'Features', ja: '機能' },
      infrastructure: { en: 'Infrastructure', ja: 'インフラ' },
      maintenance: { en: 'Maintenance', ja: 'メンテナンス' },
      bugfix: { en: 'Bug Fixes', ja: 'バグ修正' },
      security: { en: 'Security', ja: 'セキュリティ' },
      documentation: { en: 'Documentation', ja: 'ドキュメント' },
    };

    categories.forEach((category) => {
      const categoryTemplates = this.getTemplatesByCategory(category);
      if (categoryTemplates.length === 0) return;

      const categoryName =
        this.language === 'ja' ? categoryNames[category].ja : categoryNames[category].en;

      lines.push(`${COLORS.BRIGHT}${categoryName}${COLORS.RESET}`);
      lines.push('');

      categoryTemplates.forEach((template) => {
        const name = this.language === 'ja' ? template.nameJa : template.name;
        const desc = this.language === 'ja' ? template.descriptionJa : template.description;

        lines.push(`  ${COLORS.CYAN}${template.id}${COLORS.RESET} - ${name}`);
        lines.push(`  ${COLORS.GRAY}${desc}${COLORS.RESET}`);
        lines.push(`  ${COLORS.GRAY}${template.tasks.length} tasks${COLORS.RESET}`);
        lines.push('');
      });
    });

    lines.push('━'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Render template details
   */
  public renderTemplateDetails(templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      return this.language === 'ja'
        ? 'テンプレートが見つかりません'
        : 'Template not found';
    }

    const lines: string[] = [];

    const name = this.language === 'ja' ? template.nameJa : template.name;
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${name}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    const desc = this.language === 'ja' ? template.descriptionJa : template.description;
    lines.push(`${desc}`);
    lines.push('');

    // Variables
    if (template.variables && template.variables.length > 0) {
      const varsLabel = this.language === 'ja' ? '変数' : 'Variables';
      lines.push(`${COLORS.BRIGHT}${varsLabel}:${COLORS.RESET}`);
      template.variables.forEach((varName) => {
        lines.push(`  {${varName}}`);
      });
      lines.push('');
    }

    // Tasks
    const tasksLabel = this.language === 'ja' ? 'タスク' : 'Tasks';
    lines.push(`${COLORS.BRIGHT}${tasksLabel} (${template.tasks.length}):${COLORS.RESET}`);
    lines.push('');

    template.tasks.forEach((task, index) => {
      const title = this.language === 'ja' ? task.titleJa : task.title;
      const desc = this.language === 'ja' ? task.descriptionJa : task.description;

      const emoji = this.getAgentEmoji(task.agent);
      lines.push(`  ${index + 1}. ${emoji} ${COLORS.BRIGHT}${task.agent}${COLORS.RESET} - ${title}`);
      lines.push(`     ${COLORS.GRAY}${desc}${COLORS.RESET}`);

      if (task.estimatedMinutes) {
        lines.push(`     ${COLORS.GRAY}⏱️  ~${task.estimatedMinutes}min${COLORS.RESET}`);
      }

      if (task.dependencies && task.dependencies.length > 0) {
        const deps = task.dependencies.map((d) => d + 1).join(', ');
        const depLabel = this.language === 'ja' ? '依存' : 'Depends on';
        lines.push(`     ${COLORS.GRAY}${depLabel}: #${deps}${COLORS.RESET}`);
      }

      lines.push('');
    });

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
