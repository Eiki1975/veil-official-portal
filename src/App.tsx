import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Menu, X } from "lucide-react";
import { aboutParagraphs, archiveItems, galleryGroups, members, navItems, news, siteUrl, type GalleryItem, type Member } from "./data/veilContent";
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

function GallerySection() {
  const [active, setActive] = useState<GalleryItem | null>(null);
  useEffect(() => { const close = (e: KeyboardEvent) => e.key === "Escape" && setActive(null); addEventListener("keydown", close); return () => removeEventListener("keydown", close); }, []);
  return <section className="section gallery-section" id="gallery"><SectionTitle eyebrow="INDEPENDENT OBSERVER / VISUAL FILE" title="OBSERVATION LOG" copy="音が止まったあとも、彼女たちの時間は静かに続いている。ここには、その折々に見えた姿を残す。" />
    <div className="gallery-collection">{galleryGroups.map(group => <section className="gallery-chapter" key={group.id} aria-labelledby={`gallery-${group.id}`}><header className="gallery-chapter-header"><p className="eyebrow">{group.eyebrow}</p><h3 id={`gallery-${group.id}`}>{group.title}</h3><p>{group.copy}</p></header><div className={`gallery-grid gallery-grid-${group.id}`}>{group.items.map(g => <button type="button" className="gallery-item" key={g.image} aria-label={`${g.record} ${g.category} ${g.caption}`} onClick={() => { setActive(g); track("gallery_image_click", g.category); }}><span className="gallery-image-frame"><img src={assetUrl(g.image)} alt={g.alt} width="1536" height="1024" loading="lazy" /><span className="gallery-record-id">{g.record}</span></span><span className="gallery-item-copy"><span className="gallery-meta"><span>{g.record}</span><span>SUBJECT / {g.category}</span></span><span className="gallery-caption">{g.caption}</span></span></button>)}</div></section>)}</div>
    <div className="room-links">{members.map(m => <Link key={m.slug} href={`/stories/${m.slug.split("-")[0]}`} event="room_click">{m.name}の部屋へ <ArrowRight size={15} /></Link>)}</div>
    {active && <div className="lightbox gallery-lightbox" role="dialog" aria-modal="true" aria-label={active.alt} onClick={() => setActive(null)}><button aria-label="閉じる"><X /></button><img src={assetUrl(active.image)} alt={active.alt} /><aside><p>{active.record}</p><p>SUBJECT / {active.category}</p><blockquote>{active.caption}</blockquote></aside></div>}
  </section>;
}

function Home() {
  return <Shell>
    <section className="hero" id="top"><picture className="hero-media"><source srcSet={assetUrl("/images/veil-hero-reina-main-v2.webp")} type="image/webp" /><img src={assetUrl("/images/veil-hero-reina-main-v2.png")} alt="雨宮玲奈を中心にしたVEILの4人のメンバー" className="hero-image" /></picture><div className="hero-scrim" /><div className="hero-content"><p className="hero-label">VEIL OFFICIAL SITE</p><h1>VEIL</h1><p className="hero-copy">音楽だけでは表せなかった、<br />言葉にならない欲望。</p><p className="hero-subcopy">音楽、ビジュアル、物語を通して、4人の女性を記録するバンドプロジェクト。</p><div className="hero-actions"><a className="button primary" href="#members">MEMBERS</a><Link className="button ghost" href="/about">ABOUT VEIL</Link></div></div><span className="scroll-mark">SCROLL</span></section>
    <MembersGrid />
    <section className="section" id="latest"><SectionTitle eyebrow="UPDATES" title="LATEST / NEWS" /><div className="news-list">{news.map(n => <article key={n.title}><time>{n.date}</time><span>{n.type}</span><h3>{n.title}</h3></article>)}</div></section>
    <GallerySection />
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

function StoryText({ text }: { text: string }) {
  let prologueTitleNext = false;
  return <div className="story-content">{text.replace(/\f/g, "").split("\n").map((line, index) => {
    const value = line.trim();
    if (!value) return null;
    if (value === "PROLOGUE") { prologueTitleNext = true; return <p className="story-kicker" key={`${value}-${index}`}>{value}</p>; }
    if (prologueTitleNext) { prologueTitleNext = false; return <h2 className="story-document-title" key={`${value}-${index}`}>{value}</h2>; }
    if (value === "VEIL ストーリー0") return <p className="story-kicker" key={`${value}-${index}`}>{value}</p>;
    if (value.endsWith("編")) return <h2 className="story-document-title" key={`${value}-${index}`}>{value}</h2>;
    if (/^第[一二三四五六七八九十]+章/.test(value)) return <h3 key={`${value}-${index}`}>{value}</h3>;
    return <p className="story-line" key={`${value.slice(0, 16)}-${index}`}>{value}</p>;
  })}</div>;
}

function MemberPage({ member }: { member: Member }) { return <Shell><PageHero eyebrow={`${member.nameEn} / ${member.role}`} title={member.name} copy="STORY ZERO — 彼女がVEILに来るまで" image={member.image} /><article className="prose page-section reading-page"><p className="status-chip">STORY ZERO / PUBLIC</p><h2>PROFILE</h2><section className="official-profile" aria-label={`${member.name}の公式プロフィール`}><p className="profile-catchcopy">{member.profile.catchcopy}</p><dl><div><dt>担当</dt><dd>{member.role}</dd></div><div><dt>年齢</dt><dd>{member.profile.age}</dd></div><div><dt>身長</dt><dd>{member.profile.height}</dd></div></dl><p>{member.profile.description}</p></section><StoryText text={storyZero[member.slug]} /><h2>RELATED RECORDS</h2><ArchiveCards limit={2} /><div className="next-links"><Link href="/story/formation"><ArrowLeft /> VEIL結成ストーリー</Link><Link href={`/stories/${member.slug.split("-")[0]}`} event="adult_story_entry">彼女の、さらに奥へ <ArrowRight /></Link></div></article></Shell>; }

function FormationPage() { return <Shell><PageHero eyebrow="FORMATION STORY" title="VEILが始まるまで" copy="高瀬真紀が一枚の募集告知を出し、4人の女性と出会うまでの記録。" image="/images/veil-backstage.jpg" /><article className="prose page-section reading-page"><p className="byline">高瀬真紀<br /><small>VEIL結成時の募集担当者</small></p><p>高瀬真紀は、VEIL結成へ向けた募集を始めた人物です。以下は、その募集が出されるまでを描くプロローグです。</p><StoryText text={prologue} /><h2>THE FOUR APPLICATIONS</h2><div className="member-link-list">{members.map(m => <Link href={`/members/${m.slug}`} key={m.slug}>{m.name}<span>{m.role}</span><ArrowRight /></Link>)}</div><h2>RELATED ARCHIVE</h2><ArchiveCards /><div className="next-links"><Link href="/archive">VEIL ARCHIVE <ArrowRight /></Link></div></article></Shell>; }

function AboutPage() { return <Shell><PageHero eyebrow="INDEPENDENT RECORD" title="ABOUT VEIL" copy="音楽だけでは表せなかった彼女たちの姿を記録する場所。" /><article className="prose page-section"><p className="byline">記録者<br /><small>Independent Observer / Recorder</small></p><p>このサイトを記録する者は、レーベルやVEILの所有者ではありません。4人と彼女たちを取り巻く時間を、独立した立場から観察し、記録しています。</p>{aboutParagraphs.map((p, i) => <p key={i}>{p}</p>)}<Link className="button ghost" href="/story/formation">VEILが始まるまで</Link></article></Shell>; }

function ArchivePage() { return <Shell><PageHero eyebrow="OFFICIAL RECORDS" title="VEIL ARCHIVE" copy="募集告知、応募文、面談メモ。VEILが成立していく過程に残された記録。" /><div className="page-section"><ArchiveCards /><div className="next-links"><Link href="/story/formation">FORMATION STORY <ArrowRight /></Link><Link href="/#members">MEMBERS <ArrowRight /></Link></div></div></Shell>; }

function AdultStoryPage({ member }: { member: Member }) {
  const key = `veil-age-ok-${member.slug}`; const [ok, setOk] = useState(() => localStorage.getItem(key) === "yes");
  if (!ok) return <Shell><section className="age-gate"><p className="eyebrow">18+ CONTENT NOTICE</p><h1>この先の物語について</h1><p>この先の物語には、成人向けの表現が含まれます。18歳未満の方は閲覧できません。同意状態はこの端末内にのみ保存されます。</p><div><button className="button primary" onClick={() => { localStorage.setItem(key, "yes"); setOk(true); track("age_gate_accept", member.slug); }}>18歳以上です</button><button className="button ghost" onClick={() => { history.back(); track("age_gate_exit", member.slug); }}>戻る</button></div></section></Shell>;
  return <Shell><PageHero eyebrow="ADULT STORY / COMING SOON" title={member.name} copy="彼女の、さらに奥へ。" image={member.image} /><article className="prose page-section"><div className="coming-block">ADULT STORY<br /><strong>COMING SOON</strong><small>正式原稿および外部販売URLは未設定です</small></div><Link href={`/members/${member.slug}`} className="text-link"><ArrowLeft /> STORY ZEROへ戻る</Link></article></Shell>;
}

function LegalPage({ type }: { type: string }) { const content: Record<string, [string, string]> = { privacy: ["PRIVACY POLICY", "アクセス解析や外部サービスとの連携を開始する前に、取得情報、利用目的、保存期間を明記します。現在は外部へ個人情報を送信していません。"], terms: ["TERMS OF USE", "著作権、禁止事項、免責については公開前に管理者と専門家の確認を経て正式文面を掲載します。"], "adult-policy": ["ADULT CONTENT POLICY / 18+ NOTICE", "VEILの一部の物語には成人向け表現が含まれます。18歳未満の方は閲覧できません。外部サービスではそのサービスの規約と決済条件が適用されます。"], contact: ["CONTACT", "お問い合わせ先は未設定です。架空の事業者情報は掲載せず、正式な運営者情報の確定後に更新します。"] }; const [title, body] = content[type] || ["NOT FOUND", "ページが見つかりません。"]; return <Shell><PageHero eyebrow="VEIL OFFICIAL SITE / COMING SOON" title={title} copy={body} /><article className="prose page-section"><p className="status-chip">COMING SOON</p><p>このページは運用開始前のページ枠です。法的文面は公開前に専門家の確認が必要です。</p></article></Shell>; }

function NotFound() { return <Shell><section className="not-found"><p>404</p><h1>RECORD NOT FOUND</h1><Link className="button ghost" href="/">VEILへ戻る</Link></section></Shell>; }

function setMeta(path: string) { const name = path === "/" ? "VEIL OFFICIAL SITE" : path.includes("formation") ? "VEILが始まるまで" : path.includes("archive") ? "VEIL ARCHIVE" : path.includes("about") ? "ABOUT VEIL" : "VEIL"; document.title = `${name} | VEIL`; const desc = document.querySelector('meta[name="description"]'); desc?.setAttribute("content", "VEILは、架空の成人女性4人によるバンドプロジェクト。音楽、ビジュアル、物語、結成資料を公開します。"); let canonical = document.querySelector('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); } canonical.setAttribute("href", `${siteUrl}${path}`); }

export default function App() {
  const [path, setPath] = useState(routeFromLocation);
  useEffect(() => { const fn = () => setPath(routeFromLocation()); addEventListener("popstate", fn); return () => removeEventListener("popstate", fn); }, []);
  useEffect(() => setMeta(path), [path]);
  const page = useMemo(() => {
    if (path === "/") return <Home />;
    if (path === "/about") return <AboutPage />;
    if (path === "/archive") return <ArchivePage />;
    if (path === "/story/formation") return <FormationPage />;
    const member = members.find(m => path === `/members/${m.slug}`); if (member) return <MemberPage member={member} />;
    const story = members.find(m => path === `/stories/${m.slug.split("-")[0]}`); if (story) return <AdultStoryPage member={story} />;
    if (path.startsWith("/legal/")) return <LegalPage type={path.split("/").pop() || ""} />;
    return <NotFound />;
  }, [path]);
  return page;
}
