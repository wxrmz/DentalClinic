import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconArrowUpRight, IconPhone } from '@tabler/icons-react';
import { clinic } from '../../content/clinic';
import { contactsSection } from '../../content/contacts';
import { Parallax, Reveal, gsap, useMediaFlags } from '../../motion';
import styles from './index.module.css';

const pinLabel = `${clinic.name.charAt(0).toUpperCase()}${clinic.name.slice(1)} · ${clinic.address.replace(
  `${clinic.city}, `,
  '',
)}`;

const [OPEN_H, CLOSE_H] = clinic.openHours;
const hourFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: 'numeric', hourCycle: 'h23' });

function statusText(now: Date): { open: boolean; text: string } {
  const h = Number(hourFmt.format(now));
  const open = h >= OPEN_H && h < CLOSE_H;
  const c = contactsSection;
  return open
    ? { open, text: `${c.openNow} · ${c.until} ${CLOSE_H}:00` }
    : { open, text: `${c.closedNow} · ${c.opensAt} ${OPEN_H}:00` };
}

function useStatus() {
  const [status, setStatus] = useState(() => statusText(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setStatus(statusText(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return status;
}

function useMapReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMediaFlags();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    const q = (sel: string) => el.querySelector(`.${sel}`);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
      tl.fromTo(
        el,
        { opacity: 0, y: 40, clipPath: 'inset(8% 8% 8% 8% round 40px)' },
        { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.1, clearProps: 'clipPath' },
      )
        .from(q(styles.mapSvg), { scale: 1.15, duration: 1.6 }, 0)
        .from(q(styles.pinDrop), { opacity: 0, y: -36, duration: 0.7, ease: 'back.out(2.2)' }, 0.55)
        .from(q(styles.chip), { opacity: 0, y: 10, scale: 0.9, duration: 0.5, ease: 'back.out(1.8)' }, 0.85);
    }, el);
    return () => ctx.revert();
  }, [reducedMotion]);

  return ref;
}

function MapArt() {
  return (
    <svg
      className={styles.mapSvg}
      viewBox="0 0 600 460"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="600" height="460" fill="#263438" />
      <path
        d="M40 300c30-50 110-70 160-48s62 84 26 120-120 40-160 18-56-50-26-90z"
        fill="#2B4A42"
      />
      <path d="M430 40c40-14 110-6 132 30s-8 80-58 86-100-18-104-56 0-48 30-60z" fill="#2B4A42" />
      <path
        d="M-20 120C90 150 150 90 250 110s160 110 250 100 120-60 140-70"
        fill="none"
        stroke="#2A4650"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <g fill="none" stroke="#33464B" strokeLinecap="round">
        <path d="M-20 240H620" strokeWidth="12" />
        <path d="M300 -20V480" strokeWidth="12" />
        <path d="M-20 400L620 330" strokeWidth="9" />
        <path d="M120 -20L190 480" strokeWidth="8" />
        <path d="M470 -20L430 480" strokeWidth="10" />
        <path d="M300 240L620 60" strokeWidth="8" />
      </g>
      <g fill="none" stroke="#43585D" strokeWidth="1" strokeDasharray="6 8">
        <path d="M-20 240H620" />
        <path d="M300 -20V480" />
        <path d="M-20 400L620 330" />
        <path d="M120 -20L190 480" />
        <path d="M470 -20L430 480" />
        <path d="M300 240L620 60" />
      </g>
    </svg>
  );
}

export default function Contacts() {
  const status = useStatus();
  const c = contactsSection;
  const mapRef = useMapReveal();

  return (
    <section id="contacts" className={`on-dark ${styles.root}`}>
      <div className={`container ${styles.content}`}>
        <div className={styles.grid}>
          <div className={styles.info}>
            <Reveal>
              <p className="eyebrow">{c.eyebrow}</p>
              <h2 className={styles.title}>{c.title}</h2>
            </Reveal>

            <Reveal delay={0.1}>
              <a href={clinic.phoneHref} className={styles.phone}>
                {clinic.phone}
              </a>
              <p className={styles.status} data-open={status.open || undefined}>
                <span className={styles.statusDot} aria-hidden="true" />
                {status.text}
              </p>
              <div className={styles.buttons}>
                <a href={clinic.phoneHref} className={`btn-fx ${styles.btn} ${styles.btnPrimary}`}>
                  <IconPhone size={18} stroke={2} aria-hidden="true" />
                  {c.call}
                </a>
                <a
                  href={clinic.routeHref}
                  target="_blank"
                  rel="noopener"
                  className={`btn-fx ${styles.btn} ${styles.btnSecondary}`}
                >
                  {c.route}
                  <IconArrowUpRight size={18} stroke={2} aria-hidden="true" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <dl className={styles.facts}>
                <div>
                  <dt>{c.facts.address}</dt>
                  <dd>{clinic.address}</dd>
                </div>
                <div>
                  <dt>{c.facts.metro}</dt>
                  <dd>{clinic.metro}</dd>
                </div>
                <div>
                  <dt>{c.facts.hours}</dt>
                  <dd>{clinic.hours}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Parallax speed={0.08} className={styles.mapWrap}>
            <div ref={mapRef} className={styles.map}>
              <MapArt />
              <div className={styles.pin} aria-hidden="true">
                <span className={styles.pinDrop}>
                  <span className={styles.ring} />
                  <span className={`${styles.ring} ${styles.ring2}`} />
                  <span className={styles.dot} />
                </span>
                <span className={styles.chip}>{pinLabel}</span>
              </div>
            </div>
          </Parallax>
        </div>
      </div>
    </section>
  );
}
