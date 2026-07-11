import { about } from "../data/veilContent";

export function About() {
  return (
    <section className="section about-section" id="about">
      <div className="section-heading">
        <h2>ABOUT VEIL</h2>
      </div>
      <p className="lead">{about}</p>
    </section>
  );
}
