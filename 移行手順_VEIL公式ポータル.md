# VEIL公式ポータル プロジェクト丸ごと移行手順

## 方針

この移行は、サイトに必要な最低限のファイルだけではなく、`NotWork` プロジェクトフォルダ自体を新しいMacへ移す前提です。
新しいMac側に同じ作業フォルダがない場合は、このパッケージを展開して `NotWork` フォルダを作成してください。

## このパッケージに含めるもの

- `.git/`: Git管理情報
- `.gitignore`: ローカル生成物をGit管理から外す設定
- `src/`: サイト本体のReact/TypeScriptコード
- `public/`: 公開画像、robots.txt、sitemap.xml
- `dist/`: 直近の本番ビルド結果
- `drive_refs/`: Google Driveから一時取得した参照ビジュアル画像
- `index.html`: SEO/OGPを含むHTML入口
- `package.json`: 起動・ビルド設定
- `pnpm-lock.yaml`: 依存関係の固定情報
- `pnpm-workspace.yaml`: pnpm設定
- `tsconfig.json`: TypeScript設定
- `vite.config.ts`: Vite設定
- `移行手順_VEIL公式ポータル.md`: この手順書

## 含めないもの

- `node_modules/`: 移行先Macで入れ直します
- `.pnpm-store/`: 移行先Macで再作成されます
- 古い移行用 `.tgz`: 重複を避けるため含めません

## 新しいMacでの復元手順

1. このアーカイブを新しいMacへ移動します。
2. 作業場所に展開します。例: `~/Documents`

```bash
cd ~/Documents
tar -xzf VEIL公式ポータル_プロジェクト丸ごと移行_20260711.tgz
cd NotWork
```

3. 依存関係を入れます。

```bash
pnpm install
```

4. 開発表示を確認します。

```bash
pnpm run dev
```

5. 本番ビルドを確認します。

```bash
pnpm run build
```

## 公開前に変更する場所

実ドメインが決まったら、`src/data/veilContent.ts` の `siteUrl` を本番URLに変更してください。
これにより、OGP、JSON-LD、sitemap向けのURLも本番向けに揃えられます。

## 旧Mac側の削除について

新しいMacで `pnpm install`、`pnpm run build`、ブラウザ表示、画像表示を確認してから、旧Mac側の `/Users/eiki/Documents/NotWork` を削除してください。
確認前に削除すると、生成画像やサイト修正内容を失う可能性があります。
