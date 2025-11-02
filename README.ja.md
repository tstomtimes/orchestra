# Orchestra Plugin for Claude Code

Claude Codeを**半自律的な開発チーム**に変えるプラグイン。専門的なAIエージェント、自動品質ゲート、シームレスな連携機能を提供します。

[English](README.md) | 日本語

## なぜOrchestra？

**普段通りClaude Codeを使うだけ。**新しいコマンドを覚える必要はありません。Orchestra Pluginはバックグラウンドで静かに動作します：

- 🤖 **マルチエージェント協調** - Alex（PM）、Eden（QA）、Iris（セキュリティ）、Mina（フロントエンド）、Theo（DevOps）が自動的に協力
- 🛡️ **自動品質ゲート** - マージ前チェック、セキュリティスキャン、テスト検証が自動実行
- 🔌 **シームレスな連携** - GitHub、Vercel、Shopify、Slackとすぐに接続可能
- 🌐 **ブラウザ自動化** - Playwright統合でWebテストと自動化を実現
- 🎯 **証跡ベース開発** - 変更履歴、テスト計画、ドキュメントが自動生成

**すぐに使えます。**一度インストールすれば、自然にコーディングできます。

## クイックスタート

### 1. クローンと設定

```bash
git clone https://github.com/tstomtimes/orchestra-plugin.git
cd orchestra-plugin
cp .env.example .env
# .envファイルにGitHubトークン（必須）とオプションのサービストークンを設定
```

### 2. インストール

```bash
./setup.sh
```

これだけです！セットアップスクリプトがすべて自動でインストールします。

### 3. Claude Codeに追加

すべてのエージェント、フック、連携機能を有効にするため、Claude Codeにこのプラグインを追加します：

**方法A: Claude Code UIを使用（推奨）**
1. Claude Codeを開く
2. 設定/環境設定を開く（Macは⌘+,、Windows/LinuxはCtrl+,）
3. 「Plugins」セクションに移動
4. 「Add Plugin」ボタンをクリック
5. `orchestra-plugin` ディレクトリを選択（クローンした場所のフルパス）
6. 「Save」または「Apply」をクリック
7. 必要に応じてClaude Codeを再起動

**方法B: 設定ファイルで追加**
1. Claude Code設定ファイルの場所を確認：
   - macOS/Linux: `~/.claude/config.json`
   - Windows: `%APPDATA%\Claude\config.json`
2. 設定ファイルにプラグインパスを追加：
```json
{
  "plugins": [
    {
      "path": "/absolute/path/to/orchestra-plugin"
    }
  ]
}
```
3. `/absolute/path/to/orchestra-plugin` を実際のフルパスに置き換える
4. ファイルを保存してClaude Codeを再起動

**インストール確認：**
- Claude Codeを開いて会話を開始
- 12人のエージェント（Alex、Riley、Skyeなど）が自動的に利用可能になっているはず
- `/browser` や `/screenshot` コマンドを試してスラッシュコマンドをテスト
- Git操作時にフックが自動実行されることを確認

### 4. コーディング開始

これまで通りClaude Codeを使用してください。Orchestra Pluginがすべてを自動的に強化します：

```
あなた: "アバターアップロード機能付きのユーザープロフィールページを追加して"

→ Alex（PM）がタスクを分解
→ Mina（フロントエンド）がUI実装を担当
→ Eden（QA）が品質を検証
→ Iris（セキュリティ）が脆弱性をチェック
→ マージ前フックがすべてを確認
→ 変更履歴とドキュメントが自動生成
```

## 自動的に動作する機能

### 品質ゲート（操作不要）

- **before_task.sh** - タスクの明確性を検証
- **before_pr.sh** - リント、型チェック、テスト、シークレットスキャン、SBOM生成
- **before_merge.sh** - E2Eテスト、パフォーマンスチェック
- **before_deploy.sh** - 環境変数検証、マイグレーションチェック
- **after_deploy.sh** - スモークテスト、通知送信

すべてのフックは、ツールがインストールされていない場合は自動的にスキップします。エラーなし、摩擦なし。

### あなたの開発チーム - 12人の専門エージェント

**コアチーム：**
- 👨‍💼 **Alex** 🎯 _"すべてをまとめます"_ - プロジェクトの指揮者。あいまいなリクエストを明確なタスクに変換し、適切な専門家にルーティング
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
orchestra-plugin/
├── agents/           # AIエージェント（Alex、Eden、Iris、Mina、Theoなど）
├── skills/           # 再利用可能な機能
├── hooks/            # 品質ゲートスクリプトと自動承認フック
├── mcp-servers/      # サービス連携（GitHub、Vercel、Browserなど）
└── .claude/
    └── commands/     # スラッシュコマンド（/browser、/screenshot）
```

## 高度な使い方

### カスタムスラッシュコマンド

[orchestra-plugin/.claude/commands/](orchestra-plugin/.claude/commands/) で利用可能なコマンド：
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

フックは [hooks/](orchestra-plugin/hooks/) にあり、完全にカスタマイズ可能です。各フック：
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

**場所:** [`orchestra-plugin/hooks/user-prompt-submit.sh`](orchestra-plugin/hooks/user-prompt-submit.sh)

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

- 📖 [完全なドキュメント](orchestra-plugin/)
- 🐛 [問題を報告](https://github.com/tstomtimes/orchestra-plugin/issues)
- 💬 [ディスカッション](https://github.com/tstomtimes/orchestra-plugin/discussions)

---

**Claude Code用に構築** - AI支援開発をより強力に、自律的に、楽しく。
