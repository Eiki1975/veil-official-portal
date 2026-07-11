import { members } from "../data/veilContent";

export function Members() {
  return (
    <section className="section" id="members">
      <div className="section-heading">
        <h2>MEMBERS</h2>
      </div>
      <div className="member-grid">
        {members.map((member) => (
          <article className="member-card" key={member.name}>
            <div className="member-image-wrap">
              <img src={member.image} alt={member.alt} />
            </div>
            <div className="member-body">
              <div className="member-meta">
                <span>{member.role}</span>
                <span>{member.status}</span>
              </div>
              <h3>{member.name}</h3>
              <p>{member.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
