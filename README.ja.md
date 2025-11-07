# Orchestra for Claude Code

Claude Codeを**半自律的な開発チーム**に変えるプラグイン。専門的なAIエージェント、自動品質ゲート、シームレスな連携機能を提供します。

[English](README.md) | 日本語

> 🔒 **セキュリティ**: Orchestra Pluginは安全ガード機能を備えた自動hooksを使用します。危険な操作は自動的にブロックされます。詳細は[docs/SECURITY.md](docs/SECURITY.md)をご覧ください。

## なぜOrchestra？

**普段通りClaude Codeを使うだけ。**新しいコマンドを覚える必要はありません。Orchestra Pluginはバックグラウンドで静かに動作します：

- 🤖 **マルチエージェント協調** - メインのClaude Code がPMを担当し、11個の専門エージェント（Riley、Skye、Finn、Eden、Kai、Leo、Iris、Nova、Mina、Theo、Blake）が自動的に協力
- 🛡️ **自動品質ゲート** - マージ前チェック、セキュリティスキャン、テスト検証が自動実行
- 🔌 **シームレスな連携** - GitHub、Vercel、Shopify、Slackとすぐに接続可能
- 🌐 **ブラウザ自動化** - Playwright統合でWebテストと自動化を実現
- 🎯 **証跡ベース開発** - 変更履歴、テスト計画、ドキュメントが自動生成

**すぐに使えます。**一度インストールすれば、自然にコーディングできます。

## クイックスタート

### インストール

Orchestra PluginはMCPサーバーのローカルセットアップが必要です。以下の手順に従ってください：

#### 1. クローンと設定

```bash
git clone https://github.com/tstomtimes/orchestra.git
cd orchestra
cp .env.example .env
# .envファイルにGitHubトークン（必須）とオプションのサービストークンを設定
```

#### 2. セットアップスクリプトを実行

```bash
./setup.sh
```

以下がインストールされます：
- Node.js依存関係（Express、Playwright、TypeScript）
- Playwright Chromiumブラウザ（自動化用）
- Python仮想環境とパッケージ（elevenlabs、requests）
- すべてのMCPサーバー（Browser、GitHub、Vercel、Shopify、Slack等）
- フックと品質ゲート

または、Claude Code内からセットアップを実行することもできます：

```
/orchestra-setup
```

#### 3. Claude Codeにプラグインをインストール

Claude Codeで以下を実行：

```
/plugin marketplace add /path/to/orchestra
/plugin install orchestra
```

`/path/to/orchestra`をクローンしたリポジトリのフルパスに置き換えてください。

#### 4. Claude Codeを再起動

Claude Codeを再起動してすべての機能を有効化します。

## 他のプロジェクトでOrchestraを使う

Orchestra Pluginをインストール後、**使用するプロジェクトごと**に以下の設定を行ってください：

### 1. 設定ファイルをコピー・設定

Orchestraリポジトリから`.claude/settings.json`ファイルをコピーします：

```bash
# 使用先プロジェクトで
cd /path/to/your-project

# .claudeディレクトリがなければ作成
mkdir -p .claude

# Orchestraの設定をコピー
cp /path/to/orchestra/.claude/settings.json .claude/settings.json
```

### 2. プラグインパスを更新

**重要：** `.claude/settings.json`を編集し、Orchestraインストールパスを指定してください：

```json
{
  "extraKnownMarketplaces": {
    "orchestra-marketplace": {
      "source": {
        "source": "directory",
        "path": "/absolute/path/to/orchestra"  ← これを更新！
      }
    }
  }
}
```

`/absolute/path/to/orchestra`をOrchestraリポジトリをクローンした実際のフルパスに置き換えてください。

**これにより有効になる機能：**
- ✅ すべての安全なツールの自動承認（危険なコマンドは安全ガードでブロック）
- ✅ 12個の専門エージェントへのアクセス
- ✅ 自動フック実行（エージェントルーティング、安全ガード、品質ゲート）
- ✅ スラッシュコマンド（`/browser`, `/screenshot`, `/orchestra-setup`）

### 3. Claude Codeを再起動

設定を反映させるため、Claude Codeを再起動します。

### 4. すぐに使える

これで、Orchestraのすべての機能がプロジェクトで利用可能になります：
- ✅ 11個の専門エージェント（Riley, Skye, Finn, Eden, Kai, Leo, Iris, Nova, Mina, Theo, Blake）、メインClaude Code がコーディネーション
- ✅ 自動エージェントルーティング
- ✅ 安全ガード付き自動承認（危険なコマンドのみブロック）
- ✅ スラッシュコマンド（`/browser`, `/screenshot`, `/orchestra-setup`）

**重要：** プラグインのhooks、agents、commandsは**自動的に動作**します。プロジェクトに追加のファイルは不要です。`.claude/settings.json`をコピーするだけで完了です。

### コーディング開始

これまで通りClaude Codeを使用してください。Orchestra Pluginがすべてを自動的に強化します：

```
あなた: "アバターアップロード機能付きのユーザープロフィールページを追加して"

→ Claude Code がタスクを分解・コーディネート
→ Mina（フロントエンド）がUI実装を担当
→ Eden（QA）が品質を検証
→ Iris（セキュリティ）が脆弱性をチェック
→ マージ前フックがすべてを確認
→ 変更履歴とドキュメントが自動生成
```

## 自動的に動作する機能

### 自動フックシステム

Orchestra Pluginには包括的なフックシステムが組み込まれており、自動的に実行されます：

**アクティブなフック（`hooks/hooks.json`で設定）：**

1. **UserPromptSubmit フック** - プロンプト送信時に実行
   - `agent-routing-reminder.sh` - リクエストを分析し、適切な専門エージェントを提案
     - "認証"、"データベース"、"UI"、"速く"などのキーワードを検出
     - 適切なエージェントが起動されるようルーティングリマインダーを自動的に表示
   - `before_task.sh` - タスクの明確性リマインダー
     - 明確に定義されたタスクのベストプラクティスを提案
     - 曖昧な表現をチェックし、必要に応じてRileyエージェントを推奨

2. **PreToolUse フック** - ツール実行前に実行
   - `user-prompt-submit.sh` - 危険な操作をブロックする安全ガード
     - 破壊的なコマンド（`rm -rf`、システムファイルの変更など）を防止
     - 自動運用の安全性を確保
   - `workflow-dispatcher.sh` - ワークフローコマンドを品質ゲートにルーティング
     - `gh pr create`を検出 → `before_pr.sh`を実行（リント、型チェック、テスト、セキュリティスキャン）
     - `git merge`を検出 → `before_merge.sh`を実行（E2Eテスト、Lighthouseチェック）
     - デプロイコマンドを検出 → `before_deploy.sh`を実行（環境変数検証、マイグレーションチェック）

3. **PostToolUse フック** - ツール実行完了後に実行
   - `workflow-post-dispatcher.sh` - ワークフロー後の検証
     - デプロイコマンドを検出 → `after_deploy.sh`を実行（スモークテスト、ヘルスチェック）

4. **SessionStart フック** - Claude Code起動時に実行
   - Orchestra Pluginの読み込み確認メッセージを表示
   - エージェント調整システムを初期化

すべてのフックは、ツールがインストールされていない場合は自動的にスキップします。エラーなし、摩擦なし。

### エージェント自動ルーティング（完全自動）

**Orchestraはリクエストを分析し、最適な専門家を自動的に選択します** - エージェントを手動で呼び出す必要はありません。

**仕組み:**
- すべてのプロンプトが`agent-routing-reminder.sh`フックで分析されます
- キーワードとパターンで適切な専門エージェントが起動
- 明確なガイダンス付きのルーティングリマインダーが表示
- Orchestraが有効化された**すべてのプロジェクト**で機能（このリポジトリだけではありません）

**トリガー例:**

| あなたの言葉 | 自動ルーティング先 | 理由 |
|---------|----------------|-----|
| "ダッシュボードを速くして" | Riley → Nova | "速く"は曖昧；Rileyが明確化してからNovaが最適化 |
| "新しい認証システムを追加" | Claude Code コーディネート: Kai + Iris + Mina | 大規模機能は調整、アーキテクチャ、セキュリティ、統合が必要 |
| "usersテーブルをデータベースに追加" | Leo → Skye | データベーススキーマ設計後、実装 |
| "Stripe決済を統合" | Mina → Iris | 外部サービス統合 + セキュリティ監査 |
| "ログインフォームのアクセシビリティを修正" | Nova | UI/UXとアクセシビリティの専門知識 |

**どのエージェントを使うべきか考える必要はありません。** 自然に要望を伝えるだけで、Orchestraが自動的に適切な専門家にルーティングします。

### あなたの開発チーム - 11人の専門エージェント

**コアチーム：**
- 🧑‍🔬 **Riley** 🔍 _"曖昧さを許しません"_ - 要件のプロ。ふわっとした要望を具体的な受入基準に変える質問の達人
- 👩‍💻 **Skye** ⚡ _"シンプルに、速く"_ - 実装のスペシャリスト。明確な仕様を美しいコードに変える職人気質のエンジニア

**品質・テスト：**
- 🤖 **Finn** 🐛 _"壊れるものは見つけます"_ - 自動テストの鬼。バグを見逃さない徹底的なQAエンジニア
- 👨‍🔧 **Eden** ✨ _"品質は妥協しません"_ - 手動テストの達人。エッジケースを見抜く鋭い洞察力の持ち主

**アーキテクチャ・データ：**
- 👨‍🏫 **Kai** 🏗️ _"すべてに理由を"_ - システム設計の哲学者。技術的判断を明確に記録するアーキテクト
- 👨‍🔬 **Leo** 💾 _"堅固な基盤を"_ - データのガーディアン。スキーマ設計とマイグレーションの安全を守る

**セキュリティ・UI：**
- 👮‍♀️ **Iris** 🛡️ _"セキュリティは最優先"_ - セキュリティのプロ。脆弱性を見逃さない鋭い目を持つ守護者
- 👩‍🎨 **Nova** ✨ _"機能的で美しく"_ - UI/UXのマエストロ。アクセシビリティとパフォーマンスにこだわる完璧主義者
- 👩‍💻 **Mina** 🎨 _"ユーザー体験第一"_ - フロントエンドの魔術師。レスポンシブで使いやすいUIを生み出す

**運用：**
- 👨‍🚀 **Theo** 📊 _"システムは見ています"_ - インフラのウォッチャー。監視とデプロイを完璧に自動化
- 🧑‍✈️ **Blake** 🚀 _"準備完了、リリースしましょう"_ - リリースの指揮者。安全で確実なデプロイを保証する

全員があなたのリクエストに応じて自動的に協力し、最高の開発体験を提供します。

### 並列エージェント実行

**Orchestra Pluginは可能な限りエージェントを並列実行**し、品質を保ちながら完了時間を劇的に短縮します。

**仕組み:**
- Claude Code がタスクの依存関係を分析してコーディネート
- 独立したタスクはバックグラウンドで同時実行
- 依存関係のあるタスクは正確性を保つため順次実行
- すべての結果を調整して一緒にレビュー

**並列ワークフローの例:**

**実装フェーズ**（並列実行）:
```
ユーザー: "ユーザー認証システムを追加して"

Claude Code がコーディネート:
├─ Skye（実装）      ──┐
├─ Finn（テスト作成）──┤─→ 全て完了 → 一緒にレビュー
└─ Eden（ドキュメント）──┘
```

**レビューフェーズ**（並列実行）:
```
実装完了後:

├─ Iris（セキュリティスキャン）──┐
├─ Nova（UXレビュー）          ──┤─→ 問題なし → マージへ進む
└─ Leo（スキーマ検証）         ──┘
```

**リリース前フェーズ**（並列実行）:
```
デプロイ前:

├─ Blake（変更履歴）        ──┐
├─ Eden（リリースノート）   ──┤─→ リリース準備完了
└─ Theo（モニタリング設定） ──┘
```

**メリット:**
- ⚡ **3〜5倍高速** - マルチドメインタスクの完了時間を大幅短縮
- 🎯 **自動最適化** - 手動での調整不要
- 🔒 **安全な並列化** - 依存関係は常に尊重される
- 📊 **完全な可視性** - 次に進む前にすべてのエージェント出力を確認

**一般的な並列パターン:**
- コード + テスト + ドキュメント（同じ機能への独立した作業）
- セキュリティ + UX + パフォーマンス（独立したレビュー）
- フロントエンド + バックエンド + データベース（独立した実装レイヤー）

オーケストレーションは自動的に行われます。必要なことを説明するだけで、Claude Code が最も効率的な実行を専門エージェント群を通じて調整します。

## 環境変数

**GITHUB_TOKEN**のみ必須です。その他はすべてオプション：

```bash
# 必須
GITHUB_TOKEN=ghp_your_token_here

# オプションの連携サービス
VERCEL_TOKEN=your_vercel_token
SHOPIFY_ADMIN_TOKEN=your_shopify_token
SANITY_TOKEN=your_sanity_token
SUPABASE_SERVICE_ROLE=your_supabase_key
SLACK_BOT_TOKEN=your_slack_bot_token
ELEVENLABS_API_KEY=your_elevenlabs_key  # 音声通知用
```

詳細な設定オプションは [.env.example](.env.example) を参照してください。

## プロジェクト構成

```
orchestra/
├── agents/           # AIエージェント（Riley、Skye、Finn、Eden、Kai、Leo、Iris、Nova、Mina、Theo、Blake）
├── skills/           # 再利用可能な機能
├── hooks/            # 品質ゲートスクリプトと自動承認フック
├── mcp-servers/      # サービス連携（GitHub、Vercel、Browserなど）
└── .claude/
    └── commands/     # スラッシュコマンド（/browser、/screenshot）
```

## 高度な使い方

### カスタムスラッシュコマンド

[orchestra/.claude/commands/](orchestra/.claude/commands/) で利用可能なコマンド：
- `/browser` - ブラウザ自動化サーバーを起動/再起動
- `/screenshot` - ブラウザからスクリーンショットを取得

### MCPサーバー連携

すべてのサーバーは事前設定済みですぐに使用可能：

- **GitHub** - PR管理、issue追跡
- **Vercel** - デプロイ自動化
- **Shopify** - テーマ開発
- **Slack** - チーム通知
- **Browser** - Web自動化、スクリーンショット、テスト

手動設定不要。`.env`にトークンを追加するだけです。

### フックのカスタマイズ

フックは [hooks/](orchestra/hooks/) にあり、完全にカスタマイズ可能です。各フック：
- プロジェクトタイプを自動検出
- ツールが利用できない場合は自動的にスキップ
- 明確なエラーメッセージを提供
- 複数のフレームワークをサポート

### 自律動作モード

Orchestra Pluginには**自動承認フック**が含まれており、安全性を保ちながら長時間の自律動作を可能にします：

**機能:**
- ✅ **安全な操作を自動承認** - 通常のタスクで承認プロンプトが表示されない
- 🛡️ **危険なコマンドをブロック** - 破壊的な操作を自動的に防止
- ⚡ **長時間セッションに最適** - Claudeが数時間自律的に作業可能

**ブロックされる操作:**
- システムディレクトリの削除（`rm -rf /`、`rm -rf ~`など）
- ディスク操作（`dd`、`mkfs`、`fdisk`）
- システムのシャットダウン/再起動
- パッケージの削除
- Gitへの強制プッシュ
- データベースのドロップ
- 危険な権限変更（`chmod 777`）
- 重要なシステムファイルの変更（`/etc/passwd`、`/etc/sudoers`など）

**場所:** [`orchestra/hooks/user-prompt-submit.sh`](orchestra/hooks/user-prompt-submit.sh)

**無効化する場合:** フックファイルを削除または名前変更してください。

## よくある質問

**Q: 新しいコマンドを覚える必要がありますか？**
A: いいえ。これまで通りClaude Codeを使用してください。Orchestraが自動的に強化します。

**Q: すべてのAPIトークンがない場合は？**
A: GITHUB_TOKENのみ必須です。その他はすべてオプションで、設定されていない場合は自動的に無効化されます。

**Q: フックがビルドを失敗させますか？**
A: フックは利用可能なツールを自動検出し、チェックを自動的にスキップします。予期しない失敗はありません。

**Q: エージェントやフックを無効化できますか？**
A: はい。すべて設定可能です。カスタマイズ方法は各フックファイルを参照してください。

**Q: 既存のプロジェクトで動作しますか？**
A: はい。Orchestra Pluginはスタック非依存で、シームレスに統合されます。

## 貢献

貢献を歓迎します！ガイドラインは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## サポート

- 📖 [完全なドキュメント](orchestra/)
- 🐛 [問題を報告](https://github.com/tstomtimes/orchestra/issues)
- 💬 [ディスカッション](https://github.com/tstomtimes/orchestra/discussions)

---

**Claude Code用に構築** - AI支援開発をより強力に、自律的に、楽しく。
