import { useLayoutEffect, useRef } from 'react';
import { clinic } from '../../content/clinic';
import { Counter, Fog, Parallax, Reveal, gsap, useMediaFlags } from '../../motion';
import styles from './index.module.css';

const { about } = clinic;

export default function About() {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion, coarsePointer } = useMediaFlags();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || coarsePointer) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(`.${styles.frame}`, root).forEach((frame) => {
        const img = frame.querySelector('img');
        if (!img) return;
        gsap.fromTo(
          img,
          { yPercent: -6, scale: 1.12 },
          {
            yPercent: 6,
            scale: 1.12,
            ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion, coarsePointer]);

  const [photo1, photo2] = about.photos;

  return (
    <section id="about" ref={rootRef} className={styles.root}>
      <Fog preset="soft" />
      <div className={`container ${styles.content}`}>
        <div className={styles.grid}>
          <Reveal className={styles.text}>
            <p className="eyebrow">{about.eyebrow}</p>
            <h2 className={styles.manifesto}>{about.manifesto}</h2>
          </Reveal>

          <div className={styles.photos}>
            {photo1 && (
              <Parallax speed={0.12} className={styles.photo1}>
                <div className={styles.frame}>
                  <img src={photo1.src} alt={photo1.alt} loading="lazy" decoding="async" />
                </div>
              </Parallax>
            )}
            {photo2 && (
              <Parallax speed={-0.08} className={styles.photo2}>
                <div className={`${styles.frame} ${styles.frameBordered}`}>
                  <img src={photo2.src} alt={photo2.alt} loading="lazy" decoding="async" />
                </div>
              </Parallax>
            )}
          </div>
        </div>

        <ul className={styles.counters}>
          {about.counters.map((c) => (
            <li key={c.label} className={styles.counter}>
              <Counter
                value={c.value}
                decimals={c.decimals}
                suffix={c.suffix}
                className={styles.counterValue}
              />
              <span className={styles.counterLabel}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
