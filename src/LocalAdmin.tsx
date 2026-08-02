import { useEffect, useMemo, useState } from "react";

type MemberOption = { slug: string; name: string; nameEn: string };
type StoryImage = { id: string; filename?: string; source?: string; alt: string; caption: string; preview?: string };
type StoryDraft = { id: string; sourceStoryId?: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: StoryImage[]; updatedAt: string };
type PublishedStory = { id: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: Array<{ id: string; image: string; alt: string; caption: string }>; updatedAt: string };
type PublishedStorySummary = Omit<PublishedStory, "body" | "images"> & { contentUrl: string };

const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const draftId = () => `story-${crypto.randomUUID()}`;
const newStory = (memberSlug: string): StoryDraft => ({ id: draftId(), memberSlug, season: 1, episode: 1, title: "", body: "", images: [], updatedAt: new Date().toISOString() });
const copyPublishedStory = (story: PublishedStory): StoryDraft => ({
  id: draftId(),
  sourceStoryId: story.id,
  memberSlug: story.memberSlug,
  season: story.season,
  episode: story.episode,
  title: story.title,
  body: story.body,
  images: story.images.map((image) => ({ id: image.id, source: image.image, alt: image.alt, caption: image.caption })),
  updatedAt: new Date().toISOString(),
});
const previewUrl = (image: StoryImage) => image.preview || image.source || (image.filename ? `/__veil-admin/media/${image.filename}` : "");

const isPublishedStory = (value: unknown, summary: PublishedStorySummary): value is PublishedStory => {
  if (!value || typeof value !== "object") return false;
  const story = value as Partial<PublishedStory>;
  return story.id === summary.id
    && story.memberSlug === summary.memberSlug
    && story.season === summary.season
    && story.episode === summary.episode
    && story.title === summary.title
    && typeof story.body === "string"
    && Array.isArray(story.images);
};

async function asDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

export function LocalAdmin({ members, publishedStories }: { members: MemberOption[]; publishedStories: PublishedStorySummary[] }) {
  const [stories, setStories] = useState<StoryDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [notice, setNotice] = useState("読み込み中です…");
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => stories.find((story) => story.id === selectedId) || null, [stories, selectedId]);
  const selectedMember = members.find((member) => member.slug === selected?.memberSlug) || members[0];

  useEffect(() => {
    if (!isLocal) return;
    fetch("/__veil-admin/drafts").then(async (response) => {
      const data = await response.json() as { stories?: StoryDraft[]; error?: string };
      if (!response.ok) throw new Error(data.error || "下書きを読み込めませんでした。");
      setStories(data.stories || []);
      setSelectedId(data.stories?.[0]?.id || "");
      setNotice("このMacだけに下書きと編集履歴を保存します。");
    }).catch((error: Error) => setNotice(error.message));
  }, []);

  const persist = async (next: StoryDraft[], message = "下書きを保存しました。") => {
    setBusy(true);
    try {
      const response = await fetch("/__veil-admin/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stories: next }) });
      const data = await response.json() as { stories?: StoryDraft[]; error?: string };
      if (!response.ok) throw new Error(data.error || "保存に失敗しました。");
      setStories(data.stories || next);
      setNotice(message);
      return data.stories || next;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存に失敗しました。");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const changeSelected = (patch: Partial<StoryDraft>) => {
    if (!selected) return;
    setStories((current) => current.map((story) => story.id === selected.id ? { ...story, ...patch, updatedAt: new Date().toISOString() } : story));
  };

  const addStory = () => {
    const story = newStory(members[0]?.slug || "reina-amamiya");
    const next = [...stories, story];
    setStories(next);
    setSelectedId(story.id);
    setNotice("新しい下書きを作りました。タイトルと本文を入力してください。");
  };

  const openPublishedForEditing = async (published: PublishedStorySummary) => {
    const existing = stories.find((story) => story.sourceStoryId === published.id);
    if (existing) {
      setSelectedId(existing.id);
      setNotice("この記録の編集用コピーを開きました。元の正本ファイルは変更しません。");
      return;
    }
    setBusy(true);
    setNotice("公開済みの記録を開いています…");
    try {
      const response = await fetch(published.contentUrl);
      if (!response.ok) throw new Error("公開済みの本文を読み込めませんでした。");
      const content: unknown = await response.json();
      if (!isPublishedStory(content, published)) throw new Error("公開済みの本文データを確認できませんでした。");
      const copied = copyPublishedStory(content);
      const next = [...stories, copied];
      setStories(next);
      setSelectedId(copied.id);
      await persist(next, "公開済みの記録を編集用コピーとして開きました。元の正本ファイルは変更しません。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "公開済みの記録を開けませんでした。");
    } finally {
      setBusy(false);
    }
  };

  const storeImage = async (file: File) => {
    const dataUrl = await asDataUrl(file);
    const response = await fetch("/__veil-admin/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, dataUrl }) });
    const data = await response.json() as { image?: StoryImage; error?: string };
    if (!response.ok || !data.image) throw new Error(data.error || "画像を追加できませんでした。");
    return data.image;
  };

  const uploadImages = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    setBusy(true);
    try {
      const added: StoryImage[] = [];
      for (const file of Array.from(files)) added.push(await storeImage(file));
      changeSelected({ images: [...selected.images, ...added] });
      setNotice(`${added.length}枚の画像を追加しました。矢印で順番を変えられます。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "画像を追加できませんでした。");
    } finally {
      setBusy(false);
    }
  };

  const replaceImage = async (index: number, file: File | undefined) => {
    if (!selected || !file) return;
    setBusy(true);
    try {
      const replacement = await storeImage(file);
      const images = selected.images.map((image, current) => current === index ? { ...replacement, alt: image.alt, caption: image.caption } : image);
      changeSelected({ images });
      setNotice(`IMAGE ${String(index + 1).padStart(2, "0")} を差し替えました。下書きを保存してから公開用に反映してください。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "画像を差し替えられませんでした。");
    } finally {
      setBusy(false);
    }
  };

  const moveImage = (index: number, delta: number) => {
    if (!selected) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= selected.images.length) return;
    const images = [...selected.images];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    changeSelected({ images });
  };

  const updateImage = (index: number, patch: Partial<StoryImage>) => {
    if (!selected) return;
    const images = selected.images.map((image, current) => current === index ? { ...image, ...patch } : image);
    changeSelected({ images });
  };

  const detachImage = (index: number) => {
    if (!selected) return;
    changeSelected({ images: selected.images.filter((_, current) => current !== index) });
    setNotice("記事から外しました。元の画像ファイルはMac内に残しています。");
  };

  const publish = async () => {
    if (!selected) return;
    const saved = await persist(stories, "下書きを保存し、公開用データを準備しています…");
    if (!saved) return;
    setBusy(true);
    try {
      const response = await fetch("/__veil-admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyId: selected.id }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "公開用データを更新できませんでした。");
      setNotice("公開用データと編集履歴を更新しました。まだインターネットには公開されていません。確認後にサイト公開を行ってください。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "公開用データを更新できませんでした。");
    } finally {
      setBusy(false);
    }
  };

  if (!isLocal) return <main className="admin-closed"><p className="eyebrow">VEIL LOCAL EDITOR</p><h1>この編集画面はMac内だけで開けます。</h1><p>公開サイトからは原稿や画像を編集できません。</p></main>;

  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">VEIL / LOCAL EDITOR</p><h1>物語を管理する</h1><p>公開済みの記事も、正本を残したまま編集用コピーとして開けます。</p></div><a href="/" className="admin-site-link">公開サイトを見る</a></header>
    <section className="admin-workspace">
      <aside className="admin-list">
        <button className="admin-new" onClick={addStory}>＋ 新しい話を作る</button>
        <p className="admin-list-label">公開済みの記録</p>
        {publishedStories.length === 0 && <p className="admin-empty">まだ公開済みの記録はありません。</p>}
        {publishedStories.map((story) => {
          const member = members.find((entry) => entry.slug === story.memberSlug);
          const existing = stories.find((draft) => draft.sourceStoryId === story.id);
          return <article className="admin-published-row" key={story.id}><small>SEASON {String(story.season).padStart(2, "0")} / EPISODE {String(story.episode).padStart(2, "0")}</small><strong>{story.title}</strong><span>{member?.name || "人物未設定"}</span><button onClick={() => { void openPublishedForEditing(story); }} disabled={busy}>{existing ? "編集用コピーを開く" : "編集する"}</button></article>;
        })}
        <p className="admin-list-label">下書き</p>
        {stories.length === 0 && <p className="admin-empty">まだ下書きはありません。</p>}
        {stories.map((story) => {
          const member = members.find((entry) => entry.slug === story.memberSlug);
          return <button key={story.id} className={`admin-story-row ${story.id === selectedId ? "is-active" : ""}`} onClick={() => setSelectedId(story.id)}><small>SEASON {String(story.season).padStart(2, "0")} / EPISODE {String(story.episode).padStart(2, "0")}</small><strong>{story.title || "無題の記録"}</strong><span>{member?.name || "人物未設定"}{story.sourceStoryId ? " / 編集用コピー" : ""}</span></button>;
        })}
      </aside>
      <section className="admin-editor" aria-live="polite">{!selected ? <div className="admin-blank"><h2>記録を選ぶ</h2><p>左の「公開済みの記録」から編集したい記事を開くか、新しい話を作ってください。</p></div> : <>
        <div className="admin-notice">{notice}</div>
        {selected.sourceStoryId && <p className="admin-revision-note">これは公開済み記事の編集用コピーです。正本Markdownは上書きせず、「公開用に反映する」時に別の公開候補データとして更新します。</p>}
        <div className="admin-format"><span>{`SEASON ${String(selected.season).padStart(2, "0")} — ${selectedMember?.nameEn || "VEIL"}`}</span><strong>{`第${String(selected.episode).padStart(2, "0")}話`}</strong><small>公開ページでは、この形式でタイトルの上に自動表示されます。</small></div>
        <div className="admin-meta-grid"><label>人物<select value={selected.memberSlug} onChange={(event) => changeSelected({ memberSlug: event.target.value })}>{members.map((member) => <option key={member.slug} value={member.slug}>{member.name}</option>)}</select></label><label>シーズン<input type="number" min="1" max="99" value={selected.season} onChange={(event) => changeSelected({ season: Number(event.target.value) || 1 })} /></label><label>話数<input type="number" min="1" max="99" value={selected.episode} onChange={(event) => changeSelected({ episode: Number(event.target.value) || 1 })} /></label></div>
        <label className="admin-field">タイトル<input value={selected.title} placeholder="例：眠れない部屋" onChange={(event) => changeSelected({ title: event.target.value })} /></label>
        <label className="admin-field">本文<textarea rows={18} value={selected.body} placeholder="ここに本文をそのまま貼り付けます。段落は空行で分けられます。" onChange={(event) => changeSelected({ body: event.target.value })} /></label>
        <section className="admin-images"><header><div><p className="eyebrow">VISUAL RECORDS</p><h2>画像</h2><p>入れた順に、本文の流れへ自動で分散して表示されます。各画像は差し替え・上下移動・記事から外す操作ができます。</p></div><label className="admin-upload">画像を追加<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = ""; }} /></label></header><div className="admin-image-list">{selected.images.length === 0 && <p className="admin-empty">まだ画像はありません。</p>}{selected.images.map((image, index) => <article className="admin-image-card" key={image.id}><img src={previewUrl(image)} alt="追加した画像のプレビュー" /><div><p className="admin-image-index">IMAGE {String(index + 1).padStart(2, "0")}</p>{image.source && <p className="admin-image-source">現在の公開画像を参照中です。差し替えるまで元ファイルは変更しません。</p>}<div className="admin-image-actions"><button onClick={() => moveImage(index, -1)} disabled={index === 0 || busy}>↑ 上へ</button><button onClick={() => moveImage(index, 1)} disabled={index === selected.images.length - 1 || busy}>↓ 下へ</button><label className="admin-replace">画像を差し替える<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => { void replaceImage(index, event.target.files?.[0]); event.currentTarget.value = ""; }} /></label><button className="admin-detach" onClick={() => detachImage(index)} disabled={busy}>記事から外す</button></div><label>画像の説明<input value={image.alt} placeholder="例：窓際に座る雨宮玲奈" onChange={(event) => updateImage(index, { alt: event.target.value })} /></label><label>記録ラベル（任意）<input value={image.caption} placeholder="例：RECORD 03 — 18:42" onChange={(event) => updateImage(index, { caption: event.target.value })} /></label></div></article>)}</div></section>
        <footer className="admin-actions"><button className="admin-save" onClick={() => { void persist(stories); }} disabled={busy}>下書きを保存</button><button className="admin-publish" onClick={() => { void publish(); }} disabled={busy}>公開用に反映する</button><p>「公開用に反映」はMac内の公開候補データと履歴を更新するだけです。インターネットへ公開する操作は別です。</p></footer>
      </>}</section>
    </section>
  </main>;
}
