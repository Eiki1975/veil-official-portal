import { episodes } from "../data/veilContent";

export function Episodes() {
  return (
    <section className="section episodes-section" id="episodes">
      <div className="section-heading">
        <h2>EPISODES</h2>
      </div>
      <div className="episode-layout">
        <article className="episode-feature">
          <span>{episodes[0].status}</span>
          <h3>{episodes[0].title}</h3>
          <p>{episodes[0].text}</p>
          <div className="adult-note">
            作品本文には成人向け表現を含みます。本文ページへ進む前に、年齢確認と注意文を表示できる構成です。
          </div>
          <div className="episode-actions">
            {episodes[0].ctas?.map((cta) => (
              <a className="button primary" href="#" key={cta}>
                {cta}
              </a>
            ))}
          </div>
        </article>
        <div className="episode-list">
          {episodes.slice(1).map((episode) => (
            <article className="episode-mini" key={episode.title}>
              <span>{episode.status}</span>
              <h3>{episode.title}</h3>
              <p>{episode.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
