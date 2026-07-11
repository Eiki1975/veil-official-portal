import { hero } from "../data/veilContent";

export function Hero() {
  return (
    <section className="hero" id="top">
      <img className="hero-image" src={hero.image} alt={hero.alt} />
      <div className="hero-scrim" />
      <div className="hero-content">
        <h1>{hero.title}</h1>
        <p className="hero-copy">{hero.copy}</p>
        <p className="hero-subcopy">{hero.subcopy}</p>
        <div className="hero-actions">
          <a className="button primary" href="#episodes">
            {hero.primaryCta}
          </a>
          <a className="button secondary" href="#about">
            {hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
