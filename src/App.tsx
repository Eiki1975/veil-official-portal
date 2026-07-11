import { About } from "./components/About";
import { Episodes } from "./components/Episodes";
import { Footer } from "./components/Footer";
import { Gallery } from "./components/Gallery";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Join } from "./components/Join";
import { Members } from "./components/Members";
import { Seo } from "./components/Seo";
import { World } from "./components/World";

export default function App() {
  return (
    <>
      <Seo />
      <Header />
      <main>
        <Hero />
        <About />
        <Members />
        <Episodes />
        <Gallery />
        <World />
        <Join />
      </main>
      <Footer />
    </>
  );
}
