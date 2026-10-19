import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { clinic } from '../../content';
import { useSmoothScroll } from '../../motion';
import styles from './index.module.css';

const A11Y = {
  nav: 'Основная навигация',
  menu: 'Меню',
  open: 'Открыть меню',
  close: 'Закрыть меню',
  home: `${clinic.fullName} — на главную`,
} as const;

const SCROLL_THRESHOLD = 40;
const MENU_ID = 'mobile-menu';
const DESKTOP_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const menuLinks = [...clinic.menuExtra, ...clinic.nav];

export default function Header() {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > SCROLL_THRESHOLD);
  const [open, setOpen] = useState(false);
  const { scrollTo } = useSmoothScroll();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<(() => void) | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const targets = clinic.nav
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const href = `#${e.target.id}`;
          if (e.isIntersecting) visible.add(href);
          else visible.delete(href);
        });
        setActive(clinic.nav.find((item) => visible.has(item.href))?.href ?? null);
      },
      { rootMargin: '-45% 0px -54% 0px' },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const placeIndicator = useCallback(() => {
    const list = listRef.current;
    const pill = indicatorRef.current;
    if (!list || !pill) return;
    const target = hovered ?? active;
    const link = target ? list.querySelector<HTMLElement>(`a[href="${target}"]`) : null;
    if (!link) {
      pill.style.opacity = '0';
      return;
    }
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
    pill.style.opacity = '1';
  }, [active, hovered]);

  useLayoutEffect(placeIndicator, [placeIndicator]);
  useEffect(() => {
    window.addEventListener('resize', placeIndicator);
    return () => window.removeEventListener('resize', placeIndicator);
  }, [placeIndicator]);

  const unlock = useCallback(() => {
    lockRef.current?.();
    lockRef.current = null;
  }, []);

  const openMenu = useCallback(() => {
    const panel = panelRef.current;
    panel?.removeAttribute('data-nav');
    if (lockRef.current === null && panel) {
      panel.style.setProperty('--menu-top', `${window.scrollY}px`);
      const html = document.documentElement;
      const prevBg = html.style.backgroundColor;
      html.style.backgroundColor = getComputedStyle(panel).backgroundColor;
      const outside = (e: Event) => !(e.target instanceof Node && panel.contains(e.target));
      const block = (e: Event) => {
        if (outside(e)) e.preventDefault();
      };
      const keys = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
      const blockKeys = (e: KeyboardEvent) => {
        if (keys.has(e.key) && outside(e)) e.preventDefault();
      };
      const opts: AddEventListenerOptions = { passive: false };
      window.addEventListener('touchmove', block, opts);
      window.addEventListener('wheel', block, opts);
      window.addEventListener('keydown', blockKeys);
      lockRef.current = () => {
        html.style.backgroundColor = prevBg;
        window.removeEventListener('touchmove', block, opts);
        window.removeEventListener('wheel', block, opts);
        window.removeEventListener('keydown', blockKeys);
      };
    }
    setOpen(true);
  }, []);

  const closeMenu = useCallback(
    (restoreFocus: boolean) => {
      unlock();
      setOpen(false);
      if (restoreFocus) burgerRef.current?.focus();
    },
    [unlock],
  );

  useEffect(() => unlock, [unlock]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const burger = burgerRef.current;
    if (!panel || !burger) return;

    const raf = requestAnimationFrame(() => panel.querySelector<HTMLElement>(FOCUSABLE)?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [burger, ...Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))];
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active !== null && items.includes(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    const mq = window.matchMedia(DESKTOP_QUERY);
    const onMq = () => {
      if (mq.matches) closeMenu(false);
    };
    mq.addEventListener('change', onMq);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [open, closeMenu]);

  const onPanelLink = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href') ?? '';
    const panel = panelRef.current;
    panel?.setAttribute('data-nav', '');
    closeMenu(false);
    if (!href.startsWith('#')) return;
    e.preventDefault();
    scrollTo(href, { lead: Infinity });
    panel?.style.setProperty('--menu-top', `${window.scrollY}px`);
  };

  return (
    <>
      <header className={styles.root} data-scrolled={scrolled || undefined} data-open={open || undefined}>
        <div className={styles.bar}>
          <a href="#top" className={styles.logo} aria-label={A11Y.home}>
            {clinic.name}
            <span className={styles.dot}>.</span>
          </a>

          <nav className={styles.nav} aria-label={A11Y.nav}>
            <ul ref={listRef} className={styles.navList} onMouseLeave={() => setHovered(null)}>
              <li ref={indicatorRef} className={styles.indicator} aria-hidden="true" />
              {clinic.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={styles.navLink}
                    data-on={(hovered ?? active) === item.href || undefined}
                    aria-current={active === item.href ? 'location' : undefined}
                    onMouseEnter={() => setHovered(item.href)}
                    onFocus={() => setHovered(item.href)}
                    onBlur={() => setHovered(null)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.right}>
            <a href="#contacts" className={`btn-fx ${styles.btn} ${styles.btnPrimary}`}>
              {clinic.hero.ctaPrimary}
            </a>
            <button
              ref={burgerRef}
              type="button"
              className={styles.burger}
              aria-expanded={open}
              aria-controls={MENU_ID}
              aria-label={open ? A11Y.close : A11Y.open}
              onClick={() => (open ? closeMenu(false) : openMenu())}
            >
              <span className={styles.burgerLine} />
              <span className={styles.burgerLine} />
              <span className={styles.burgerLine} />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={panelRef}
        id={MENU_ID}
        className={styles.panel}
        data-open={open || undefined}
        role="dialog"
        aria-modal="true"
        aria-label={A11Y.menu}
        aria-hidden={!open}
        data-lenis-prevent=""
      >
        <div className={`container ${styles.panelInner}`}>
          <ul className={styles.panelList}>
            {menuLinks.map((item, i) => (
              <li key={item.href} className={styles.item} style={{ '--i': i } as CSSProperties}>
                <a href={item.href} className={styles.panelLink} onClick={onPanelLink} tabIndex={open ? 0 : -1}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={`${styles.item} ${styles.panelFooter}`} style={{ '--i': menuLinks.length } as CSSProperties}>
            <a href={clinic.phoneHref} className={styles.panelPhone} tabIndex={open ? 0 : -1}>
              {clinic.phone}
            </a>
            <a
              href="#contacts"
              className={`btn-fx ${styles.btn} ${styles.btnPrimary} ${styles.panelCta}`}
              onClick={onPanelLink}
              tabIndex={open ? 0 : -1}
            >
              {clinic.hero.ctaPrimary}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
