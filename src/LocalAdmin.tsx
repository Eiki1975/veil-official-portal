import { useEffect, useMemo, useState } from "react";

type MemberOption = { slug: string; name: string; nameEn: string };
type StoryImage = { id: string; filename: string; alt: string; caption: string; preview?: string };
type StoryDraft = { id: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: StoryImage[]; updatedAt: string };

const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const draftId = () => `story-${crypto.randomUUID()}`;
const newStory = (memberSlug: string): StoryDraft => ({ id: draftId(), memberSlug, season: 1, episode: 1, title: "", body: "", images: [], updatedAt: new Date().toISOString() });
const previewUrl = (image: StoryImage) => image.preview || `/__veil-admin/media/${image.filename}`;

async function asDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("画像を読み込めませんでした。")); reader.readAsDataURL(file); });
}

export function LocalAdmin({ members }: { members: MemberOption[] }) {
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
      setNotice("このMacだけに下書きを保存します。");
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
    } catch (error) { setNotice(error instanceof Error ? error.message : "保存に失敗しました。"); return null; } finally { setBusy(false); }
  };

  const changeSelected = (patch: Partial<StoryDraft>) => {
    if (!selected) return;
    setStories((current) => current.map((story) => story.id === selected.id ? { ...story, ...patch, updatedAt: new Date().toISOString() } : story));
  };

  const addStory = () => {
    const story = newStory(members[0]?.slug || "reina-amamiya");
    const next = [...stories, story]; setStories(next); setSelectedId(story.id); setNotice("新しい下書きを作りました。タイトルと本文を入力してください。");
  };

  const uploadImages = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    setBusy(true);
    try {
      const added: StoryImage[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await asDataUrl(file);
        const response = await fetch("/__veil-admin/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, dataUrl }) });
        const data = await response.json() as { image?: StoryImage; error?: string };
        if (!response.ok || !data.image) throw new Error(data.error || "画像を追加できませんでした。");
        added.push(data.image);
      }
      changeSelected({ images: [...selected.images, ...added] });
      setNotice(`${added.length}枚の画像を追加しました。矢印で順番を変えられます。`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "画像を追加できませんでした。"); } finally { setBusy(false); }
  };

  const moveImage = (index: number, delta: number) => {
    if (!selected) return;
    const nextIndex = index + delta; if (nextIndex < 0 || nextIndex >= selected.images.length) return;
    const images = [...selected.images]; [images[index], images[nextIndex]] = [images[nextIndex], images[index]]; changeSelected({ images });
  };

  const updateImage = (index: number, patch: Partial<StoryImage>) => { if (!selected) return; const images = selected.images.map((image, current) => current === index ? { ...image, ...patch } : image); changeSelected({ images }); };
  const detachImage = (index: number) => { if (!selected) return; changeSelected({ images: selected.images.filter((_, current) => current !== index) }); setNotice("記事から外しました。元の画像ファイルはMac内に残しています。"); };

  const publish = async () => {
    if (!selected) return;
    const saved = await persist(stories, "下書きを保存し、公開用データを準備しています…");
    if (!saved) return;
    setBusy(true);
    try {
      const response = await fetch("/__veil-admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyId: selected.id }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "公開用データを更新できませんでした。");
      setNotice("公開用データを更新しました。まだインターネットには公開されていません。確認後にサイト公開を行ってください。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "公開用データを更新できませんでした。"); } finally { setBusy(false); }
  };

  if (!isLocal) return <main className="admin-closed"><p className="eyebrow">VEIL LOCAL EDITOR</p><h1>この編集画面はMac内だけで開けます。</h1><p>公開サイトからは原稿や画像を編集できません。</p></main>;

  return <main className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">VEIL / LOCAL EDITOR</p><h1>物語を追加する</h1><p>ここへ入れた下書きは、このMacだけに保存されます。</p></div><a href="/" className="admin-site-link">公開サイトを見る</a></header>
    <section className="admin-workspace">
      <aside className="admin-list"><button className="admin-new" onClick={addStory}>＋ 新しい話を作る</button><p className="admin-list-label">下書き</p>{stories.length === 0 && <p className="admin-empty">まだ下書きはありません。</p>}{stories.map((story) => { const member = members.find((entry) => entry.slug === story.memberSlug); return <button key={story.id} className={`admin-story-row ${story.id === selectedId ? "is-active" : ""}`} onClick={() => setSelectedId(story.id)}><small>SEASON {String(story.season).padStart(2, "0")} / EPISODE {String(story.episode).padStart(2, "0")}</small><strong>{story.title || "無題の記録"}</strong><span>{member?.name || "人物未設定"}</span></button>; })}</aside>
      <section className="admin-editor" aria-live="polite">{!selected ? <div className="admin-blank"><h2>新しい話を作る</h2><p>左のボタンから、タイトル・本文・画像を順番に入れられます。</p></div> : <>
        <div className="admin-notice">{notice}</div>
        <div className="admin-format"><span>{`SEASON ${String(selected.season).padStart(2, "0")} — ${selectedMember?.nameEn || "VEIL"}`}</span><strong>{`第${String(selected.episode).padStart(2, "0")}話`}</strong><small>公開ページでは、この形式でタイトルの上に自動表示されます。</small></div>
        <div className="admin-meta-grid"><label>人物<select value={selected.memberSlug} onChange={(event) => changeSelected({ memberSlug: event.target.value })}>{members.map((member) => <option key={member.slug} value={member.slug}>{member.name}</option>)}</select></label><label>シーズン<input type="number" min="1" max="99" value={selected.season} onChange={(event) => changeSelected({ season: Number(event.target.value) || 1 })} /></label><label>話数<input type="number" min="1" max="99" value={selected.episode} onChange={(event) => changeSelected({ episode: Number(event.target.value) || 1 })} /></label></div>
        <label className="admin-field">タイトル<input value={selected.title} placeholder="例：眠れない部屋" onChange={(event) => changeSelected({ title: event.target.value })} /></label>
        <label className="admin-field">本文<textarea rows={18} value={selected.body} placeholder="ここに本文をそのまま貼り付けます。段落は空行で分けられます。" onChange={(event) => changeSelected({ body: event.target.value })} /></label>
        <section className="admin-images"><header><div><p className="eyebrow">VISUAL RECORDS</p><h2>画像</h2><p>入れた順に上から並びます。公開前なら、いつでも順番を変えられます。</p></div><label className="admin-upload">画像を追加<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = ""; }} /></label></header><div className="admin-image-list">{selected.images.length === 0 && <p className="admin-empty">まだ画像はありません。</p>}{selected.images.map((image, index) => <article className="admin-image-card" key={image.id}><img src={previewUrl(image)} alt="追加した画像のプレビュー" /><div><p className="admin-image-index">IMAGE {String(index + 1).padStart(2, "0")}</p><div className="admin-image-actions"><button onClick={() => moveImage(index, -1)} disabled={index === 0}>↑ 上へ</button><button onClick={() => moveImage(index, 1)} disabled={index === selected.images.length - 1}>↓ 下へ</button><button className="admin-detach" onClick={() => detachImage(index)}>記事から外す</button></div><label>画像の説明<input value={image.alt} placeholder="例：窓際に座る雨宮玲奈" onChange={(event) => updateImage(index, { alt: event.target.value })} /></label><label>記録ラベル（任意）<input value={image.caption} placeholder="例：RECORD 03 — 18:42" onChange={(event) => updateImage(index, { caption: event.target.value })} /></label></div></article>)}</div></section>
        <footer className="admin-actions"><button className="admin-save" onClick={() => { void persist(stories); }} disabled={busy}>下書きを保存</button><button className="admin-publish" onClick={() => { void publish(); }} disabled={busy}>公開用に反映する</button><p>「公開用に反映」はMac内の公開サイト用ファイルを更新するだけです。インターネットへ公開する操作は別です。</p></footer>
      </>}</section>
    </section>
  </main>;
}
