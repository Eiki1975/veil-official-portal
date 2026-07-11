import { links } from "../data/veilContent";

export function Join() {
  return (
    <section className="section join-section" id="join">
      <div className="section-heading">
        <h2>JOIN</h2>
      </div>
      <form className="notify-form">
        <label htmlFor="email">更新通知を受け取る</label>
        <div>
          <input id="email" name="email" type="email" placeholder="mail@example.com" />
          <button type="submit">登録</button>
        </div>
      </form>
      <div className="link-row">
        {links.map((link) => (
          <a href={link.href} key={link.label}>
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
