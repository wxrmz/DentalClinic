import { useEffect } from 'react';
import { clinic } from '../../content/clinic';
import { footer } from '../../content/contacts';
import styles from './index.module.css';

export default function Footer() {
  useEffect(() => {
    const html = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const lightTheme = meta?.content ?? '';
    const darkTheme = getComputedStyle(html).getPropertyValue('--graphite').trim();
    const dark = document.querySelectorAll('.on-dark');
    const under = new Set<Element>();
    const setZone = (on: boolean) => {
      html.toggleAttribute('data-dark-zone', on);
      if (meta) meta.content = on ? darkTheme : lightTheme;
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
        setZone(under.size > 0);
      },
      { rootMargin: '0px 0px -99% 0px' },
    );
    dark.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      setZone(false);
    };
  }, []);

  return (
    <footer className={`on-dark ${styles.root}`} data-glide="1">
      <div className="container">
        <div className={styles.inner}>
          <a href="#top" className={styles.logo} aria-label={clinic.fullName}>
            {clinic.name}
            <span className={styles.dot}>.</span>
          </a>
          <nav className={styles.nav}>
            {clinic.nav.map((l) => (
              <a key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </a>
            ))}
          </nav>
          <p className={styles.copy}>{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
