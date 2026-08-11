import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ExternalLink, Menu, Play, X } from "lucide-react";
import { aboutParagraphs, archiveItems, galleryGroups, members, navItems, news, siteUrl, type GalleryItem, type Member, type NewsItem } from "./data/veilContent";
import { borderlineRelease } from "./data/music";
import { serialStories, type SerialStory, type SerialStoryImage, type SerialStorySummary } from "./data/serialStories";
import { PersistentAudioPlayer, type AudioPlayerHandle } from "./AudioPlayer";
import "./styles/music-player.css";
import { LocalAdmin } from "./LocalAdmin";
import { LocalNotesAdmin } from "./LocalNotesAdmin";
import seoPageData from "./content/seo-pages.json";
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

const englishEpisodeRouteByStoryId: Record<string, string> = {
  "season-01-reina-episode-01-canonical-20260727": "/en/stories/reina/season-1/episode-1/",
  "season-01-reina-episode-02-canonical-20260802": "/en/stories/reina/season-1/episode-2/",
  "season-01-reina-episode-04-canonical-20260809": "/en/stories/reina/season-1/episode-4/",
};
const englishEpisodeRouteByJapanesePath: Record<string, string> = {
  "/stories/reina/season-1/episode-1": "/en/stories/reina/season-1/episode-1/",
  "/stories/reina/season-1/episode-2": "/en/stories/reina/season-1/episode-2/",
  "/stories/reina/season-1/episode-4": "/en/stories/reina/season-1/episode-4/",
};
const firstPublishedStoryByMember = new Map<string, SerialStorySummary>();
const publishedStoriesByMember = new Map<string, SerialStorySummary[]>();
const latestPublishedStoryByMember = new Map<string, SerialStorySummary>();
serialStories
  .slice()
  .sort((a, b) => a.season - b.season || a.episode - b.episode)
  .forEach((story) => {
    if (!firstPublishedStoryByMember.has(story.memberSlug)) firstPublishedStoryByMember.set(story.memberSlug, story);
    const published = publishedStoriesByMember.get(story.memberSlug) || [];
    published.push(story);
    publishedStoriesByMember.set(story.memberSlug, published);
    latestPublishedStoryByMember.set(story.memberSlug, story);
  });
const galleryItems = galleryGroups.flatMap((group) => group.items);

type SeoPage = {
  path: string;
  title: string;
  description: string;
  image: string;
  schemaType: string;
  robots: string;
};
const seoPages = seoPageData as SeoPage[];

const baseUrl = import.meta.env.BASE_URL;
const xUrl = import.meta.env.VITE_X_URL?.trim();
const assetUrl = (path: string) => `${baseUrl}${path.replace(/^\//, "")}`;
function canonicalRoutePath(path: string) {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex >= 0 ? path.slice(0, suffixIndex) : path;
  const suffix = suffixIndex >= 0 ? path.slice(suffixIndex) : "";
  const canonical = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
  return `${canonical}${suffix}`;
}
const routeUrl = (path: string) => `${baseUrl}${canonicalRoutePath(path).replace(/^\//, "")}`;

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
  const documentRoute = /^\/(?:editorial|en|ja|news|notes)\//.test(canonicalRoutePath(href));
  return <a href={local ? routeUrl(href) : href} className={className} onClick={(e) => {
    if (event) track(event, href);
    if (local && !documentRoute) {
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
    <nav><Link href="/news/">NEWS</Link><Link href="/notes/">NOTES</Link><Link href="/editorial/reading-guide/">READER GUIDE</Link><Link href="/legal/privacy">PRIVACY</Link><Link href="/legal/terms">TERMS</Link><Link href="/legal/adult-policy">18+ NOTICE</Link><Link href="/legal/contact">CONTACT</Link></nav>
    <p className="fine">VEILはAIを含む制作手法を活用した創作バンドプロジェクトです。登場人物は架空ですが、公開される作品は実際の創作物です。</p>
  </footer>;
}

function Shell({ children }: { children: React.ReactNode }) { return <><Header /><main>{children}</main><Footer /></>; }

function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return <header className="section-title">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{copy && <p>{copy}</p>}</header>;
}

function NewsList({ items, full = false }: { items: NewsItem[]; full?: boolean }) {
  return <div className={`news-list${full ? " news-list-full" : ""}`}>{items.map((item) => {
    const content = <><time dateTime={item.dateTime}>{item.date}</time><span>{item.type}{item.adult ? " / 18+" : ""}</span><div className="news-copy"><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}</div><ArrowRight className="news-arrow" size={16} aria-hidden="true" /></>;
    return item.href
      ? <Link key={item.title} href={item.href} className="news-row news-row-link" event="news_open">{content}</Link>
      : <article className="news-row" key={item.title}>{content}</article>;
  })}</div>;
}

function MembersGrid() {
  return <section className="section members-section" id="members"><SectionTitle eyebrow="THE FOUR" title="MEMBERS" copy="4人がVEILへ来るまで。" />
    <div className="member-grid">{members.map((m, i) => <article className="member-card" key={m.slug}>
      <Link href={`/members/${m.slug}`} event="member_card_click"><div className="member-image-wrap"><img src={assetUrl(m.image)} alt={m.alt} width="1200" height="1500" loading={i ? "lazy" : "eager"} /></div></Link>
      <div className="member-body"><p className="member-index">0{i + 1} / {m.role}</p><h3>{m.name}</h3><p className="member-en">{m.nameEn}</p><p>{m.intro}</p><Link className="text-link" href={`/members/${m.slug}`} event="story_zero_click">STORY ZERO <ArrowRight size={16} /></Link></div>
    </article>)}</div><NotesTeaser />
  </section>;
}

function NotesTeaser() {
  return <aside className="notes-teaser" aria-labelledby="notes-teaser-title">
    <div className="notes-teaser__title"><p>OUTSIDE THE STORY</p><h2 id="notes-teaser-title">VEIL NOTES <span>制作の記録</span></h2></div>
    <p className="notes-teaser__copy">作品が形になるまでの、公開された制作の記録。</p>
    <Link className="notes-teaser__link" href="/notes/" event="notes_index_open">制作の記録を読む <ArrowRight size={16} /></Link>
  </aside>;
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

function Home({ onPlayBorderline }: { onPlayBorderline: () => void }) {
  return <Shell>
    <section className="hero" id="top"><div className="hero-media"><picture><source srcSet={assetUrl("/images/veil-hero-band-v6-20260725-bluesky.jpg")} type="image/jpeg" /><img src={assetUrl("/images/veil-hero-band-v6-20260725.png")} alt="バンド写真として並ぶVEILの4人。中央に雨宮玲奈、神崎瑞希、小宮ひより、白石理沙" className="hero-image" width="1672" height="941" /></picture></div><div className="hero-scrim" /><div className="hero-content"><p className="hero-label">VEIL OFFICIAL SITE</p><h1>VEIL</h1><p className="hero-copy">音楽だけでは表せなかった、<br />言葉にならない欲望。</p><p className="hero-subcopy">音楽、ビジュアル、物語を通して、4人の女性を記録するバンドプロジェクト。</p><div className="hero-actions"><a className="button primary" href="#members">MEMBERS</a><Link className="button ghost" href="/about">ABOUT VEIL</Link></div></div><span className="scroll-mark">SCROLL</span></section>
    <MembersGrid />
    <section className="section" id="latest"><SectionTitle eyebrow="UPDATES" title="LATEST / NEWS" copy="公開した作品と、読める導線に影響する更新を記録します。" /><NewsList items={news.slice(0, 4)} /><Link className="text-link section-link" href="/news/" event="news_index_open">VIEW ALL UPDATES <ArrowRight size={16} /></Link></section>
    <GalleryDirectory id="gallery" />
    <section className="feature feature-formation" id="formation" style={{ backgroundImage: `url(${assetUrl("/images/veil-backstage.jpg")})` }}><div><p className="eyebrow">HOW VEIL BEGAN</p><h2>VEILが<br />始まるまで</h2><p>高瀬真紀が新しい女性バンドの募集を始め、4人を見つけ、集めた。これはVEILが成立するまでの物語。</p><Link className="button primary formation-cta" href="/story/formation" event="formation_click"><span>PROLOGUE</span>『最後の募集』を読む <ArrowRight size={18} /></Link></div></section>
    <section className="section" id="archive"><SectionTitle eyebrow="DOCUMENTS BEFORE THE FIRST NOTE" title="VEIL ARCHIVE" copy="結成前から残る記録。" /><ArchiveCards limit={3} /><Link className="text-link section-link" href="/archive">VIEW ARCHIVE <ArrowRight size={16} /></Link></section>
    <section className="section stories" id="stories"><SectionTitle eyebrow="FICTION" title="STORIES" copy="Story Zeroの先に続く、4人それぞれの物語。" /><div className="story-strip">{members.map((member) => {
      const published = publishedStoriesByMember.get(member.slug) || [];
      const latest = latestPublishedStoryByMember.get(member.slug);
      const currentSeason = latest ? published.filter((story) => story.season === latest.season) : [];
      const episodeLabel = latest ? `SEASON ${String(latest.season).padStart(2, "0")} / ${currentSeason.length > 1 ? `EPISODES 01–${String(latest.episode).padStart(2, "0")}` : `EPISODE ${String(latest.episode).padStart(2, "0")}`} 公開中` : "COMING SOON";
      return <Link key={member.slug} href={`/stories/${member.slug.split("-")[0]}`} event="adult_story_entry"><span>{member.name}</span><small>{latest ? `18+ / ${episodeLabel}` : "18+ / COMING SOON"}</small>{latest && <strong>最新：第{latest.episode}話『{latest.title}』</strong>}<ArrowRight /></Link>;
    })}</div></section>
    <section className="feature about-preview" id="about"><div><p className="eyebrow">INDEPENDENT RECORD</p><h2>ABOUT VEIL</h2><p>{aboutParagraphs[0]}</p><p>{aboutParagraphs[1]}</p><div className="about-preview-actions"><Link className="button ghost" href="/about" event="about_full_click">全文を読む</Link><Link className="text-link" href="/editorial/reading-guide/" event="recorder_guide_open">記録者が、この物語を届けたい理由 <ArrowRight size={16} /></Link></div></div></section>
    <section className="section two-column" id="music"><div><SectionTitle eyebrow="DISCOGRAPHY" title="MUSIC" /><div className="music-release-card"><div className="music-release-card__cover"><img src={assetUrl(borderlineRelease.cover)} alt="VEILのデビューシングル『Borderline』のジャケット" loading="lazy" /><span>VEIL<strong>BORDERLINE</strong></span></div><div className="music-release-card__body"><p className="music-release-card__type">{borderlineRelease.type}</p><h3>{borderlineRelease.title}</h3><p>VEILのデビューシングル。再生を押すと、画面を移動しても操作できる小さなプレイヤーが開きます。</p><button className="music-play-button" type="button" onClick={onPlayBorderline}><Play size={16} fill="currentColor" /> 再生する</button><Link className="text-link music-release-link" href="/discography" event="music_discography_click">DISCOGRAPHY <ArrowRight size={16} /></Link></div></div></div><div id="support"><SectionTitle eyebrow="KEEP THE RECORD GOING" title="SUPPORT" /><p>VEILの次の音楽、ビジュアル、物語の制作を支えるための導線です。支援サービスは準備中です。</p><button className="button disabled" onClick={() => track("support_click")}>SUPPORT — COMING SOON</button></div></section>
    <section className="section follow" id="follow"><SectionTitle eyebrow="FOLLOW THE RECORD" title="続きが気になる方へ" copy="新しい記録は、Xでお知らせします。" />{xUrl ? <a className="button primary follow-x" href={xUrl} target="_blank" rel="noreferrer" onClick={() => track("x_follow_click")}>Xで最新情報を見る <ExternalLink size={16} /></a> : <button className="button disabled follow-x" type="button">X — COMING SOON</button>}</section>
    <section className="adult-external"><div><p className="eyebrow">EXTERNAL 18+ CONTENT</p><h2>より奥の記録へ</h2><p className="coming">COMING SOON</p><p>成人向けコンテンツと外部サービスへの導線は現在準備中です。18歳未満の方は利用できません。</p></div></section>
  </Shell>;
}

function ArchiveCards({ limit }: { limit?: number }) {
  const [active, setActive] = useState<(typeof archiveItems)[number] | null>(null);
  return <><div className="archive-grid">{archiveItems.slice(0, limit).map(a => <article className="archive-card" key={a.id}>{a.image && <button className="archive-image" type="button" onClick={() => { setActive(a); track("archive_image_open", a.id); }}><img src={assetUrl(a.image)} alt={`${a.title}の資料画像を拡大`} loading="lazy" /><span>CLICK TO ENLARGE</span></button>}<div className="paper"><p className="doc-type">{a.type}</p><h3>{a.title}</h3><p>{a.body}</p><dl><div><dt>DATE</dt><dd>{a.date}</dd></div><div><dt>AUTHOR</dt><dd>{a.author}</dd></div><div><dt>RELATED</dt><dd>{a.related}</dd></div></dl></div></article>)}</div>{active?.image && <div className="lightbox" role="dialog" aria-modal="true" aria-label={active.title} onClick={() => setActive(null)}><button type="button" aria-label="閉じる"><X /></button><img src={assetUrl(active.image)} alt={active.title} /></div>}</>;
}

function DiscographyPage({ onPlayBorderline }: { onPlayBorderline: () => void }) {
  return <Shell><PageHero eyebrow="DISCOGRAPHY" title="MUSIC" copy="VEILの音楽と、その制作に関する記録。" /><article className="page-section music-release-page"><section className="music-release-detail" aria-labelledby="borderline-title"><div className="music-release-detail__cover"><img src={assetUrl(borderlineRelease.cover)} alt="VEILのデビューシングル『Borderline』のジャケット" /><span>VEIL<strong>BORDERLINE</strong></span></div><div className="music-release-detail__copy"><p className="music-release-detail__type">{borderlineRelease.type} / {borderlineRelease.duration}</p><h2 id="borderline-title">{borderlineRelease.title}</h2><p>VEILのデビューシングル。再生は自動では始まりません。下のボタンから開く小さなプレイヤーは、サイト内のどのページへ移動しても使えます。</p><button className="music-play-button" type="button" onClick={onPlayBorderline}><Play size={16} fill="currentColor" /> Borderlineを再生する</button></div></section></article></Shell>;
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

function AboutPage() { return <Shell><PageHero eyebrow="INDEPENDENT RECORD" title="ABOUT VEIL" copy="音楽だけでは表せなかった彼女たちの姿を記録する場所。" /><article className="prose page-section"><p className="byline">記録者<br /><small>Independent Observer / Recorder</small></p><p>このサイトを記録する者は、レーベルやVEILの所有者ではありません。4人と彼女たちを取り巻く時間を、独立した立場から観察し、記録しています。</p>{aboutParagraphs.map((p, i) => <p key={i}>{p}</p>)}<div className="next-links"><Link href="/story/formation">VEILが始まるまで <ArrowRight /></Link><Link href="/editorial/reading-guide/">記録者が、この物語を届けたい理由 <ArrowRight /></Link></div></article></Shell>; }

function ArchivePage() { return <Shell><PageHero eyebrow="OFFICIAL RECORDS" title="VEIL ARCHIVE" copy="募集告知、応募文、面談メモ。VEILが成立していく過程に残された記録。" /><div className="page-section"><ArchiveCards /><div className="next-links"><Link href="/story/formation">FORMATION STORY <ArrowRight /></Link><Link href="/#members">MEMBERS <ArrowRight /></Link></div></div></Shell>; }

function NewsPage() { return <Shell><PageHero eyebrow="SITE UPDATES" title="NEWS" copy="公開した作品と、読める導線に影響する更新を記録します。" /><article className="page-section news-page"><p className="news-page-intro">公開済みの作品、音楽、読める場所に関わる変更だけを、日付とともに残します。物語には成人向け表現を含むものがあります。</p><NewsList items={news} full /><Link className="text-link section-link" href="/">VEIL TOP <ArrowRight size={16} /></Link></article></Shell>; }

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

function isStoryContent(value: unknown, summary: SerialStorySummary): value is SerialStory {
  if (!value || typeof value !== "object") return false;
  const story = value as Partial<SerialStory>;
  return story.id === summary.id
    && story.memberSlug === summary.memberSlug
    && story.season === summary.season
    && story.episode === summary.episode
    && story.title === summary.title
    && typeof story.body === "string"
    && Array.isArray(story.images);
}

function useSerialStoryContent(summary: SerialStorySummary, enabled: boolean, attempt: number) {
  const [story, setStory] = useState<SerialStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setStory(null);
      setLoading(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    setStory(null);
    setLoading(true);
    setError("");
    fetch(assetUrl(summary.contentUrl), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("本文を読み込めませんでした。");
        const content: unknown = await response.json();
        if (!isStoryContent(content, summary)) throw new Error("本文データを確認できませんでした。");
        if (!controller.signal.aborted) setStory(content);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "本文を読み込めませんでした。");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt, enabled, summary]);

  return { story, loading, error };
}

function SerialStoryPage({ story: summary, member }: { story: SerialStorySummary; member: Member }) {
  const key = `veil-age-ok-${member.slug}`;
  const [ok, setOk] = useState(() => localStorage.getItem(key) === "yes");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { story, loading, error } = useSerialStoryContent(summary, ok, loadAttempt);
  const englishRoute = englishEpisodeRouteByStoryId[summary.id];
  if (!ok) return <Shell><section className="age-gate"><p className="eyebrow">18+ CONTENT NOTICE</p><h1>この先の物語について</h1><p>この先の物語には、成人向けの表現が含まれます。18歳未満の方は閲覧できません。同意状態はこの端末内にのみ保存されます。</p><div><button className="button primary" onClick={() => { localStorage.setItem(key, "yes"); setOk(true); track("age_gate_accept", member.slug); }}>18歳以上です</button><button className="button ghost" onClick={() => history.back()}>戻る</button></div></section></Shell>;
  if (loading || !story && !error) return <Shell><article className="serial-story"><header className="serial-story-header"><p>SEASON {String(summary.season).padStart(2, "0")} — {member.nameEn}</p><small>EPISODE {String(summary.episode).padStart(2, "0")} / 08</small><h1>{summary.title}</h1></header><p className="serial-story-load-state">本文を開いています…</p></article></Shell>;
  if (!story) return <Shell><article className="serial-story"><header className="serial-story-header"><p>SEASON {String(summary.season).padStart(2, "0")} — {member.nameEn}</p><small>EPISODE {String(summary.episode).padStart(2, "0")} / 08</small><h1>{summary.title}</h1></header><div className="serial-story-load-state"><p>{error || "本文を読み込めませんでした。"}</p><button className="button ghost" onClick={() => setLoadAttempt((value) => value + 1)}>もう一度読み込む</button></div></article></Shell>;
  return <Shell><article className="serial-story"><header className="serial-story-header"><p>SEASON {String(story.season).padStart(2, "0")} — {member.nameEn}</p><small>EPISODE {String(story.episode).padStart(2, "0")} / 08</small><h1>{story.title}</h1><strong className="serial-story-disclosure">18+ / FICTION / AI-ASSISTED ILLUSTRATIONS</strong><span>登場人物は全員成人です。本文には成人向け表現を、挿絵にはAI生成画像を含みます。</span>{englishRoute && <nav className="serial-story-language-switch" aria-label="この話の言語を選択"><span aria-current="page">日本語</span><a href={routeUrl(englishRoute)}>EN</a></nav>}</header><div className="serial-story-layout"><StoryText text={story.body} illustrations={story.images} /><aside className="serial-story-images">{story.images.map((image, index) => <figure key={image.id}><img src={assetUrl(image.image)} alt={image.alt || `${member.name}の記録画像 ${index + 1}`} loading="lazy" />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</aside></div><StoryVisualReview story={story} member={member} /><nav className="serial-story-next"><Link href={`/stories/${member.slug.split("-")[0]}`}><ArrowLeft /> 物語一覧へ</Link><span>NEXT RECORD — COMING SOON</span></nav></article></Shell>;
}

function LegalPage({ type }: { type: string }) {
  const content: Record<string, [string, string]> = {
    privacy: ["PRIVACY POLICY", "当サイトでは、閲覧傾向の把握とサイト改善のために Cloudflare Web Analytics と Google Analytics を利用しています。"],
    terms: ["TERMS OF USE", "著作権、禁止事項、免責については公開前に管理者と専門家の確認を経て正式文面を掲載します。"],
    "adult-policy": ["ADULT CONTENT POLICY / 18+ NOTICE", "VEILの一部の物語には成人向け表現が含まれます。18歳未満の方は閲覧できません。外部サービスではそのサービスの規約と決済条件が適用されます。"],
    contact: ["CONTACT", "お問い合わせ先は未設定です。架空の事業者情報は掲載せず、正式な運営者情報の確定後に更新します。"],
  };
  const [title, body] = content[type] || ["NOT FOUND", "ページが見つかりません。"];
  const isPrivacy = type === "privacy";
  const isAdultPolicy = type === "adult-policy";
  const isComing = type === "terms" || type === "contact";

  return <Shell><PageHero eyebrow={isPrivacy ? "VEIL OFFICIAL SITE / PRIVACY" : isAdultPolicy ? "VEIL OFFICIAL SITE / 18+ POLICY" : "VEIL OFFICIAL SITE / COMING SOON"} title={title} copy={body} /><article className="prose page-section">{isPrivacy ? <><p>Cloudflare Web Analytics と Google Analytics により、訪問数、閲覧ページ、流入元、利用環境などの統計情報を確認します。</p><p>Google Analytics は、Cookie 等を通じて匿名化された利用状況を収集する場合があります。氏名、メールアドレス、本文の入力内容などをアクセス解析目的で取得することはありません。</p><p>収集・処理は Cloudflare および Google のプライバシー方針に基づいて行われます。</p></> : isAdultPolicy ? <><h2>対象となる記録</h2><p>VEILの一部の物語には、成人同士の親密さや欲望を扱う成人向け表現があります。登場人物はすべて架空の成人です。</p><h2>年齢確認</h2><p>該当する物語は18歳以上の方を対象とし、本文を開く前に年齢確認を表示します。同意状態は利用中の端末内にのみ保存します。</p><h2>ビジュアルの制作方法</h2><p>挿絵にはAIを含む制作手法を用いています。物語ページでフィクション、成人向け表現、AI支援イラストであることを表示します。</p><h2>現在の提供範囲</h2><p>現在公開しているのは物語、静止画と音楽です。成人向け動画、DVD、イメージビデオ、外部販売サービスは提供していません。</p><div className="next-links"><Link href="/editorial/reading-guide/">記録者が、この物語を届けたい理由 <ArrowRight /></Link><Link href="/editorial/sensual-fiction/">官能表現の編集方針 <ArrowRight /></Link></div></> : isComing ? <><p className="status-chip">COMING SOON</p><p>このページは運用開始前のページ枠です。法的文面は公開前に専門家の確認が必要です。</p></> : <p>ページが見つかりません。</p>}</article></Shell>;
}

function NotFound() { return <Shell><section className="not-found"><p>404</p><h1>RECORD NOT FOUND</h1><Link className="button ghost" href="/">VEILへ戻る</Link></section></Shell>; }

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

function pageStructuredData(page: SeoPage, canonical: string) {
  if (page.path === "/") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "VEIL OFFICIAL SITE", url: `${siteUrl}/`, inLanguage: ["ja", "en"] },
        { "@type": "CreativeWork", name: "VEIL", description: page.description, url: `${siteUrl}/`, isFamilyFriendly: false, about: ["架空バンド", "音楽", "ビジュアル", "成人向け連載フィクション"] },
      ],
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": page.schemaType || "WebPage",
    name: page.title,
    description: page.description,
    url: canonical,
    inLanguage: "ja",
    isPartOf: { "@type": "WebSite", name: "VEIL OFFICIAL SITE", url: `${siteUrl}/` },
  };
}

function setMeta(path: string) {
  const serialStory = serialStories.find((story) => path === `/stories/${story.memberSlug.split("-")[0]}/season-${story.season}/episode-${story.episode}`);
  const storyMember = members.find((member) => path === `/stories/${member.slug.split("-")[0]}`);
  const registered = seoPages.find((page) => page.path === path);
  const member = serialStory ? members.find((entry) => entry.slug === serialStory.memberSlug) : storyMember;
  const page: SeoPage = registered || (serialStory && member ? {
    path,
    title: `${member.name} 第${serialStory.episode}話「${serialStory.title}」｜VEIL`,
    description: `${member.name} Season ${String(serialStory.season).padStart(2, "0")} 第${serialStory.episode}話「${serialStory.title}」。登場人物はすべて架空の成人です。`,
    image: member.image,
    schemaType: "WebPage",
    robots: "noindex,nofollow",
  } : storyMember ? {
    path,
    title: `${storyMember.name}の成人向け連載｜VEIL STORIES`,
    description: `${storyMember.name}の心理と関係の変化を追うVEILの成人向け連載一覧です。登場人物はすべて架空の成人です。`,
    image: storyMember.image,
    schemaType: "CollectionPage",
    robots: "noindex,nofollow",
  } : {
    path,
    title: "ページが見つかりません｜VEIL",
    description: "指定されたVEILの記録は見つかりませんでした。",
    image: "/images/veil-hero-band-v6-20260725.png",
    schemaType: "WebPage",
    robots: "noindex,nofollow",
  });
  const canonical = `${siteUrl}${canonicalRoutePath(path)}`;
  const image = `${siteUrl}${page.image}`;
  document.documentElement.lang = "ja";
  document.title = page.title;
  upsertMeta('meta[name="description"]', { name: "description", content: page.description });
  upsertMeta('meta[name="robots"]', { name: "robots", content: page.robots });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "VEIL OFFICIAL SITE" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: page.title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: page.description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: page.title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: page.description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

  let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.rel = "canonical";
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonical;

  let schema = document.head.querySelector<HTMLScriptElement>("#veil-structured-data");
  if (!schema) {
    schema = document.createElement("script");
    schema.id = "veil-structured-data";
    schema.type = "application/ld+json";
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify(pageStructuredData(page, canonical));

  document.querySelectorAll('link[data-veil-hreflang]').forEach((link) => link.remove());
  const englishRoute = serialStory ? englishEpisodeRouteByStoryId[serialStory.id] : englishEpisodeRouteByJapanesePath[path];
  if (englishRoute) {
    [["ja", canonicalRoutePath(path)], ["en", canonicalRoutePath(englishRoute)], ["x-default", "/en/start/"]].forEach(([lang, href]) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = lang;
      link.href = `${siteUrl}${href}`;
      link.dataset.veilHreflang = "true";
      document.head.appendChild(link);
    });
  }
}

export default function App() {
  const [path, setPath] = useState(routeFromLocation);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [hasMusicPlayerBeenOpened, setHasMusicPlayerBeenOpened] = useState(false);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const playBorderline = useCallback(() => {
    setHasMusicPlayerBeenOpened(true);
    setIsMusicPlayerOpen(true);
    track("music_release_open", borderlineRelease.id);
    audioPlayerRef.current?.play();
  }, []);
  useEffect(() => { const fn = () => setPath(routeFromLocation()); addEventListener("popstate", fn); return () => removeEventListener("popstate", fn); }, []);
  useEffect(() => setMeta(path), [path]);
  const page = useMemo(() => {
    if (path === "/admin") return <LocalAdmin members={members} publishedStories={serialStories} />;
    if (path === "/admin/notes") return <LocalNotesAdmin />;
    if (path === "/") return <Home onPlayBorderline={playBorderline} />;
    if (path === "/about") return <AboutPage />;
    if (path === "/discography") return <DiscographyPage onPlayBorderline={playBorderline} />;
    if (path === "/gallery") return <Shell><GalleryDirectory /></Shell>;
    const galleryMember = members.find(m => path === `/gallery/${m.slug.split("-")[0]}`); if (galleryMember) return <MemberGalleryPage member={galleryMember} />;
    if (path === "/archive") return <ArchivePage />;
    if (path === "/news") return <NewsPage />;
    if (path === "/story/formation") return <FormationPage />;
    const member = members.find(m => path === `/members/${m.slug}`); if (member) return <MemberPage member={member} />;
    const episodeMatch = path.match(/^\/stories\/(reina|mizuki|hiyori|risa)\/season-(\d+)\/episode-(\d+)$/);
    if (episodeMatch) { const member = members.find(m => m.slug.split("-")[0] === episodeMatch[1]); const story = serialStories.find(entry => entry.memberSlug === member?.slug && entry.season === Number(episodeMatch[2]) && entry.episode === Number(episodeMatch[3])); if (member && story) return <SerialStoryPage member={member} story={story} />; }
    const story = members.find(m => path === `/stories/${m.slug.split("-")[0]}`); if (story) return <AdultStoryPage member={story} />;
    if (path.startsWith("/legal/")) return <LegalPage type={path.split("/").pop() || ""} />;
    return <NotFound />;
  }, [path, playBorderline]);
  return <>{page}<PersistentAudioPlayer ref={audioPlayerRef} release={borderlineRelease} audioSrc={assetUrl(borderlineRelease.audio)} coverSrc={assetUrl(borderlineRelease.cover)} isOpen={isMusicPlayerOpen} hasBeenOpened={hasMusicPlayerBeenOpened} onOpen={() => { setHasMusicPlayerBeenOpened(true); setIsMusicPlayerOpen(true); }} onMinimize={() => setIsMusicPlayerOpen(false)} onTrack={track} /></>;
}
