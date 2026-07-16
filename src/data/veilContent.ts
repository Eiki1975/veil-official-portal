export const siteUrl = import.meta.env.VITE_SITE_URL || "https://eiki1975.github.io/veil-official-portal";

export type Member = {
  slug: string; name: string; nameEn: string; role: string; status: string;
  image: string; alt: string; intro: string;
  profile: { age: string; height: string; catchcopy: string; description: string };
};

export const members: Member[] = [
  {
    slug: "reina-amamiya", name: "雨宮玲奈", nameEn: "REINA AMAMIYA", role: "Vocal", status: "PUBLIC",
    image: "/images/members/v3/reina-amamiya-press.jpg", alt: "2次元塗りの同じ撮影シリーズでマイクに手を添えるVEILのボーカル雨宮玲奈",
    intro: "柔らかく伸びる声と、感情をそのままこぼすような歌で、VEILの楽曲を聴く者のすぐそばまで届けるボーカリスト。人との距離を縮めることにためらいがなく、その近さが相手に何を期待させ、自分の中の何を目覚めさせているのかには、まだ気づかないふりをしている。",
    profile: { age: "27歳", height: "156cm", catchcopy: "誰にでも無邪気に距離を縮める、VEILの声。", description: "透明感ある歌声で感情を届けるボーカリスト。" },
  },
  {
    slug: "mizuki-kanzaki", name: "神崎瑞希", nameEn: "MIZUKI KANZAKI", role: "Guitar", status: "PUBLIC",
    image: "/images/members/v3/mizuki-kanzaki-press.jpg", alt: "2次元塗りの同じ撮影シリーズでギターを抱えるVEILのギタリスト神崎瑞希",
    intro: "しなやかで鋭いギターと、視線を奪う華やかな演奏で、VEILの楽曲に勢いと輪郭を与え、ステージに華を添えるギタリスト。誰とでも明るく関われる社交性と、自分の意志を貫く強さを持つが、本当に誰かを必要とするときでさえ助けを求められず、その奥にある渇きを隠し続けている。",
    profile: { age: "27歳", height: "160cm", catchcopy: "限界の時ほど笑うギタリスト。", description: "社交性と行動力でバンドを前へ進める。" },
  },
  {
    slug: "hiyori-komiya", name: "小宮ひより", nameEn: "HIYORI KOMIYA", role: "Bass", status: "PUBLIC",
    image: "/images/members/v3/hiyori-komiya-press.jpg", alt: "2次元塗りの同じ撮影シリーズでベースを抱えるVEILのベーシスト小宮ひより",
    intro: "静かな佇まいとは対照的な、疾走感のあるベースラインで、VEILのグルーヴを支えながら、楽曲を力強く前へ進めるベーシスト。おっとりと穏やかに見えるが、欲しいものへの執着は4人の中でもひときわ強く、その激しさを柔らかな表情の下に隠している。",
    profile: { age: "25歳", height: "148cm", catchcopy: "静かな顔で、一番欲深いベーシスト。", description: "普段は穏やか、演奏では攻撃的な低音を響かせる。" },
  },
  {
    slug: "risa-shiraishi", name: "白石理沙", nameEn: "RISA SHIRAISHI", role: "Drums", status: "PUBLIC",
    image: "/images/members/v3/risa-shiraishi-press.jpg", alt: "2次元塗りの同じ撮影シリーズでスティックを自然に持つVEILのドラマー白石理沙",
    intro: "無駄のない正確なリズムと、緻密でテクニカルな演奏で、VEILの楽曲に独自の色と緊張感を与えるドラマー。冷静に人との距離を保ち、自分だけは感情に巻き込まれないと思っているが、その均衡が崩れたとき、自分に何が起こるのかをまだ知らない。",
    profile: { age: "29歳", height: "167cm", catchcopy: "静かに全体を支えるドラマー。", description: "冷静な視点でVEILの土台を作る。" },
  },
];

export const news = [
  { date: "2026.07.12", type: "STORY ZERO", title: "4人がVEILへ来るまでの記録を公開しました" },
  { date: "2026.07.12", type: "FORMATION", title: "PROLOGUE『最後の募集』を公開しました" },
  { date: "2026.07.12", type: "ARCHIVE", title: "結成前後の資料をArchiveに追加しました" },
];

export type GalleryItem = {
  record: string;
  category: string;
  title: string;
  caption: string;
  image: string;
  alt: string;
};

export type GalleryGroup = {
  id: "private" | "relations";
  eyebrow: string;
  title: string;
  copy: string;
  items: GalleryItem[];
};

export const galleryGroups: GalleryGroup[] = [
  {
    id: "private",
    eyebrow: "FILE 01 / ALONE",
    title: "ひとりでいるとき。",
    copy: "ひとりでいるときにだけ見せる、何気ない仕草を記す。",
    items: [
      { record: "LOG 001", category: "REINA / MORNING", title: "休日の朝", caption: "洗濯物を一枚ずつたたむ。休みの朝は、いつもより手がゆっくりだ。", image: "/images/gallery/v2/reina-morning-laundry.webp", alt: "洗濯物を畳みながら穏やかに微笑む雨宮玲奈" },
      { record: "LOG 002", category: "REINA / NIGHT", title: "帰りのあと", caption: "帰りの遅い夜。ヘッドホンをつけたまま、甘いものをひと口食べる。", image: "/images/gallery/v2/reina-night-dessert.webp", alt: "夜の部屋で音楽を聴きながらデザートを食べる雨宮玲奈" },
      { record: "LOG 003", category: "MIZUKI / SOUND", title: "予想外の音", caption: "思いがけない音が出て、先に笑った。どうやら気に入ったらしい。", image: "/images/gallery/v2/mizuki-effect-pedal.webp", alt: "中古楽器店でエフェクターを試し笑う神崎瑞希" },
      { record: "LOG 004", category: "MIZUKI / HOME", title: "父のカセット", caption: "中古で見つけたカセットデッキに、父が残したテープを入れる。知らない時代の一曲に、何度もギターを重ねている。", image: "/images/gallery/v2/mizuki-cassette-guitar.webp", alt: "自室で父が残したカセットテープに合わせてギターを弾く神崎瑞希" },
      { record: "LOG 005", category: "HIYORI / ROOM", title: "手の届く範囲", caption: "漫画もラジオもCDも、手を伸ばせば届くところにある。ここにいると、落ち着くらしい。", image: "/images/gallery/v2/hiyori-radio-room.webp", alt: "漫画やラジオに囲まれた部屋で過ごす小宮ひより" },
      { record: "LOG 006", category: "HIYORI / PRACTICE", title: "反復", caption: "誰もいない練習室で、同じところを何度も弾き直していた。納得するまで、やめない。", image: "/images/gallery/v2/hiyori-solo-practice.webp", alt: "個人練習スタジオでベースを弾く小宮ひより" },
      { record: "LOG 007", category: "RISA / RHYTHM", title: "成功したフィル", caption: "フィルがきれいに決まった。笑ったあとの一音は、少しだけ明るく聞こえた。", image: "/images/gallery/v2/risa-electronic-drums.webp", alt: "自宅の電子ドラムを叩きながら笑う白石理沙" },
      { record: "LOG 008", category: "RISA / LAUNDRY", title: "待ち時間", caption: "洗濯が終わるまで、あと少し。それでも曲の途中では、ヘッドホンを外さない。", image: "/images/gallery/v2/risa-laundromat.webp", alt: "コインランドリーでヘッドホンを着けて過ごす白石理沙" },
    ],
  },
  {
    id: "relations",
    eyebrow: "FILE 02 / WITH SOMEONE",
    title: "誰かといるとき。",
    copy: "誰かといるときにだけこぼれる、言葉と沈黙を記す。",
    items: [
      { record: "LOG 009", category: "REINA + MIZUKI", title: "選曲について", caption: "同じレコードに、二人の手が伸びた。譲らないまま、顔を見合わせて笑っていた。", image: "/images/gallery/v2/reina-mizuki-record-store.webp", alt: "レコード店で話す雨宮玲奈と神崎瑞希" },
      { record: "LOG 010", category: "HIYORI + RISA", title: "練習のあと", caption: "練習が終わると、決まって食べる話になる。今日も互いの皿をのぞき込んでいる。", image: "/images/gallery/v2/hiyori-risa-family-restaurant.webp", alt: "ファミリーレストランで食事を分け合う小宮ひよりと白石理沙" },
      { record: "LOG 011", category: "REINA + HIYORI", title: "帰り道の寄り道", caption: "帰り道のコンビニで、アイスを選ぶ。こういう日は、二人とも少しだけ帰るのが遅い。", image: "/images/gallery/v2/reina-hiyori-ice-cream.webp", alt: "コンビニでアイスを選ぶ雨宮玲奈と小宮ひより" },
      { record: "LOG 012", category: "MIZUKI + HIYORI + RISA", title: "まだ立ち上がらない", caption: "話が途切れても、誰も立ち上がらない。黙っていられるのも、仲のよさなのだと思う。", image: "/images/gallery/v2/mizuki-hiyori-risa-practice-break.webp", alt: "練習休憩中に床でくつろぐ神崎瑞希、小宮ひより、白石理沙" },
    ],
  },
];

export const archiveItems = [
  { id: "prelude-001", date: "2000.08.15", type: "PRELUDE", title: "Lilasées — Last Liveの記録", author: "個人所蔵資料", related: "高瀬真紀", image: "/images/archive/lilasees-records.png", body: "一枚のチケット半券と、ステージに立つ4人の記憶。『最後の募集』へつながる前史資料。" },
  { id: "recruitment-001", date: "2025.06.30", type: "RECRUITMENT", title: "女性4人組バンド メンバー募集", author: "高瀬真紀（募集担当）", related: "ALL MEMBERS", image: "/images/archive/takase-recruitment-poster.png", body: "音楽を終える前に、もう一度本気で続ける意思のある人へ向けた募集告知。" },
  { id: "application-001", date: "2025", type: "APPLICATION", title: "VEIL PROJECT 応募フォーム", author: "募集ページ記録", related: "ALL MEMBERS", image: "/images/archive/veil-application-form.png", body: "応募時に求められた基本情報、活動歴、音源・映像、音楽を続ける上で抱える事情の記録。" },
];

export const aboutParagraphs = [
  "VEILは、4人の女性によるバンドと、彼女たちを取り巻く時間を記録していくために始めたプロジェクトです。",
  "残したいのは、演奏している姿だけではありません。",
  "リハーサルや楽曲制作、撮影や取材。芸能活動やモデルの仕事、生活のために続けているアルバイト。楽屋での沈黙、帰り道の会話、誰にも見せない私生活。",
  "そして、ときには本人さえ認めたくない、私的で官能的な感情まで含まれます。",
  "人は、ひとつの顔だけで生きているわけではありません。",
  "私は、彼女たちのどれか一面だけを切り取り、それを本当の姿として見せたいわけではありません。",
  "音楽に向き合う姿も、働く姿も、誰かを求める姿も、迷い、間違い、選び直す姿も、すべて同じ一人の中にあります。",
  "VEILでは、バンドがどのように始まり、何を作り、どこへ向かうのかを描いていきます。同時に、4人がそれぞれ音楽以外の場所で何を経験し、何を隠し、何を選ぶのかも残していきます。",
  "彼女たちは現実に生きている人間ではありませんが、ここで生まれる音楽、ビジュアル、物語は実際の作品として残っていきます。",
  "VEILは、音楽だけでは表せなかった彼女たちの姿を記録していく場所です。",
];

export const navItems = ["MEMBERS", "LATEST", "GALLERY", "FORMATION", "ARCHIVE", "STORIES", "ABOUT", "MUSIC", "SUPPORT", "FOLLOW"];
