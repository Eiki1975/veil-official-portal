import { useState } from "react";
import { gallery } from "../data/veilContent";

export function Gallery() {
  const [active, setActive] = useState<(typeof gallery)[number] | null>(null);

  return (
    <section className="section" id="gallery">
      <div className="section-heading">
        <h2>GALLERY</h2>
      </div>
      <div className="gallery-grid">
        {gallery.map((item) => (
          <button className="gallery-item" type="button" key={item.category} onClick={() => setActive(item)}>
            <img src={item.image} alt={item.alt} />
            <span>{item.category}</span>
          </button>
        ))}
      </div>
      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          <button type="button" className="lightbox-close" aria-label="閉じる">
            Close
          </button>
          <img src={active.image} alt={active.alt} />
        </div>
      )}
    </section>
  );
}
