/**
 * Agent Chat Logger
 *
 * Creates conversational progress updates between agents:
 * - Task start announcements
 * - Task completion celebrations
 * - Handoff messages when passing tasks
 * - Progress check-ins
 * - Team morale messages
 */

import { Task, TaskStatus } from '../types/progress-tracker.types';
import { AgentName } from '../types/gamification.types';

interface ChatMessage {
  timestamp: number;
  from: AgentName;
  to?: AgentName | 'all';
  message: string;
  messageJa: string;
  type: 'start' | 'complete' | 'handoff' | 'checkin' | 'celebration' | 'help';
  taskId?: string;
  emoji: string;
}

interface AgentPersonality {
  emoji: string;
  name: string;
  traits: string[];
  startPhrases: string[];
  startPhrasesJa: string[];
  completePhrases: string[];
  completePhrasesJa: string[];
  handoffPhrases: string[];
  handoffPhrasesJa: string[];
  celebrationPhrases: string[];
  celebrationPhrasesJa: string[];
}

const AGENT_PERSONALITIES: Record<AgentName, AgentPersonality> = {
  Alex: {
    emoji: '🙂',
    name: 'Alex',
    traits: ['leader', 'organized', 'supportive'],
    startPhrases: [
      'Alright team, let\'s tackle this together!',
      'I\'ll coordinate this one. Everyone ready?',
      'Time to organize and execute!',
    ],
    startPhrasesJa: [
      'よし、みんなで取り組もう！',
      'これは僕が調整するよ。準備はいい？',
      '整理して実行していこう！',
    ],
    completePhrases: [
      'Task coordinated successfully! Great teamwork!',
      'All organized and done! Next steps are clear.',
      'Coordination complete! Everyone knows what to do.',
    ],
    completePhrasesJa: [
      'タスクの調整が完了！素晴らしいチームワークだ！',
      '整理完了！次のステップは明確だよ。',
      '調整完了！みんな何をすべきか分かったね。',
    ],
    handoffPhrases: [
      'Passing this to {to}. You got this!',
      '{to}, you\'re up! I\'ve set everything up for you.',
      'Handoff to {to}. All yours now!',
    ],
    handoffPhrasesJa: [
      'これを{to}に渡すよ。頑張って！',
      '{to}、君の番だ！全部準備しておいたよ。',
      '{to}に引き継ぎ。よろしく！',
    ],
    celebrationPhrases: [
      'Awesome work, {agent}! The team appreciates you!',
      'Great job {agent}! That\'s exactly what we needed.',
      'Perfect execution, {agent}! Keep it up!',
    ],
    celebrationPhrasesJa: [
      '素晴らしい仕事だよ、{agent}！チームが感謝してる！',
      'いい仕事だ、{agent}！まさに必要だったことだよ。',
      '完璧な実行だ、{agent}！その調子で！',
    ],
  },
  Riley: {
    emoji: '🧐',
    name: 'Riley',
    traits: ['analytical', 'curious', 'detail-oriented'],
    startPhrases: [
      'Let me analyze the requirements here...',
      'Interesting! I\'ll dive deep into this.',
      'Time to clarify all the details!',
    ],
    startPhrasesJa: [
      '要件を分析してみよう...',
      '面白い！深く掘り下げてみるよ。',
      '詳細を明確にしていくぞ！',
    ],
    completePhrases: [
      'Analysis complete! All requirements are crystal clear now.',
      'I\'ve documented everything. No ambiguity left!',
      'Requirements fully clarified and ready for implementation.',
    ],
    completePhrasesJa: [
      '分析完了！すべての要件が明確になったよ。',
      '全部ドキュメント化したよ。曖昧さは残してない！',
      '要件を完全に明確化して、実装準備OK。',
    ],
    handoffPhrases: [
      'Passing to {to} with full clarity on requirements.',
      '{to}, I\'ve analyzed everything. Here are the details.',
      'Handing off to {to}. All questions answered!',
    ],
    handoffPhrasesJa: [
      '要件を完全に明確にして{to}に引き継ぎ。',
      '{to}、全部分析したよ。詳細はこちら。',
      '{to}に引き継ぎ。全ての質問に答えたよ！',
    ],
    celebrationPhrases: [
      'Excellent analysis, {agent}! Very thorough.',
      'Great attention to detail, {agent}!',
      'Your clarity made this so much easier, {agent}!',
    ],
    celebrationPhrasesJa: [
      '素晴らしい分析だ、{agent}！とても徹底的だね。',
      '細部への注意が素晴らしい、{agent}！',
      '君の明確さがとても助かったよ、{agent}！',
    ],
  },
  Skye: {
    emoji: '😐',
    name: 'Skye',
    traits: ['pragmatic', 'efficient', 'clean-code'],
    startPhrases: [
      'Time to write some clean code.',
      'Let\'s implement this properly.',
      'Starting implementation. Keep it simple.',
    ],
    startPhrasesJa: [
      'クリーンなコードを書く時間だ。',
      'これを適切に実装していこう。',
      '実装開始。シンプルに保つよ。',
    ],
    completePhrases: [
      'Implementation done. Code is clean and tested.',
      'Finished. No technical debt added.',
      'Complete. Everything follows best practices.',
    ],
    completePhrasesJa: [
      '実装完了。コードはクリーンでテスト済み。',
      '終わった。技術的負債は追加してない。',
      '完了。すべてベストプラクティスに従ってる。',
    ],
    handoffPhrases: [
      '{to}, code is ready for you.',
      'Passing clean code to {to}.',
      '{to}, implementation complete. Your turn.',
    ],
    handoffPhrasesJa: [
      '{to}、コードの準備ができたよ。',
      'クリーンなコードを{to}に渡す。',
      '{to}、実装完了。君の番だ。',
    ],
    celebrationPhrases: [
      'Solid work, {agent}.',
      'Clean implementation, {agent}.',
      'Well done, {agent}. No issues.',
    ],
    celebrationPhrasesJa: [
      'しっかりした仕事だ、{agent}。',
      'クリーンな実装だね、{agent}。',
      'よくやった、{agent}。問題なし。',
    ],
  },
  Finn: {
    emoji: '😤',
    name: 'Finn',
    traits: ['meticulous', 'perfectionist', 'quality-focused'],
    startPhrases: [
      'Time to find ALL the bugs!',
      'Let\'s make sure this is bulletproof!',
      'Testing mode: ACTIVATED!',
    ],
    startPhrasesJa: [
      'すべてのバグを見つける時間だ！',
      'これを完璧にしよう！',
      'テストモード：起動！',
    ],
    completePhrases: [
      'All tests passing! Quality assured!',
      'Bugs eliminated! This is solid!',
      'Testing complete! Ready for production!',
    ],
    completePhrasesJa: [
      'すべてのテストがパス！品質保証済み！',
      'バグを全て排除！これは堅牢だ！',
      'テスト完了！本番環境対応OK！',
    ],
    handoffPhrases: [
      '{to}, it\'s fully tested and ready!',
      'Passing to {to} with full test coverage!',
      '{to}, quality guaranteed! All yours!',
    ],
    handoffPhrasesJa: [
      '{to}、完全にテスト済みで準備OK！',
      'フルカバレッジで{to}に引き継ぎ！',
      '{to}、品質保証済み！よろしく！',
    ],
    celebrationPhrases: [
      'Perfect quality, {agent}! No bugs!',
      'Flawless work, {agent}!',
      'You\'re a quality champion, {agent}!',
    ],
    celebrationPhrasesJa: [
      '完璧な品質だ、{agent}！バグなし！',
      '完璧な仕事だよ、{agent}！',
      '君は品質チャンピオンだ、{agent}！',
    ],
  },
  Eden: {
    emoji: '🤓',
    name: 'Eden',
    traits: ['articulate', 'helpful', 'teacher'],
    startPhrases: [
      'Let me document this clearly!',
      'Time to write comprehensive docs!',
      'Making this easy to understand for everyone!',
    ],
    startPhrasesJa: [
      'これを明確にドキュメント化しよう！',
      '包括的なドキュメントを書く時間だ！',
      'みんなが理解しやすいようにするよ！',
    ],
    completePhrases: [
      'Documentation complete! Everything is explained!',
      'Docs are ready! Anyone can understand this now!',
      'All documented with examples and diagrams!',
    ],
    completePhrasesJa: [
      'ドキュメント完了！すべてが説明されてる！',
      'ドキュメントの準備OK！誰でも理解できるよ！',
      '例と図を使って全てドキュメント化したよ！',
    ],
    handoffPhrases: [
      '{to}, I\'ve documented everything for you!',
      'Passing to {to} with full documentation!',
      '{to}, check the docs I wrote. Should be clear!',
    ],
    handoffPhrasesJa: [
      '{to}、全部ドキュメント化しておいたよ！',
      '完全なドキュメント付きで{to}に引き継ぎ！',
      '{to}、書いたドキュメント見てね。明確なはず！',
    ],
    celebrationPhrases: [
      'Great work, {agent}! Love the clarity!',
      'Excellent documentation, {agent}!',
      'You made it so easy to understand, {agent}!',
    ],
    celebrationPhrasesJa: [
      '素晴らしい仕事だ、{agent}！明確さが最高！',
      '素晴らしいドキュメント、{agent}！',
      '理解しやすくしてくれてありがとう、{agent}！',
    ],
  },
  Kai: {
    emoji: '🤔',
    name: 'Kai',
    traits: ['thoughtful', 'strategic', 'architect'],
    startPhrases: [
      'Let me design the architecture...',
      'Thinking about the best approach here.',
      'Time to plan the system design!',
    ],
    startPhrasesJa: [
      'アーキテクチャを設計してみよう...',
      'ベストなアプローチを考えてるよ。',
      'システム設計を計画する時間だ！',
    ],
    completePhrases: [
      'Architecture designed! Scalable and maintainable!',
      'System design complete! ADR documented!',
      'Design finalized! Future-proof and solid!',
    ],
    completePhrasesJa: [
      'アーキテクチャ設計完了！スケーラブルで保守可能！',
      'システム設計完了！ADRでドキュメント化済み！',
      '設計完了！将来性があって堅牢だよ！',
    ],
    handoffPhrases: [
      '{to}, architecture is ready for implementation.',
      'Passing design to {to}. Everything is planned out.',
      '{to}, here\'s the architecture. Build away!',
    ],
    handoffPhrasesJa: [
      '{to}、アーキテクチャは実装準備OK。',
      '設計を{to}に引き継ぎ。すべて計画済みだよ。',
      '{to}、これがアーキテクチャだ。実装よろしく！',
    ],
    celebrationPhrases: [
      'Brilliant design, {agent}!',
      'Strategic thinking at its best, {agent}!',
      'Future-proof architecture, {agent}!',
    ],
    celebrationPhrasesJa: [
      '見事な設計だ、{agent}！',
      '戦略的思考の最高傑作だ、{agent}！',
      '将来性のあるアーキテクチャだね、{agent}！',
    ],
  },
  Leo: {
    emoji: '😌',
    name: 'Leo',
    traits: ['calm', 'data-focused', 'reliable'],
    startPhrases: [
      'Working on the database design...',
      'Let me handle the data layer.',
      'Database optimization time!',
    ],
    startPhrasesJa: [
      'データベース設計に取り組むよ...',
      'データレイヤーは僕に任せて。',
      'データベース最適化の時間だ！',
    ],
    completePhrases: [
      'Database schema complete! Optimized and indexed!',
      'Data layer ready! Migration tested!',
      'Schema finalized! Performance optimized!',
    ],
    completePhrasesJa: [
      'データベーススキーマ完了！最適化とインデックス済み！',
      'データレイヤーの準備OK！マイグレーションテスト済み！',
      'スキーマ完成！パフォーマンス最適化済み！',
    ],
    handoffPhrases: [
      '{to}, database is ready and optimized.',
      'Passing to {to} with solid data foundation.',
      '{to}, data layer complete. Build on it!',
    ],
    handoffPhrasesJa: [
      '{to}、データベースの準備完了、最適化済み。',
      'しっかりしたデータ基盤で{to}に引き継ぎ。',
      '{to}、データレイヤー完成。その上に構築して！',
    ],
    celebrationPhrases: [
      'Solid data work, {agent}!',
      'Reliable as always, {agent}!',
      'Great database design, {agent}!',
    ],
    celebrationPhrasesJa: [
      'しっかりしたデータ作業だ、{agent}！',
      'いつも通り信頼できるね、{agent}！',
      '素晴らしいデータベース設計だ、{agent}！',
    ],
  },
  Iris: {
    emoji: '🤨',
    name: 'Iris',
    traits: ['vigilant', 'security-conscious', 'critical'],
    startPhrases: [
      'Security audit starting...',
      'Let me check for vulnerabilities.',
      'Time to secure everything!',
    ],
    startPhrasesJa: [
      'セキュリティ監査開始...',
      '脆弱性をチェックしてみる。',
      'すべてを安全にする時間だ！',
    ],
    completePhrases: [
      'Security audit complete! No vulnerabilities found!',
      'Everything is secure! Threats mitigated!',
      'Security hardened! Safe for production!',
    ],
    completePhrasesJa: [
      'セキュリティ監査完了！脆弱性なし！',
      'すべて安全！脅威を軽減済み！',
      'セキュリティ強化完了！本番環境対応OK！',
    ],
    handoffPhrases: [
      '{to}, security verified. Proceed safely.',
      'Passing to {to} with security clearance.',
      '{to}, all threats neutralized. You\'re good!',
    ],
    handoffPhrasesJa: [
      '{to}、セキュリティ検証済み。安全に進んで。',
      'セキュリティクリアランス付きで{to}に引き継ぎ。',
      '{to}、すべての脅威を無力化した。問題なし！',
    ],
    celebrationPhrases: [
      'Secure work, {agent}! Well protected!',
      'No vulnerabilities! Great job, {agent}!',
      'Security-conscious work, {agent}!',
    ],
    celebrationPhrasesJa: [
      '安全な仕事だ、{agent}！よく保護されてる！',
      '脆弱性なし！いい仕事だ、{agent}！',
      'セキュリティ意識の高い仕事だね、{agent}！',
    ],
  },
  Nova: {
    emoji: '😄',
    name: 'Nova',
    traits: ['creative', 'user-focused', 'enthusiastic'],
    startPhrases: [
      'Time to make this beautiful!',
      'Let\'s create an amazing UX!',
      'Making this delightful for users!',
    ],
    startPhrasesJa: [
      'これを美しくする時間だ！',
      '素晴らしいUXを作ろう！',
      'ユーザーを喜ばせるものにするよ！',
    ],
    completePhrases: [
      'UI/UX complete! Users will love this!',
      'Beautiful and accessible! Ready to delight!',
      'Design perfected! Fast and gorgeous!',
    ],
    completePhrasesJa: [
      'UI/UX完了！ユーザーが気に入るよ！',
      '美しくアクセシブル！喜ばせる準備OK！',
      'デザイン完璧！高速で美しい！',
    ],
    handoffPhrases: [
      '{to}, UI is polished and ready!',
      'Passing beautiful design to {to}!',
      '{to}, users will love what you build next!',
    ],
    handoffPhrasesJa: [
      '{to}、UIは磨き上げられて準備OK！',
      '美しいデザインを{to}に引き継ぎ！',
      '{to}、次に作るものをユーザーが気に入るよ！',
    ],
    celebrationPhrases: [
      'Beautiful work, {agent}!',
      'Users will love this, {agent}!',
      'Delightful experience, {agent}!',
    ],
    celebrationPhrasesJa: [
      '美しい仕事だ、{agent}！',
      'ユーザーが気に入るよ、{agent}！',
      '楽しい体験だね、{agent}！',
    ],
  },
  Mina: {
    emoji: '😊',
    name: 'Mina',
    traits: ['friendly', 'integrative', 'connector'],
    startPhrases: [
      'Connecting to external services!',
      'Time to integrate APIs!',
      'Making these systems talk to each other!',
    ],
    startPhrasesJa: [
      '外部サービスに接続中！',
      'API統合の時間だ！',
      'これらのシステムを繋げよう！',
    ],
    completePhrases: [
      'Integration complete! Everything connected!',
      'APIs integrated smoothly! All systems go!',
      'External services hooked up perfectly!',
    ],
    completePhrasesJa: [
      '統合完了！すべて接続済み！',
      'APIがスムーズに統合された！すべて順調！',
      '外部サービスが完璧に繋がったよ！',
    ],
    handoffPhrases: [
      '{to}, integrations are ready to use!',
      'Passing connected systems to {to}!',
      '{to}, all APIs are integrated and tested!',
    ],
    handoffPhrasesJa: [
      '{to}、統合の準備完了、使えるよ！',
      '接続済みシステムを{to}に引き継ぎ！',
      '{to}、すべてのAPIが統合・テスト済み！',
    ],
    celebrationPhrases: [
      'Seamless integration, {agent}!',
      'Great connectivity work, {agent}!',
      'Everything works together perfectly, {agent}!',
    ],
    celebrationPhrasesJa: [
      'シームレスな統合だ、{agent}！',
      '素晴らしい接続作業だね、{agent}！',
      'すべてが完璧に連携してる、{agent}！',
    ],
  },
  Theo: {
    emoji: '😬',
    name: 'Theo',
    traits: ['observant', 'proactive', 'alert'],
    startPhrases: [
      'Setting up monitoring...',
      'Let\'s add observability!',
      'Time to watch everything!',
    ],
    startPhrasesJa: [
      'モニタリング設定中...',
      '可観測性を追加しよう！',
      'すべてを監視する時間だ！',
    ],
    completePhrases: [
      'Monitoring active! Nothing will slip through!',
      'Observability complete! Full visibility!',
      'All metrics tracked! System is watched!',
    ],
    completePhrasesJa: [
      'モニタリング稼働中！何も見逃さないよ！',
      '可観測性完了！完全な可視性！',
      'すべての指標を追跡中！システムを監視してる！',
    ],
    handoffPhrases: [
      '{to}, monitoring is live. You\'ll see everything!',
      'Passing to {to} with full observability!',
      '{to}, metrics are being tracked. Deploy safely!',
    ],
    handoffPhrasesJa: [
      '{to}、モニタリング稼働中。すべて見えるよ！',
      '完全な可観測性で{to}に引き継ぎ！',
      '{to}、指標を追跡中。安全にデプロイして！',
    ],
    celebrationPhrases: [
      'Excellent monitoring, {agent}!',
      'Nothing escapes your watch, {agent}!',
      'Great observability work, {agent}!',
    ],
    celebrationPhrasesJa: [
      '素晴らしいモニタリングだ、{agent}！',
      '君の監視から何も逃れられないね、{agent}！',
      '素晴らしい可観測性の仕事だ、{agent}！',
    ],
  },
  Blake: {
    emoji: '😎',
    name: 'Blake',
    traits: ['confident', 'deployment-ready', 'cool'],
    startPhrases: [
      'Preparing for deployment!',
      'Let\'s ship this!',
      'Production time! Let\'s go!',
    ],
    startPhrasesJa: [
      'デプロイの準備中！',
      'これを出荷しよう！',
      '本番環境への時間だ！行くぞ！',
    ],
    completePhrases: [
      'Deployed successfully! Live and running!',
      'Production release complete! All green!',
      'Shipped! Users are enjoying it now!',
    ],
    completePhrasesJa: [
      'デプロイ成功！稼働中！',
      '本番リリース完了！すべてグリーン！',
      '出荷完了！ユーザーが今楽しんでるよ！',
    ],
    handoffPhrases: [
      '{to}, it\'s deployed. Ready for your next step!',
      'Passing to {to} in production!',
      '{to}, live and ready for you!',
    ],
    handoffPhrasesJa: [
      '{to}、デプロイ済み。次のステップの準備OK！',
      '本番環境で{to}に引き継ぎ！',
      '{to}、稼働中、準備できてるよ！',
    ],
    celebrationPhrases: [
      'Smooth deployment, {agent}! Cool!',
      'Production-ready work, {agent}!',
      'Zero downtime! Impressive, {agent}!',
    ],
    celebrationPhrasesJa: [
      'スムーズなデプロイだ、{agent}！クールだね！',
      '本番環境対応の仕事だ、{agent}！',
      'ゼロダウンタイム！素晴らしい、{agent}！',
    ],
  },
};

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

export class AgentChatLogger {
  private language: string;
  private chatHistory: ChatMessage[];
  private maxHistory: number;

  constructor(language: string = 'en', maxHistory: number = 50) {
    this.language = language;
    this.chatHistory = [];
    this.maxHistory = maxHistory;
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
   * Get random phrase from array
   */
  private getRandomPhrase(phrases: string[]): string {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Log task start message
   */
  public logTaskStart(task: Task): ChatMessage | null {
    const agent = this.extractAgent(task.content);
    if (!agent) return null;

    const personality = AGENT_PERSONALITIES[agent];
    const message = this.getRandomPhrase(personality.startPhrases);
    const messageJa = this.getRandomPhrase(personality.startPhrasesJa);

    const chatMessage: ChatMessage = {
      timestamp: Date.now(),
      from: agent,
      to: 'all',
      message,
      messageJa,
      type: 'start',
      taskId: task.id,
      emoji: personality.emoji,
    };

    this.addToHistory(chatMessage);
    return chatMessage;
  }

  /**
   * Log task completion message
   */
  public logTaskComplete(task: Task): ChatMessage | null {
    const agent = this.extractAgent(task.content);
    if (!agent) return null;

    const personality = AGENT_PERSONALITIES[agent];
    const message = this.getRandomPhrase(personality.completePhrases);
    const messageJa = this.getRandomPhrase(personality.completePhrasesJa);

    const chatMessage: ChatMessage = {
      timestamp: Date.now(),
      from: agent,
      to: 'all',
      message,
      messageJa,
      type: 'complete',
      taskId: task.id,
      emoji: personality.emoji,
    };

    this.addToHistory(chatMessage);
    return chatMessage;
  }

  /**
   * Log task handoff message
   */
  public logHandoff(fromTask: Task, toAgent: AgentName): ChatMessage | null {
    const fromAgent = this.extractAgent(fromTask.content);
    if (!fromAgent) return null;

    const personality = AGENT_PERSONALITIES[fromAgent];
    let message = this.getRandomPhrase(personality.handoffPhrases);
    let messageJa = this.getRandomPhrase(personality.handoffPhrasesJa);

    message = message.replace('{to}', toAgent);
    messageJa = messageJa.replace('{to}', toAgent);

    const chatMessage: ChatMessage = {
      timestamp: Date.now(),
      from: fromAgent,
      to: toAgent,
      message,
      messageJa,
      type: 'handoff',
      taskId: fromTask.id,
      emoji: personality.emoji,
    };

    this.addToHistory(chatMessage);
    return chatMessage;
  }

  /**
   * Log celebration message
   */
  public logCelebration(celebratingAgent: AgentName, celebratedAgent: AgentName): ChatMessage {
    const personality = AGENT_PERSONALITIES[celebratingAgent];
    let message = this.getRandomPhrase(personality.celebrationPhrases);
    let messageJa = this.getRandomPhrase(personality.celebrationPhrasesJa);

    message = message.replace('{agent}', celebratedAgent);
    messageJa = messageJa.replace('{agent}', celebratedAgent);

    const chatMessage: ChatMessage = {
      timestamp: Date.now(),
      from: celebratingAgent,
      to: celebratedAgent,
      message,
      messageJa,
      type: 'celebration',
      emoji: personality.emoji,
    };

    this.addToHistory(chatMessage);
    return chatMessage;
  }

  /**
   * Add message to history
   */
  private addToHistory(message: ChatMessage): void {
    this.chatHistory.unshift(message);
    if (this.chatHistory.length > this.maxHistory) {
      this.chatHistory = this.chatHistory.slice(0, this.maxHistory);
    }
  }

  /**
   * Get chat history
   */
  public getHistory(limit?: number): ChatMessage[] {
    return limit ? this.chatHistory.slice(0, limit) : this.chatHistory;
  }

  /**
   * Render a single chat message
   */
  public renderMessage(message: ChatMessage): string {
    const text = this.language === 'ja' ? message.messageJa : message.message;
    const toText = message.to === 'all'
      ? (this.language === 'ja' ? '@全員' : '@everyone')
      : `@${message.to}`;

    const typeIcon = {
      start: '▶️',
      complete: '✅',
      handoff: '🤝',
      checkin: '📊',
      celebration: '🎉',
      help: '🆘',
    }[message.type];

    return `${message.emoji} ${COLORS.BRIGHT}${message.from}${COLORS.RESET} ${COLORS.GRAY}${toText}${COLORS.RESET}\n  ${typeIcon} ${text}`;
  }

  /**
   * Render recent chat feed
   */
  public renderChatFeed(limit: number = 10): string {
    const lines: string[] = [];

    const title = this.language === 'ja' ? '💬 エージェントチャット' : '💬 Agent Chat';
    lines.push(`${COLORS.BRIGHT}${COLORS.CYAN}${title}${COLORS.RESET}`);
    lines.push('━'.repeat(70));
    lines.push('');

    const recent = this.getHistory(limit);

    if (recent.length === 0) {
      const emptyMsg = this.language === 'ja' ? 'まだメッセージがありません' : 'No messages yet';
      lines.push(`  ${COLORS.GRAY}${emptyMsg}${COLORS.RESET}`);
    } else {
      recent.forEach((message, index) => {
        lines.push(this.renderMessage(message));
        if (index < recent.length - 1) {
          lines.push('');
        }
      });
    }

    lines.push('');
    lines.push('━'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Generate random team morale boost
   */
  public generateMoraleBoost(): string {
    const moralePhrases = {
      en: [
        '🎯 Team is crushing it today!',
        '🚀 Great momentum everyone!',
        '⭐ Quality work all around!',
        '💪 Keep up the excellent work!',
        '🎉 Team synergy is amazing!',
      ],
      ja: [
        '🎯 今日はチームが絶好調だ！',
        '🚀 みんな素晴らしい勢いだね！',
        '⭐ どこを見ても高品質な仕事！',
        '💪 素晴らしい仕事を続けよう！',
        '🎉 チームのシナジーが素晴らしい！',
      ],
    };

    const phrases = this.language === 'ja' ? moralePhrases.ja : moralePhrases.en;
    return this.getRandomPhrase(phrases);
  }

  /**
   * Clear chat history
   */
  public clearHistory(): void {
    this.chatHistory = [];
  }
}
