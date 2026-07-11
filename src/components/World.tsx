import { world } from "../data/veilContent";

export function World() {
  return (
    <section className="section world-section" id="world">
      <h2>WORLD</h2>
      <div className="world-copy">
        {world.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="fiction-notice">{world.notice}</p>
    </section>
  );
}
