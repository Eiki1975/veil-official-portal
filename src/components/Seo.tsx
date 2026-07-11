import { seo, siteUrl } from "../data/veilContent";

export function Seo() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "VEIL",
    url: siteUrl,
    image: seo.image,
    description: seo.description,
    inLanguage: "ja",
    genre: ["大人向け心理フィクション", "ガールズバンド小説", "一人称小説"],
    about: "成人女性4人による架空のガールズバンドを題材にした創作プロジェクト",
    fictional: true,
    character: ["雨宮玲奈", "神崎瑞希", "小宮ひより", "白石理沙"],
  };

  return <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>;
}
