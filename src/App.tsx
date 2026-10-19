import Header from './components/Header';
import Preloader from './sections/Preloader';
import Hero from './sections/Hero';
import About from './sections/About';
import Services from './sections/Services';
import Prices from './sections/Prices';
import Doctors from './sections/Doctors';
import Reviews from './sections/Reviews';
import Faq from './sections/Faq';
import Contacts from './sections/Contacts';
import Footer from './sections/Footer';
import { PageFog } from './motion';

export default function App() {
  return (
    <>
      <PageFog />
      <Preloader />
      <Header />
      <main data-glide="1">
        <Hero />
        <About />
        <Services />
        <Prices />
        <Doctors />
        <Reviews />
        <Contacts />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
