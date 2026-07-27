import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ExternalLink, Menu, X } from "lucide-react";
import { aboutParagraphs, archiveItems, galleryGroups, members, navItems, news, siteUrl, type GalleryItem, type Member } from "./data/veilContent";
import serialStoriesData from "./content/serial-stories.json";
import canonicalEpisode01Source from "./content/season-01-reina-episode-01-canonical-published-20260727.md?raw";
import { LocalAdmin } from "./LocalAdmin";
import prologue from "./content/prologue.md?raw";
import reinaStory from "./content/story-zero/reina.md?raw";
import mizukiStory from "./content/story-zero/mizuki.md?raw";
import hiyoriStory from "./content/story-zero/hiyori.md?raw";
import risaStory from "./content/story-zero/risa.md?raw";

const storyZero: Record<string, string> = {
  "reina-amamiya": reinaStory,
  "mizuki-kanzaki": mizukiStory,
  "hiyori-komiya": hiyoriStory,
  "risa-shiraishi": risaStory,
};

type SerialStoryImage = { id: string; alt: string; caption: string; image: string; after?: string; afterIndex?: number };
type SerialStory = { id: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: SerialStoryImage[]; updatedAt: string };
const canonicalEpisode01Body = canonicalEpisode01Source.split(/^## 本文\s*$/m)[1]?.trim() || "";
const canonicalEpisode01: SerialStory = {
  id: "season-01-reina-episode-01-canonical-20260727",
  memberSlug: "reina-amamiya",
  season: 1,
  episode: 1,
  title: "見られたあと",
  body: canonicalEpisode01Body,
  updatedAt: "2026-07-27",
  images: [
    { id: "ep01-01-ladder-hem", image: "/images/stories/season-01-reina/episode-01-illustrations-20260727/01-ladder-hem-v2-small-livehouse.png", alt: "小さなライブハウスの脚立に立ち、壁のテープへ手を伸ばす雨宮玲奈", caption: "ILLUSTRATION 01 / 見られたあと", after: "見られていると気づいたあとも、玲奈はスカートの裾を直さなかった。" },
    { id: "ep01-06-heels-off", image: "/images/stories/season-01-reina/episode-01-visual-records-20260727/06-heels-off-closeup-20260727.png", alt: "ヒールを手に持ち、肌色のストッキングの足で脚立へ上がる前の雨宮玲奈", caption: "VISUAL RECORD 06 / HEELS OFF", after: "ヒールを脱ぐと、急に背が低くなった気がした。" },
    { id: "ep01-02-unseen-gaze", image: "/images/stories/season-01-reina/episode-01-illustrations-20260727/02-unseen-gaze-v2-small-livehouse.png", alt: "小規模ライブハウスの暗がりを背に、壁のテープを剥がす雨宮玲奈", caption: "ILLUSTRATION 02 / 見えない視線", after: "見えないのに、まだ見られていると分かった。" },
    { id: "ep01-03-first-lie", image: "/images/stories/season-01-reina/episode-01-illustrations-20260727/03-first-lie-v2-small-livehouse.png", alt: "小さなライブハウスの機材脇で、スカートの裾を整える雨宮玲奈", caption: "ILLUSTRATION 03 / 最初の嘘", after: "ただ、赤くなった理由の全部ではなかった。" },
    { id: "ep01-04-closed-door", image: "/images/stories/season-01-reina/episode-01-illustrations-20260727/04-closed-door.png", alt: "閉じた楽屋の扉を見つめ、衣装を抱える雨宮玲奈", caption: "ILLUSTRATION 04 / 閉じた扉", after: "そのあとで、ほんの少しだけ失望した。" },
    { id: "ep01-07-self-confrontation", image: "/images/stories/season-01-reina/episode-01-visual-records-20260727/07-self-confrontation-20260727.png", alt: "楽屋で自分を睨むように正面を見つめる雨宮玲奈", caption: "VISUAL RECORD 07 / SELF CONFRONTATION", after: "その考えが浮かび、玲奈は自分の顔を睨んだ。" },
    { id: "ep01-08-exit-smile", image: "/images/stories/season-01-reina/episode-01-visual-records-20260727/08-exit-practiced-smile-20260727.png", alt: "小さなライブハウスの出口で、いつもの笑顔を戻す雨宮玲奈", caption: "VISUAL RECORD 08 / EXIT", after: "玲奈はいつもの笑顔で頭を下げた。" },
    { id: "ep01-05-night-turn", image: "/images/stories/season-01-reina/episode-01-illustrations-20260727/05-night-turn-v2-sheer-stockings.png", alt: "夜の小さなライブハウスの前で振り返る雨宮玲奈", caption: "ILLUSTRATION 05 / 振り返る", after: "あの男が、もう一度自分を見るかどうかだった。" },
  ],
};
const storedSerialStories = serialStoriesData as SerialStory[];
const canonicalEpisode01Revision = storedSerialStories.find((story) => story.id === canonicalEpisode01.id);
const serialStories = [canonicalEpisode01Revision || canonicalEpisode01, ...storedSerialStories.filter((story) => story.id !== canonicalEpisode01.id)];
const firstPublishedStoryByMember = new Map<string, SerialStory>();
serialStories
  .slice()
  .sort((a, b) => a.season - b.season || a.episode - b.episode)
  .forEach((story) => {
    if (!firstPublishedStoryByMember.has(story.memberSlug)) firstPublishedStoryByMember.set(story.memberSlug, story);
  });
const galleryItems = galleryGroups.flatMap((group) => group.items);

const baseUrl = import.meta.env.BASE_URL;
const xUrl = import.meta.env.VITE_X_URL?.trim();
const assetUrl = (path: string) => `${baseUrl}${path.replace(/^\//, "")}`;
const routeUrl = (path: string) => `${baseUrl}${path.replace(/^\//, "")}`;

function routeFromLocation() {
  const forwardedPath = new URLSearchParams(location.search).get("path");
  if (forwardedPath?.startsWith("/")) {
    history.replaceState({}, "", routeUrl(forwardedPath));
  }
  const route = location.pathname.startsWith(baseUrl)
    ? location.pathname.slice(baseUrl.length)
    : location.pathname.replace(/^\//, "");
  return `/${route}`.replace(/\/+$/, "") || "/";
}

const track = (event: string, detail?: string) => {
  window.dispatchEvent(new CustomEvent("veil:analytics", { detail: { event, detail } }));
  if (import.meta.env.DEV) console.info("[VEIL analytics]", event, detail || "");
};

function Link({ href, children, className, event }: { href: string; children: React.ReactNode; className?: string; event?: string }) {
  const local = href.startsWith("/");
  return <a href={local ? routeUrl(href) : href} className={className} onClick={(e) => {
    if (event) track(event, href);
    if (local) {
      e.preventDefault();
      history.pushState({}, "", routeUrl(href));
      window.dispatchEvent(new PopStateEvent("popstate"));
      const hash = href.includes("#") ? href.split("#")[1] : "";
      window.setTimeout(() => hash ? document.getElementById(hash)?.scrollIntoView() : window.scrollTo(0, 0), 0);
    }
  }}>{children}</a>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Link href="/" className="brand"><strong>VEIL</strong><span>OFFICIAL SITE</span></Link>
    <nav className="desktop-nav" aria-label="メインナビゲーション">
      {navItems.map(n => <Link key={n} href={`/#${n.toLowerCase()}`}>{n}</Link>)}
    </nav>
    <button className="menu-button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}<span className="sr-only">メニュー</span></button>
    {open && <nav id="mobile-menu" className="mobile-nav">{navItems.map(n => <Link key={n} href={`/#${n.toLowerCase()}`} className="mobile-link">{n}</Link>)}</nav>}
  </header>;
}

function Footer() {
  return <footer className="footer">
    <div><p className="footer-logo">VEIL</p><p>Music, visuals and stories of four fictional women.</p></div>
    <nav><Link href="/legal/privacy">PRIVACY</Link><Link href="/legal/terms">TERMS</Link><Link href="/legal/adult-policy">18+ NOTICE</Link><Link href="/legal/contact">CONTACT</Link></nav>
    <p className="fine">VEILはAIを含む制作手法を活用した創作バンドプロジェクトです。登場人物は架空ですが、公開される作品は実際の創作物です。</p>
  </footer>;
}

function Shell({ children }: { children: React.ReactNode }) { return <><Header /><main>{children}</main><Footer /></>; }

function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return <header className="section-title">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{copy && <p>{copy}</p>}</header>;
}

function MembersGrid() {
  return <section className="section members-section" id="members"><SectionTitle eyebrow="THE FOUR" title="MEMBERS" copy="4人がVEILへ来るまで。" />
    <div className="member-grid">{members.map((m, i) => <article className="member-card" key={m.slug}>
      <Link href={`/members/${m.slug}`} event="member_card_click"><div className="member-image-wrap"><img src={assetUrl(m.image)} alt={m.alt} width="1200" height="1500" loading={i ? "lazy" : "eager"} /></div></Link>
      <div className="member-body"><p className="member-index">0{i + 1} / {m.role}</p><h3>{m.name}</h3><p className="member-en">{m.nameEn}</p><p>{m.intro}</p><Link className="text-link" href={`/members/${m.slug}`} event="story_zero_click">STORY ZERO <ArrowRight size={16} /></Link></div>
    </article>)}</div>
  </section>;
}

function GalleryDirectory({ id }: { id?: string }) {
  const files = members.map((member) => ({ member, count: galleryItems.filter((item) => item.subjects.includes(member.slug)).length }));
  return <section className="section gallery-directory" id={id}><SectionTitle eyebrow="INDEPENDENT OBSERVER / VISUAL FILE" title="MEMBER FILES" copy="日常の記録は、人物ごとのファイルに分けて残している。" />
    <div className="gallery-directory-grid">{files.map(({ member, count }, index) => <Link key={member.slug} href={`/gallery/${member.slug.split("-")[0]}`} className="gallery-directory-card" event="gallery_member_file_open"><span className="gallery-directory-index">FILE {String(index + 1).padStart(2, "0")}</span><div className="gallery-directory-portrait"><img src={assetUrl(member.portraitImage)} alt="" loading="lazy" /></div><span className="gallery-directory-name">{member.name}</span><span className="gallery-directory-meta">{member.nameEn} / {count} RECORDS <ArrowRight size={14} /></span></Link>)}</div>
  </section>;
}

function MemberGalleryPage({ member }: { member: Member }) {
  const [active, setActive] = useState<GalleryItem | null>(null);
  useEffect(() => { const close = (e: KeyboardEvent) => e.key === "Escape" && setActive(null); addEventListener("keydown", close); return () => removeEventListener("keydown", close); }, []);
  const items = galleryItems.filter((item) => item.subjects.includes(member.slug));
  return <Shell><section className="member-gallery-page"><header className="member-gallery-header"><p className="eyebrow">INDEPENDENT OBSERVER / MEMBER FILE</p><p className="member-gallery-index">{member.nameEn} / {String(items.length).padStart(2, "0")} RECORDS</p><h1>{member.name}</h1><p>彼女に紐づく日常の記録。複数人の記録は、それぞれのファイルから同じ一枚を参照する。</p></header><div className="member-gallery-grid">{items.map((item) => <button type="button" key={item.record} className="member-gallery-thumb" aria-label={`${item.record} ${item.title}を拡大`} onClick={() => { setActive(item); track("gallery_image_click", item.category); }}><img src={assetUrl(item.image)} alt={item.alt} loading="lazy" /><span><small>{item.record}</small><strong>{item.title}</strong></span></button>)}</div><Link className="member-gallery-back" href="/#gallery"><ArrowLeft size={16} /> MEMBER FILESへ戻る</Link></section>{active && <div className="lightbox gallery-lightbox" role="dialog" aria-modal="true" aria-label={active.alt} onClick={() => setActive(null)}><button aria-label="閉じる"><X /></button><img src={assetUrl(active.image)} alt={active.alt} /><aside><p>{active.record}</p><p>SUBJECT / {active.category}</p><blockquote>{active.caption}</blockquote></aside></div>}</Shell>;
}

function Home() {
  return <Shell>
    <section className="hero" id="top"><div className="hero-media"><img src={assetUrl("/images/veil-hero-band-v6-20260725.png")} alt="バンド写真として並ぶVEILの4人。中央に雨宮玲奈、神崎瑞希、小宮ひより、白石理沙" className="hero-image" /></div><div className="hero-scrim" /><div className="hero-content"><p className="hero-label">VEIL OFFICIAL SITE</p><h1>VEIL</h1><p className="hero-copy">音楽だけでは表せなかった、<br />言葉にならない欲望。</p><p className="hero-subcopy">音楽、ビジュアル、物語を通して、4人の女性を記録するバンドプロジェクト。</p><div className="hero-actions"><a className="button primary" href="#members">MEMBERS</a><Link className="button ghost" href="/about">ABOUT VEIL</Link></div></div><span className="scroll-mark">SCROLL</span></section>
    <MembersGrid />
    <section className="section" id="latest"><SectionTitle eyebrow="UPDATES" title="LATEST / NEWS" /><div className="news-list">{news.map(n => <article key={n.title}><time>{n.date}</time><span>{n.type}</span><h3>{n.title}</h3></article>)}</div></section>
    <GalleryDirectory id="gallery" />
    <section className="feature feature-formation" id="formation" style={{ backgroundImage: `url(${assetUrl("/images/veil-backstage.jpg")})` }}><div><p className="eyebrow">HOW VEIL BEGAN</p><h2>VEILが<br />始まるまで</h2><p>高瀬真紀が新しい女性バンドの募集を始め、4人を見つけ、集めた。これはVEILが成立するまでの物語。</p><Link className="button primary formation-cta" href="/story/formation" event="formation_click"><span>PROLOGUE</span>『最後の募集』を読む <ArrowRight size={18} /></Link></div></section>
    <section className="section" id="archive"><SectionTitle eyebrow="DOCUMENTS BEFORE THE FIRST NOTE" title="VEIL ARCHIVE" copy="結成前から残る記録。" /><ArchiveCards limit={3} /><Link className="text-link section-link" href="/archive">VIEW ARCHIVE <ArrowRight size={16} /></Link></section>
    <section className="section stories" id="stories"><SectionTitle eyebrow="FICTION" title="STORIES" copy="Story Zeroの先に続く、4人それぞれの物語。" /><div className="story-strip">{members.map(m => <Link key={m.slug} href={`/stories/${m.slug.split("-")[0]}`} event="adult_story_entry"><span>{m.name}</span><small>18+ / COMING SOON</small><ArrowRight /></Link>)}</div></section>
    <section className="feature about-preview" id="about"><div><p className="eyebrow">INDEPENDENT RECORD</p><h2>ABOUT VEIL</h2><p>{aboutParagraphs[0]}</p><p>{aboutParagraphs[1]}</p><Link className="button ghost" href="/about" event="about_full_click">全文を読む</Link></div></section>
    <section className="section two-column" id="music"><div><SectionTitle eyebrow="DISCOGRAPHY" title="MUSIC" /><p className="coming">COMING SOON</p><p>VEILの楽曲と、その背景にある物語をここに記録します。</p></div><div id="support"><SectionTitle eyebrow="KEEP THE RECORD GOING" title="SUPPORT" /><p>VEILの次の音楽、ビジュアル、物語の制作を支えるための導線です。支援サービスは準備中です。</p><button className="button disabled" onClick={() => track("support_click")}>SUPPORT — COMING SOON</button></div></section>
    <section className="section follow" id="follow"><SectionTitle eyebrow="FOLLOW THE RECORD" title="続きが気になる方へ" copy="新しい記録は、Xでお知らせします。" />{xUrl ? <a className="button primary follow-x" href={xUrl} target="_blank" rel="noreferrer" onClick={() => track("x_follow_click")}>Xで最新情報を見る <ExternalLink size={16} /></a> : <button className="button disabled follow-x" type="button">X — COMING SOON</button>}</section>
    <section className="adult-external"><div><p className="eyebrow">EXTERNAL 18+ CONTENT</p><h2>より奥の記録へ</h2><p className="coming">COMING SOON</p><p>成人向けコンテンツと外部サービスへの導線は現在準備中です。18歳未満の方は利用できません。</p></div></section>
  </Shell>;
}

function ArchiveCards({ limit }: { limit?: number }) {
  const [active, setActive] = useState<(typeof archiveItems)[number] | null>(null);
  return <><div className="archive-grid">{archiveItems.slice(0, limit).map(a => <article className="archive-card" key={a.id}>{a.image && <button className="archive-image" type="button" onClick={() => { setActive(a); track("archive_image_open", a.id); }}><img src={assetUrl(a.image)} alt={`${a.title}の資料画像を拡大`} loading="lazy" /><span>CLICK TO ENLARGE</span></button>}<div className="paper"><p className="doc-type">{a.type}</p><h3>{a.title}</h3><p>{a.body}</p><dl><div><dt>DATE</dt><dd>{a.date}</dd></div><div><dt>AUTHOR</dt><dd>{a.author}</dd></div><div><dt>RELATED</dt><dd>{a.related}</dd></div></dl></div></article>)}</div>{active?.image && <div className="lightbox" role="dialog" aria-modal="true" aria-label={active.title} onClick={() => setActive(null)}><button type="button" aria-label="閉じる"><X /></button><img src={assetUrl(active.image)} alt={active.title} /></div>}</>;
}

function PageHero({ eyebrow, title, copy, image }: { eyebrow: string; title: string; copy: string; image?: string }) { return <header className={`page-hero ${image ? "has-image" : ""}`}>{image && <img src={assetUrl(image)} alt="" />}<div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div></header>; }

function StoryText({ text, illustrations = [] }: { text: string; illustrations?: SerialStoryImage[] }) {
  let prologueTitleNext = false;
  return <><div className="story-content">{text.replace(/\f/g, "").split("\n").map((line, index) => {
    const value = line.trim();
    if (!value) return null;
    if (value === "PROLOGUE") { prologueTitleNext = true; return <p className="story-kicker" key={`${value}-${index}`}>{value}</p>; }
    if (prologueTitleNext) { prologueTitleNext = false; return <h2 className="story-document-title" key={`${value}-${index}`}>{value}</h2>; }
    if (value === "VEIL ストーリー0") return <p className="story-kicker" key={`${value}-${index}`}>{value}</p>;
    if (value.endsWith("編")) return <h2 className="story-document-title" key={`${value}-${index}`}>{value}</h2>;
    if (/^第[一二三四五六七八九十]+章/.test(value)) return <h3 key={`${value}-${index}`}>{value}</h3>;
    const inserted = illustrations.filter((image) => image.afterIndex === index || (image.afterIndex === undefined && image.after === value));
    return <Fragment key={`${value.slice(0, 16)}-${index}`}><p className="story-line">{value}</p>{inserted.map((image) => <figure className="serial-story-inline-image" id={`serial-image-${image.id}`} key={image.id}><img src={assetUrl(image.image)} alt={image.alt} loading="lazy" />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</Fragment>;
  })}</div>{illustrations.length > 0 && <MobileStoryVisualCue illustrations={illustrations} />}<ReadingBackToTop /></>;
}

function MobileStoryVisualCue({ illustrations }: { illustrations: SerialStoryImage[] }) {
  const [activeId, setActiveId] = useState(illustrations[0]?.id || "");
  const activeIndex = Math.max(0, illustrations.findIndex((image) => image.id === activeId));
  const active = illustrations[activeIndex] || illustrations[0];

  useEffect(() => {
    setActiveId(illustrations[0]?.id || "");
    if (!("IntersectionObserver" in window)) return;
    const figures = illustrations.map((image) => document.getElementById(`serial-image-${image.id}`)).filter((figure): figure is HTMLElement => Boolean(figure));
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current?.target.id.startsWith("serial-image-")) setActiveId(current.target.id.replace("serial-image-", ""));
    }, { rootMargin: "-28% 0px -48% 0px", threshold: [0, 0.25, 0.6] });
    figures.forEach((figure) => observer.observe(figure));
    return () => observer.disconnect();
  }, [illustrations]);

  if (!active) return null;
  return <button type="button" className="mobile-story-visual-cue" onClick={() => document.getElementById(`serial-image-${active.id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" })} aria-label={`本文中の画像 ${activeIndex + 1} を表示`}><img src={assetUrl(active.image)} alt="" /><span><small>{`VISUAL ${String(activeIndex + 1).padStart(2, "0")}`}</small><strong>{active.caption || "CURRENT RECORD"}</strong></span></button>;
}

function ReadingBackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 360);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);
  if (!visible) return null;
  return <button type="button" className="reading-top-control" aria-label="ページの先頭へ戻る" title="ページの先頭へ戻る" onClick={() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
    track("story_back_to_top");
  }}><ArrowUp size={16} aria-hidden="true" /><span aria-hidden="true">TOP</span></button>;
}

function FormationStoryChoices() {
  return <section className="formation-story-choices" aria-labelledby="formation-story-choices-title">
    <header><p className="eyebrow">CONTINUE WITH ONE OF THE FOUR</p><h2 id="formation-story-choices-title">4人の物語へ進む</h2><p>プロローグの前に、いま読める彼女たちの最初の記録へ。</p></header>
    <div className="formation-story-grid">
      {members.map((member, index) => {
        const story = firstPublishedStoryByMember.get(member.slug);
        const card = <><img src={assetUrl(member.image)} alt={member.alt} loading="lazy" /><div className="formation-story-card-copy"><div><p>{`0${index + 1} / ${member.role.toUpperCase()}`}</p><h3>{member.name}</h3><small>{member.nameEn}</small></div>{story ? <div className="formation-story-card-episode"><span>{`SEASON ${String(story.season).padStart(2, "0")} / EPISODE ${String(story.episode).padStart(2, "0")}`}</span><strong>{story.title}</strong><em>第1話を読む <ArrowRight size={15} /></em></div> : <div className="formation-story-card-coming"><span>STORY</span><strong>COMING SOON</strong><em>公開を待っています</em></div>}</div></>;
        if (!story) return <article className="formation-story-card is-coming" key={member.slug} aria-label={`${member.name}の物語は公開準備中です`}>{card}</article>;
        const href = `/stories/${member.slug.split("-")[0]}/season-${story.season}/episode-${story.episode}`;
        return <Link className="formation-story-card is-live" href={href} event="formation_story_continue" key={member.slug}>{card}</Link>;
      })}
    </div>
  </section>;
}

function MemberPage({ member }: { member: Member }) { return <Shell><PageHero eyebrow={`${member.nameEn} / ${member.role}`} title={member.name} copy="STORY ZERO — 彼女がVEILに来るまで" image={member.image} /><article className="prose page-section reading-page"><p className="status-chip">STORY ZERO / PUBLIC</p><h2>PROFILE</h2><section className="official-profile" aria-label={`${member.name}の公式プロフィール`}><p className="profile-catchcopy">{member.profile.catchcopy}</p><dl><div><dt>担当</dt><dd>{member.role}</dd></div><div><dt>年齢</dt><dd>{member.profile.age}</dd></div><div><dt>身長</dt><dd>{member.profile.height}</dd></div></dl><p>{member.profile.description}</p></section><StoryText text={storyZero[member.slug]} /><h2>RELATED RECORDS</h2><ArchiveCards limit={2} /><div className="next-links"><Link href="/story/formation"><ArrowLeft /> VEIL結成ストーリー</Link><Link href={`/stories/${member.slug.split("-")[0]}`} event="adult_story_entry">彼女の、さらに奥へ <ArrowRight /></Link></div></article></Shell>; }

function FormationPage() { return <Shell><PageHero eyebrow="FORMATION STORY" title="VEILが始まるまで" copy="高瀬真紀が一枚の募集告知を出し、4人の女性と出会うまでの記録。" image="/images/veil-backstage.jpg" /><article className="prose page-section reading-page"><p className="byline">高瀬真紀<br /><small>VEIL結成時の募集担当者</small></p><p>高瀬真紀は、VEIL結成へ向けた募集を始めた人物です。以下は、その募集が出されるまでを描くプロローグです。</p><FormationStoryChoices /><StoryText text={prologue} /><h2>THE FOUR APPLICATIONS</h2><div className="member-link-list">{members.map(m => <Link href={`/members/${m.slug}`} key={m.slug}>{m.name}<span>{m.role}</span><ArrowRight /></Link>)}</div><h2>RELATED ARCHIVE</h2><ArchiveCards /><div className="next-links"><Link href="/archive">VEIL ARCHIVE <ArrowRight /></Link></div></article></Shell>; }

function AboutPage() { return <Shell><PageHero eyebrow="INDEPENDENT RECORD" title="ABOUT VEIL" copy="音楽だけでは表せなかった彼女たちの姿を記録する場所。" /><article className="prose page-section"><p className="byline">記録者<br /><small>Independent Observer / Recorder</small></p><p>このサイトを記録する者は、レーベルやVEILの所有者ではありません。4人と彼女たちを取り巻く時間を、独立した立場から観察し、記録しています。</p>{aboutParagraphs.map((p, i) => <p key={i}>{p}</p>)}<Link className="button ghost" href="/story/formation">VEILが始まるまで</Link></article></Shell>; }

function ArchivePage() { return <Shell><PageHero eyebrow="OFFICIAL RECORDS" title="VEIL ARCHIVE" copy="募集告知、応募文、面談メモ。VEILが成立していく過程に残された記録。" /><div className="page-section"><ArchiveCards /><div className="next-links"><Link href="/story/formation">FORMATION STORY <ArrowRight /></Link><Link href="/#members">MEMBERS <ArrowRight /></Link></div></div></Shell>; }

function AdultStoryPage({ member }: { member: Member }) {
  const key = `veil-age-ok-${member.slug}`; const [ok, setOk] = useState(() => localStorage.getItem(key) === "yes");
  if (!ok) return <Shell><section className="age-gate"><p className="eyebrow">18+ CONTENT NOTICE</p><h1>この先の物語について</h1><p>この先の物語には、成人向けの表現が含まれます。18歳未満の方は閲覧できません。同意状態はこの端末内にのみ保存されます。</p><div><button className="button primary" onClick={() => { localStorage.setItem(key, "yes"); setOk(true); track("age_gate_accept", member.slug); }}>18歳以上です</button><button className="button ghost" onClick={() => { history.back(); track("age_gate_exit", member.slug); }}>戻る</button></div></section></Shell>;
  const releasedStories = serialStories.filter((story) => story.memberSlug === member.slug);
  if (releasedStories.length) return <Shell><PageHero eyebrow="ADULT STORY / SEASON 01" title={member.name} copy="彼女の、さらに奥へ。" image={member.image} /><article className="prose page-section"><p className="status-chip">18+ / FICTION / AI-ASSISTED ILLUSTRATIONS</p><p>登場人物は全員成人です。本文には成人向け表現を、挿絵にはAI生成画像を含みます。</p><div className="member-link-list">{releasedStories.map((story) => <Link href={`/stories/${member.slug.split("-")[0]}/season-${story.season}/episode-${story.episode}`} key={story.id}><span>{`SEASON ${String(story.season).padStart(2, "0")} / EPISODE ${String(story.episode).padStart(2, "0")}`}</span>{story.title}<ArrowRight /></Link>)}</div></article></Shell>;
  return <Shell><PageHero eyebrow="ADULT STORY / COMING SOON" title={member.name} copy="彼女の、さらに奥へ。" image={member.image} /><article className="prose page-section"><div className="coming-block">ADULT STORY<br /><strong>COMING SOON</strong><small>正式原稿および外部販売URLは未設定です</small></div><Link href={`/members/${member.slug}`} className="text-link"><ArrowLeft /> STORY ZEROへ戻る</Link></article></Shell>;
}

function StoryVisualReview({ story, member }: { story: SerialStory; member: Member }) {
  const [active, setActive] = useState<SerialStoryImage | null>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setActive(null);
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, []);
  return <section className="serial-story-review" aria-labelledby="story-visual-review-title"><header><p className="eyebrow">VISUAL INDEX / AFTER READING</p><h2 id="story-visual-review-title">この記録を見返す</h2><p>読み終えたあとに残った場面を、好きな順番でもう一度。</p></header><div className="serial-story-review-grid">{story.images.map((image, index) => <button type="button" key={image.id} onClick={() => setActive(image)} aria-label={`${image.caption || `画像 ${index + 1}`}を大きく見る`}><img src={assetUrl(image.image)} alt={image.alt || `${member.name}の記録画像 ${index + 1}`} loading="lazy" /><span><small>{`VISUAL ${String(index + 1).padStart(2, "0")}`}</small><strong>{image.caption || "RECORD"}</strong></span></button>)}</div>{active && <div className="lightbox serial-story-lightbox" role="dialog" aria-modal="true" aria-label={active.alt || "記録画像"} onClick={() => setActive(null)}><article onClick={(event) => event.stopPropagation()}><button type="button" aria-label="閉じる" onClick={() => setActive(null)}><X /></button><img src={assetUrl(active.image)} alt={active.alt || `${member.name}の記録画像`} /><p>{active.caption || "VISUAL RECORD"}</p></article></div>}</section>;
}

function SerialStoryPage({ story, member }: { story: SerialStory; member: Member }) {
  const key = `veil-age-ok-${member.slug}`;
  const [ok, setOk] = useState(() => localStorage.getItem(key) === "yes");
  if (!ok) return <Shell><section className="age-gate"><p className="eyebrow">18+ CONTENT NOTICE</p><h1>この先の物語について</h1><p>この先の物語には、成人向けの表現が含まれます。18歳未満の方は閲覧できません。同意状態はこの端末内にのみ保存されます。</p><div><button className="button primary" onClick={() => { localStorage.setItem(key, "yes"); setOk(true); track("age_gate_accept", member.slug); }}>18歳以上です</button><button className="button ghost" onClick={() => history.back()}>戻る</button></div></section></Shell>;
  return <Shell><article className="serial-story"><header className="serial-story-header"><p>SEASON {String(story.season).padStart(2, "0")} — {member.nameEn}</p><small>EPISODE {String(story.episode).padStart(2, "0")} / 08</small><h1>{story.title}</h1><strong className="serial-story-disclosure">18+ / FICTION / AI-ASSISTED ILLUSTRATIONS</strong><span>登場人物は全員成人です。本文には成人向け表現を、挿絵にはAI生成画像を含みます。</span></header><div className="serial-story-layout"><StoryText text={story.body} illustrations={story.images} /><aside className="serial-story-images">{story.images.map((image, index) => <figure key={image.id}><img src={assetUrl(image.image)} alt={image.alt || `${member.name}の記録画像 ${index + 1}`} loading="lazy" />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</aside></div><StoryVisualReview story={story} member={member} /><nav className="serial-story-next"><Link href={`/stories/${member.slug.split("-")[0]}`}><ArrowLeft /> 物語一覧へ</Link><span>NEXT RECORD — COMING SOON</span></nav></article></Shell>;
}

function LegalPage({ type }: { type: string }) { const content: Record<string, [string, string]> = { privacy: ["PRIVACY POLICY", "アクセス解析や外部サービスとの連携を開始する前に、取得情報、利用目的、保存期間を明記します。現在は外部へ個人情報を送信していません。"], terms: ["TERMS OF USE", "著作権、禁止事項、免責については公開前に管理者と専門家の確認を経て正式文面を掲載します。"], "adult-policy": ["ADULT CONTENT POLICY / 18+ NOTICE", "VEILの一部の物語には成人向け表現が含まれます。18歳未満の方は閲覧できません。外部サービスではそのサービスの規約と決済条件が適用されます。"], contact: ["CONTACT", "お問い合わせ先は未設定です。架空の事業者情報は掲載せず、正式な運営者情報の確定後に更新します。"] }; const [title, body] = content[type] || ["NOT FOUND", "ページが見つかりません。"]; return <Shell><PageHero eyebrow="VEIL OFFICIAL SITE / COMING SOON" title={title} copy={body} /><article className="prose page-section"><p className="status-chip">COMING SOON</p><p>このページは運用開始前のページ枠です。法的文面は公開前に専門家の確認が必要です。</p></article></Shell>; }

function NotFound() { return <Shell><section className="not-found"><p>404</p><h1>RECORD NOT FOUND</h1><Link className="button ghost" href="/">VEILへ戻る</Link></section></Shell>; }

function setMeta(path: string) { const name = path === "/" ? "VEIL OFFICIAL SITE" : path === "/admin" ? "VEIL LOCAL EDITOR" : path.includes("formation") ? "VEILが始まるまで" : path.includes("archive") ? "VEIL ARCHIVE" : path.includes("about") ? "ABOUT VEIL" : "VEIL"; document.title = `${name} | VEIL`; const desc = document.querySelector('meta[name="description"]'); desc?.setAttribute("content", "VEILは、架空の成人女性4人によるバンドプロジェクト。音楽、ビジュアル、物語、結成資料を公開します。"); let canonical = document.querySelector('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); } canonical.setAttribute("href", `${siteUrl}${path}`); }

export default function App() {
  const [path, setPath] = useState(routeFromLocation);
  useEffect(() => { const fn = () => setPath(routeFromLocation()); addEventListener("popstate", fn); return () => removeEventListener("popstate", fn); }, []);
  useEffect(() => setMeta(path), [path]);
  const page = useMemo(() => {
    if (path === "/admin") return <LocalAdmin members={members} publishedStories={serialStories} />;
    if (path === "/") return <Home />;
    if (path === "/about") return <AboutPage />;
    if (path === "/gallery") return <Shell><GalleryDirectory /></Shell>;
    const galleryMember = members.find(m => path === `/gallery/${m.slug.split("-")[0]}`); if (galleryMember) return <MemberGalleryPage member={galleryMember} />;
    if (path === "/archive") return <ArchivePage />;
    if (path === "/story/formation") return <FormationPage />;
    const member = members.find(m => path === `/members/${m.slug}`); if (member) return <MemberPage member={member} />;
    const episodeMatch = path.match(/^\/stories\/(reina|mizuki|hiyori|risa)\/season-(\d+)\/episode-(\d+)$/);
    if (episodeMatch) { const member = members.find(m => m.slug.split("-")[0] === episodeMatch[1]); const story = serialStories.find(entry => entry.memberSlug === member?.slug && entry.season === Number(episodeMatch[2]) && entry.episode === Number(episodeMatch[3])); if (member && story) return <SerialStoryPage member={member} story={story} />; }
    const story = members.find(m => path === `/stories/${m.slug.split("-")[0]}`); if (story) return <AdultStoryPage member={story} />;
    if (path.startsWith("/legal/")) return <LegalPage type={path.split("/").pop() || ""} />;
    return <NotFound />;
  }, [path]);
  return page;
}
