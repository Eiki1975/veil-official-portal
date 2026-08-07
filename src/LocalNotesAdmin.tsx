import { useEffect, useMemo, useState } from "react";

type DraftCover = { filename?: string; source?: string; alt: string; preview?: string };
type NoteDraft = {
  id: string;
  sourcePublishedId?: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  body: string;
  cover?: DraftCover;
};
type PublishedNote = Omit<NoteDraft, "cover" | "sourcePublishedId"> & { cover?: { src: string; alt: string } };
type Candidate = { candidateId: string; previewUrl: string; createdAt: string };

const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const currentDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
const blankNote = (): NoteDraft => ({
  id: `note-draft-${crypto.randomUUID()}`,
  slug: "",
  title: "",
  summary: "",
  category: "",
  publishedAt: currentDate(),
  updatedAt: currentDate(),
  readingMinutes: 5,
  body: "",
});

async function asDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

export function LocalNotesAdmin() {
  const [notes, setNotes] = useState<NoteDraft[]>([]);
  const [published, setPublished] = useState<PublishedNote[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("読み込み中です…");
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const selected = useMemo(() => notes.find((note) => note.id === selectedId) || null, [notes, selectedId]);

  useEffect(() => {
    if (!isLocal) return;
    Promise.all([
      fetch("/__veil-admin/notes/drafts").then(async (response) => {
        const data = await response.json() as { notes?: NoteDraft[]; error?: string };
        if (!response.ok) throw new Error(data.error || "下書きを読み込めませんでした。");
        return data.notes || [];
      }),
      fetch("/__veil-admin/notes/published").then(async (response) => {
        const data = await response.json() as { notes?: PublishedNote[]; error?: string };
        if (!response.ok) throw new Error(data.error || "公開済みNOTEを読み込めませんでした。");
        return data.notes || [];
      }),
    ]).then(([drafts, publishedNotes]) => {
      setNotes(drafts);
      setPublished(publishedNotes);
      setSelectedId(drafts[0]?.id || "");
      setNotice("下書きと公開候補はこのMac内だけに保存します。公開サイトは変更しません。");
    }).catch((error: Error) => setNotice(error.message));
  }, []);

  const persist = async (next = notes, message = "下書きを保存しました。") => {
    setBusy(true);
    try {
      const response = await fetch("/__veil-admin/notes/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: next }),
      });
      const data = await response.json() as { notes?: NoteDraft[]; error?: string };
      if (!response.ok) throw new Error(data.error || "保存に失敗しました。");
      setNotes(data.notes || next);
      setNotice(message);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存に失敗しました。");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const change = (patch: Partial<NoteDraft>) => {
    if (!selected) return;
    setNotes((current) => current.map((note) => note.id === selected.id ? { ...note, ...patch } : note));
  };

  const add = () => {
    const note = blankNote();
    setNotes((current) => [...current, note]);
    setSelectedId(note.id);
    setNotice("新しいNOTEの下書きを作りました。まずは公開に必要な項目を入力してください。");
  };

  const copyPublished = (note: PublishedNote) => {
    const existing = notes.find((entry) => entry.sourcePublishedId === note.id);
    if (existing) {
      setSelectedId(existing.id);
      setNotice("このNOTEの編集用コピーを開きました。公開済みの正本は変更していません。");
      return;
    }
    const copy: NoteDraft = {
      id: `note-draft-${crypto.randomUUID()}`,
      sourcePublishedId: note.id,
      slug: note.slug,
      title: note.title,
      summary: note.summary,
      category: note.category,
      publishedAt: note.publishedAt,
      updatedAt: currentDate(),
      readingMinutes: note.readingMinutes,
      body: note.body,
      ...(note.cover ? { cover: { source: note.cover.src, alt: note.cover.alt, preview: note.cover.src } } : {}),
    };
    setNotes((current) => [...current, copy]);
    setSelectedId(copy.id);
    setNotice("公開済みNOTEを編集用コピーとして開きました。候補を作ってもインターネット公開はされません。");
  };

  const uploadCover = async (file: File | undefined) => {
    if (!selected || !file) return;
    setBusy(true);
    try {
      const response = await fetch("/__veil-admin/notes/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, dataUrl: await asDataUrl(file) }),
      });
      const data = await response.json() as { cover?: DraftCover; error?: string };
      if (!response.ok || !data.cover) throw new Error(data.error || "カバー画像を追加できませんでした。");
      change({ cover: { ...data.cover, alt: selected.cover?.alt || "" } });
      setNotice("カバー画像を下書きに保存しました。説明文（ALT）も入力してください。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "カバー画像を追加できませんでした。");
    } finally {
      setBusy(false);
    }
  };

  const createCandidate = async () => {
    if (!selected || !(await persist(notes, "下書きを保存し、公開候補を作っています…"))) return;
    setBusy(true);
    try {
      const response = await fetch("/__veil-admin/notes/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: selected.id }),
      });
      const data = await response.json() as { candidate?: Candidate; error?: string };
      if (!response.ok || !data.candidate) throw new Error(data.error || "公開候補を作れませんでした。");
      setCandidates((current) => ({ ...current, [selected.id]: data.candidate! }));
      setNotice("公開候補とローカルプレビューを作りました。公開サイトはまだ変更していません。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "公開候補を作れませんでした。");
    } finally {
      setBusy(false);
    }
  };

  if (!isLocal) return <main className="admin-closed"><p className="eyebrow">VEIL LOCAL EDITOR</p><h1>この編集画面はMac内だけで開けます。</h1><p>公開サイトからNOTEの下書きや公開候補は編集できません。</p></main>;

  const candidate = selected ? candidates[selected.id] : undefined;
  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">VEIL / LOCAL EDITOR</p><h1>NOTEを管理する</h1><p>下書き → 公開候補 → 内容確認 → 別途の公開承認、の順で進めます。</p></div><a href="/admin" className="admin-site-link">物語を管理する</a></header>
    <section className="admin-workspace">
      <aside className="admin-list">
        <button type="button" className="admin-new" onClick={add}>＋ 新しいNOTEを作る</button>
        <p className="admin-list-label">下書き</p>
        {notes.length ? notes.map((note) => <button type="button" className={`admin-story-row ${note.id === selectedId ? "is-active" : ""}`} key={note.id} onClick={() => setSelectedId(note.id)}><strong>{note.title || "無題のNOTE"}</strong><span>{note.slug ? `/notes/${note.slug}/` : "URL未設定"}</span></button>) : <p className="admin-empty">まだ下書きはありません。</p>}
        <p className="admin-list-label">公開済みNOTE</p>
        {published.map((note) => <article className="admin-published-row" key={note.id}><strong>{note.title}</strong><span>/notes/{note.slug}/</span><button type="button" onClick={() => copyPublished(note)}>編集用コピーを作る</button></article>)}
      </aside>
      <section className="admin-editor">
        {!selected ? <div className="admin-blank"><h2>NOTEを選ぶ</h2><p>左の「新しいNOTEを作る」から始めてください。</p></div> : <>
          <div className="admin-notice">{notice}</div>
          <div className="admin-format"><span>公開候補の形式</span><strong>URL / タイトル / 検索用要約 / カテゴリ / 日付 / 読了目安 / 本文 / カバーALT</strong><small>候補は既存の静的NOTE生成と同じ形式で作り、公開済みデータには混ぜません。</small></div>
          <label className="admin-field">公開URL<input value={selected.slug} placeholder="例：behind-the-song" onChange={(event) => change({ slug: event.target.value.toLowerCase() })} /><small className="admin-help">https://veil-archive.com/notes/{selected.slug || "..."}/</small></label>
          <label className="admin-field">タイトル<input value={selected.title} placeholder="記事のタイトル" onChange={(event) => change({ title: event.target.value })} /></label>
          <label className="admin-field">検索用要約（20文字以上）<textarea rows={3} value={selected.summary} placeholder="検索結果やSNSカードで、この記事の内容が分かる説明文です。" onChange={(event) => change({ summary: event.target.value })} /></label>
          <div className="admin-meta-grid admin-note-meta-grid">
            <label>カテゴリ<input value={selected.category} placeholder="例：転換点" onChange={(event) => change({ category: event.target.value })} /></label>
            <label>公開日<input type="date" value={selected.publishedAt} onChange={(event) => change({ publishedAt: event.target.value })} /></label>
            <label>更新日<input type="date" value={selected.updatedAt} onChange={(event) => change({ updatedAt: event.target.value })} /></label>
            <label>読了目安（分）<input type="number" min="1" max="99" value={selected.readingMinutes} onChange={(event) => change({ readingMinutes: Number(event.target.value) || 1 })} /></label>
          </div>
          <label className="admin-field">本文<textarea rows={22} value={selected.body} placeholder={'段落は空行で区切ります。\n## 見出し\n### 小見出し\n- 箇条書き'} onChange={(event) => change({ body: event.target.value })} /></label>
          <section className="admin-images admin-note-cover"><header><div><p className="eyebrow">OPTIONAL COVER</p><h2>カバー画像</h2><p>カバーを使う場合は、画像と説明文（ALT）をセットで保存します。</p></div><label className="admin-upload">画像を追加<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void uploadCover(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label></header>
            {selected.cover ? <article className="admin-image-card"><img src={selected.cover.preview || selected.cover.source || ""} alt="カバー画像のプレビュー" /><div><p className="admin-image-index">COVER IMAGE</p><label>カバー画像の説明文（ALT）<input value={selected.cover.alt} placeholder="画像の内容を簡潔に説明します" onChange={(event) => change({ cover: { ...selected.cover!, alt: event.target.value } })} /></label><p className="admin-image-source">この画像は公開候補の確認にだけ使われます。候補を作っても公開サイトには反映されません。</p></div></article> : <p className="admin-empty">カバー画像は任意です。使う場合だけ追加してください。</p>}
          </section>
          <footer className="admin-actions"><button type="button" className="admin-save" onClick={() => { void persist(); }} disabled={busy}>下書きを保存</button><button type="button" className="admin-publish" onClick={() => { void createCandidate(); }} disabled={busy}>公開候補を作る</button>{candidate && <a className="admin-preview-link" href={candidate.previewUrl} target="_blank" rel="noreferrer">公開候補を確認する ↗</a>}<p>「公開候補を作る」は、ローカル確認用のHTMLを作るだけです。GitHub・Cloudflare・公開サイトには送信しません。</p></footer>
        </>}
      </section>
    </section>
  </main>;
}
