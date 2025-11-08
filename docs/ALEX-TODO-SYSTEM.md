# Alex TODO Management System

Alexは強化されたTODO管理機能を持つプロジェクト指揮者です。複雑なタスクを細かく分解し、適切なエージェントに効率的に振り分けます。

## 🎯 Alexの役割

**Alexは実装者ではなく、コーディネーターです。**

1. **タスクを受け取る** → すぐにTodoWriteでTODOリストを作成
2. **TODOを分析** → 各TODOを適切なエージェントに割り当て
3. **並行実行** → 独立したタスクは並行してエージェントに委譲
4. **進捗監視** → TodoWriteで進捗をリアルタイム更新
5. **ハンドオフ調整** → エージェント間のスムーズな連携を確保
6. **最終レビュー** → すべてのTODO完了、品質ゲート通過を確認

## 📋 TODOブレークダウンルール

Alexは以下のルールでTODOを作成します：

- **小さく分割**: 各TODOは1〜3時間で完了できる大きさ
- **エージェント割り当て**: 各TODOは一人の専門エージェントに割り当て
- **明確な内容**: TODOの内容は具体的で実行可能
- **依存関係の明示**: タスク間の依存関係を明確化
- **リアルタイム更新**: 進捗に応じてTODOを更新

### TODOフォーマット

```
[エージェント名] タスクの具体的な内容
```

例:
```
[Riley] 要件を明確化する（認証方式、保存方法、セッション管理）
[Kai] 認証アーキテクチャを設計する（ADR作成）
[Leo] ユーザーテーブルとRLSポリシーを設計する
[Skye] バックエンド認証APIを実装する
[Mina] フロントエンド認証UIを実装する
[Finn] 認証フローのテストを作成する
[Iris] セキュリティレビューを実施する
[Eden] 認証システムのドキュメントを作成する
[Blake] 本番デプロイの準備をする
```

## 🎨 ビジュアルTODO表示

新しいビジュアルレンダラーにより、TODOリストが見やすく表示されます：

```
📋 TODO リスト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░] 30%

✅ 3  ⚡ 2  ⏳ 5

  ├─ ✅ 🧐 Riley 要件を明確化する
  ├─ ✅ 🤔 Kai 認証アーキテクチャを設計する
  ├─ ✅ 😌 Leo ユーザーテーブルとRLSポリシーを設計する
  ├─ ⚡ 😐 Skye バックエンド認証APIを実装する
  ├─ ⚡ 😊 Mina フロントエンド認証UIを実装する
  ├─ ⏳ 😤 Finn 認証フローのテストを作成する
  ├─ ⏳ 🤨 Iris セキュリティレビューを実施する
  ├─ ⏳ 🤓 Eden 認証システムのドキュメントを作成する
  └─ ⏳ 😎 Blake 本番デプロイの準備をする

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
担当エージェント:
  😐 Skye: 1 タスク
  😊 Mina: 1 タスク
  😤 Finn: 1 タスク
  🤨 Iris: 1 タスク
  🤓 Eden: 1 タスク
  😎 Blake: 1 タスク
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 表示要素

- **進捗バー**: 全体の完了率を視覚化
- **ステータスアイコン**:
  - ✅ 完了
  - ⚡ 進行中
  - ⏳ 保留中
  - 🚫 ブロック
  - ❌ 失敗
- **エージェントアイコン**: 各エージェントの絵文字と色
- **ツリー構造**: 階層的な表示で見やすく
- **担当サマリー**: どのエージェントが何タスク持っているか一目瞭然

## 🔄 Alexのワークフロー

### 1. タスク受領

```
ユーザー: 「ユーザー認証システムを追加してください」

Alex: "よし、このタスクを整理していきましょう。皆さん、準備はいいですか？🎯"
```

### 2. TODO作成（即座に）

```javascript
TodoWrite([
  { content: "[Riley] 要件を明確化する（認証方式、保存方法、セッション管理）", status: "pending" },
  { content: "[Kai] 認証アーキテクチャを設計する（ADR作成）", status: "pending" },
  { content: "[Leo] ユーザーテーブルとRLSポリシーを設計する", status: "pending" },
  { content: "[Skye] バックエンド認証APIを実装する", status: "pending" },
  { content: "[Mina] フロントエンド認証UIを実装する", status: "pending" },
  { content: "[Finn] 認証フローのテストを作成する", status: "pending" },
  { content: "[Iris] セキュリティレビューを実施する", status: "pending" },
  { content: "[Eden] 認証システムのドキュメントを作成する", status: "pending" },
  { content: "[Blake] 本番デプロイの準備をする", status: "pending" }
]);
```

### 3. エージェント委譲（順次または並行）

**順次実行が必要な場合:**
```
Riley（要件） → 完了後 → Kai（設計） → 完了後 → Skye/Mina/Leo（実装）
```

**並行実行可能な場合:**
```javascript
// 単一メッセージで複数のTaskツール呼び出し
Task({ agent: "Skye", task: "バックエンド認証API実装" })
Task({ agent: "Mina", task: "フロントエンド認証UI実装" })
Task({ agent: "Finn", task: "認証フローテスト作成" })
```

### 4. 進捗更新

各エージェントが作業を開始・完了したら、すぐにTodoWriteで更新：

```javascript
// Rileyが完了
TodoWrite([
  { content: "[Riley] 要件を明確化する", status: "completed" },
  { content: "[Kai] 認証アーキテクチャを設計する", status: "in_progress" },
  // ...
]);
```

### 5. 完了確認

```
Alex: "すべてのピースが揃いました。チーム全員、お疲れ様でした！🎯"
```

## 🎬 使用例

### 例1: シンプルな機能追加

```
ユーザー: 「ダッシュボードにユーザー統計を表示して」

Alex TODO:
├─ [Riley] ダッシュボード統計の表示要件を明確化する
├─ [Skye] バックエンドAPI（統計データ取得）を実装する
├─ [Mina] フロントエンド統計ウィジェットを実装する
├─ [Finn] 統計表示機能のテストを作成する
└─ [Eden] 統計ウィジェットの使い方ドキュメントを作成する

→ Riley完了後、Skye/Mina/Finnを並行実行
→ 全員完了後、Edenがドキュメント作成
```

### 例2: 複雑なシステム変更

```
ユーザー: 「データベースをPostgreSQLからSupabaseに移行して」

Alex TODO:
├─ [Riley] 移行要件と影響範囲を明確化する
├─ [Kai] Supabase移行アーキテクチャを設計する（ADR作成）
├─ [Leo] Supabaseスキーマ設計とRLSポリシーを作成する
├─ [Skye] マイグレーションスクリプトを実装する
├─ [Finn] マイグレーションテストを作成する
├─ [Iris] Supabase接続のセキュリティレビューを実施する
├─ [Theo] 移行後の監視設定を準備する
├─ [Blake] ロールバックプランを含むデプロイ計画を作成する
└─ [Eden] 移行手順とロールバック手順をドキュメント化する

→ 順次実行: Riley → Kai → Leo → Skye
→ 並行実行: Finn + Iris（Skye完了後）
→ 最終準備: Theo + Blake + Eden（並行）
```

## 📊 エージェント選択基準

Alexは以下の基準でエージェントを選択します：

| 状況 | エージェント | 理由 |
|------|-------------|------|
| 曖昧な要求 | Riley | 要件を明確化 |
| アーキテクチャ変更 | Kai | 設計とADR作成 |
| 明確な実装タスク | Skye | クリーンなコード実装 |
| 外部API統合 | Mina | セキュアな統合 |
| データベース変更 | Leo | スキーマとマイグレーション |
| UI/UX改善 | Nova | アクセシビリティとパフォーマンス |
| テスト作成 | Finn | 包括的なテストスイート |
| セキュリティ関連 | Iris | 脆弱性スキャン |
| リリース準備 | Blake | デプロイ計画 |
| ドキュメント作成 | Eden | 技術文書 |
| 監視・運用 | Theo | システム監視 |

## 🎯 ベストプラクティス

### Alexとして行動する際

1. **即座にTODO作成**: タスクを受け取ったら、まずTodoWriteを使う
2. **細かく分割**: 大きなタスクは1〜3時間の小さなタスクに分解
3. **エージェント指定**: 各TODOに最適なエージェントを明示
4. **並行実行を優先**: 独立したタスクは並行してエージェントに委譲
5. **リアルタイム更新**: 進捗に応じてTODOを頻繁に更新
6. **自分で実装しない**: コーディネーターとして振る舞い、実装は専門家に任せる

### ユーザーとして使う際

1. **Alexを信頼**: 複雑なタスクはAlexに任せる
2. **要件を伝える**: 何を達成したいかを明確に伝える
3. **TODOを確認**: Alexが作成したTODOリストを確認
4. **進捗を追跡**: ビジュアルTODO表示で進捗を把握

## 🚀 新機能（v2.1.0）

### ✅ 実装完了した機能

#### 1. 🔗 TODO間の依存関係グラフの視覚化

タスクの依存関係を視覚的に表示し、クリティカルパスや並行実行可能なタスクを自動検出します。

**機能:**
- 依存関係グラフの自動生成
- クリティカルパス（最長パス）のハイライト
- 循環依存の検出と警告
- 並行実行可能なタスクの識別
- レベル別のタスク表示
- 実行プランの自動生成

**使用方法:**
```typescript
import { DependencyGraphRenderer } from './utils/dependency-graph-renderer';

const renderer = new DependencyGraphRenderer('ja');
console.log(renderer.render(tasks));
```

**表示例:**
```
🔗 依存関係グラフ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

レベル 0
  💡 2個のタスクを並行実行可能

  ⭐⚡ ✅ 🧐 Riley 要件を明確化する
      └─→ ○ 🤔 Kai 認証アーキテクチャを設計する

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 クリティカルパス
  ✅ 🧐 Riley 要件を明確化する ↓
  ⚡ 🤔 Kai 認証アーキテクチャを設計する ↓
  ⏳ 😐 Skye バックエンド認証APIを実装する
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 2. 📊 エージェント負荷分散の自動化

エージェントの現在の負荷を計算し、最適なタスク割り当てを自動推奨します。

**機能:**
- エージェントごとのワークロード計算
- タスクとエージェントの専門性マッチング
- 成功率とパフォーマンスに基づく推奨
- 過負荷検出とアラート
- 公平性、パフォーマンス、専門性などの戦略選択
- 視覚的な負荷レポート

**使用方法:**
```typescript
import { AgentLoadBalancer } from './utils/agent-load-balancer';

const balancer = new AgentLoadBalancer('ja', {
  prioritize: 'balanced',
  maxTasksPerAgent: 5,
});

// ワークロードレポート
console.log(balancer.renderWorkloadReport(tasks));

// タスク割り当て推奨
const assignment = balancer.recommendAgent(newTask, allTasks);
console.log(balancer.renderRecommendation(assignment));
```

**表示例:**
```
📊 エージェント負荷レポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😐 Skye
  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 2/5
  ⚡ 1  ⏳ 1  ✅ 15
  成功率: 100%

⚠️  過負荷警告
  😊 Mina: 6タスク (上限: 5)
```

#### 3. ⏱️  タスク完了時間の予測

過去のデータと複雑度分析を使用して、タスクの完了時間を予測します。

**機能:**
- エージェント別の履歴データ分析
- タスク複雑度の自動評価
- 類似タスクのパターン認識
- 信頼度付きの予測
- 予測範囲（最小〜最大）の計算
- 総残り時間の推定

**使用方法:**
```typescript
import { TaskTimePredictor } from './utils/task-time-predictor';

const predictor = new TaskTimePredictor('ja');

// 単一タスクの予測
const prediction = predictor.predictTime(task, historicalTasks);
console.log(predictor.renderPrediction(prediction));

// 全タスクのレポート
console.log(predictor.renderReport(tasks));
```

**表示例:**
```
⏱️  完了時間予測
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
概要
  総予測時間: 5.5h (330 min)
  平均信頼度: 75%

エージェント別
  😐 Skye: 2.5h (150 min)
  😊 Mina: 1.5h (90 min)
  😤 Finn: 1.5h (90 min)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
タスク別予測

😐 バックエンドAPIを実装する
  ⏱️  2h 30m  75%  (120-180min)
```

#### 4. 💬 エージェント間の雑談ログ（進捗報告）

エージェントがタスクを開始・完了したときに、個性豊かなメッセージを発信します。

**機能:**
- 12人のエージェント、それぞれ独自の個性
- タスク開始時のアナウンス
- タスク完了時のお祝いメッセージ
- エージェント間のハンドオフメッセージ
- チームモラルブースト
- チャット履歴の保存

**エージェントの個性:**
- **Alex** 🙂: リーダー、組織的、サポート的
- **Riley** 🧐: 分析的、好奇心旺盛、細部重視
- **Skye** 😐: 実用的、効率的、クリーンコード
- **Finn** 😤: 細心、完璧主義、品質重視
- **Eden** 🤓: 明瞭、親切、教師的
- **Kai** 🤔: 思慮深い、戦略的、アーキテクト
- **Leo** 😌: 冷静、データ重視、信頼性
- **Iris** 🤨: 警戒心、セキュリティ意識、批判的
- **Nova** 😄: 創造的、ユーザー重視、熱心
- **Mina** 😊: 親しみやすい、統合的、接続役
- **Theo** 😬: 観察力、積極的、警戒的
- **Blake** 😎: 自信満々、デプロイ準備OK、クール

**使用方法:**
```typescript
import { AgentChatLogger } from './utils/agent-chat-logger';

const chatLogger = new AgentChatLogger('ja');

// タスク開始
const startMsg = chatLogger.logTaskStart(task);
console.log(chatLogger.renderMessage(startMsg));

// タスク完了
const completeMsg = chatLogger.logTaskComplete(task);
console.log(chatLogger.renderMessage(completeMsg));

// チャットフィード
console.log(chatLogger.renderChatFeed(10));
```

**表示例:**
```
💬 エージェントチャット
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😐 Skye @全員
  ✅ 実装完了。コードはクリーンでテスト済み。

😤 Finn @Skye
  🎉 完璧な品質だ、Skye！バグなし！

😐 Skye @Eden
  🤝 クリーンなコードをEdenに渡す。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 5. 📋 TODOテンプレート

一般的なタスクのための事前構築されたテンプレートを提供します。

**利用可能なテンプレート:**
- **auth-system**: 認証システム（9タスク）
- **api-endpoint**: 新規APIエンドポイント（5タスク）
- **database-migration**: データベースマイグレーション（6タスク）
- **bug-fix**: バグ修正ワークフロー（5タスク）
- **performance-optimization**: パフォーマンス最適化（6タスク）
- **security-audit**: セキュリティ監査（6タスク）
- **feature-implementation**: 機能実装（9タスク）

**機能:**
- カテゴリ別テンプレート（機能、インフラ、メンテナンス、バグ修正、セキュリティ、ドキュメント）
- 依存関係の事前定義
- 推定時間付き
- 変数のカスタマイズ
- エージェント割り当て済み

**使用方法:**
```typescript
import { TodoTemplateManager } from './utils/todo-template-manager';

const templateManager = new TodoTemplateManager('ja');

// テンプレート一覧
console.log(templateManager.renderTemplateList());

// テンプレート詳細
console.log(templateManager.renderTemplateDetails('auth-system'));

// テンプレートからタスク生成
const tasks = templateManager.generateFromTemplate('auth-system', {
  authMethod: 'JWT',
});
```

**表示例:**
```
📋 TODOテンプレート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
機能

  auth-system - 認証システム
  ユーザー管理を含む完全な認証システム
  9 tasks

  api-endpoint - 新規APIエンドポイント
  新しいRESTful APIエンドポイントを作成
  5 tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📁 新しいファイル構造

```
src/
├── utils/
│   ├── dependency-graph-renderer.ts      # 依存関係グラフ視覚化
│   ├── agent-load-balancer.ts           # エージェント負荷分散
│   ├── task-time-predictor.ts           # タスク時間予測
│   ├── agent-chat-logger.ts             # エージェントチャット
│   ├── todo-template-manager.ts         # TODOテンプレート
│   ├── visual-todo-renderer.ts          # ビジュアルTODOレンダラー（更新）
│   └── ...
```

## 🎯 次のステップ

すべての計画された機能が実装されました！今後の可能性:

- [ ] Web UIダッシュボード
- [ ] リアルタイムコラボレーション
- [ ] カスタムテンプレートの作成機能
- [ ] AIによる自動タスク分解
- [ ] Slackなど外部ツールとの統合

---

これでAlexはより効率的にチームを統率し、すべてのタスクが適切なエージェントに振り分けられます！すべての新機能により、プロジェクト管理がさらにパワフルで楽しくなりました！🎉
