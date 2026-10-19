import { Accordion, type AccordionItem } from '../../components/Accordion';
import { clinic } from '../../content/clinic';
import { faq, faqSection } from '../../content/faq';
import { Reveal } from '../../motion';
import styles from './index.module.css';

const items: AccordionItem[] = faq.map((f, i) => ({
  id: `faq-${i}`,
  title: f.q,
  content: <p className={styles.answer}>{f.a}</p>,
}));

export default function Faq() {
  return (
    <section id="faq" className={`on-dark ${styles.root}`}>
      <div className={`container ${styles.layout}`}>
        <Reveal className={styles.intro}>
          <p className="eyebrow">{faqSection.eyebrow}</p>
          <h2 className={styles.title}>{faqSection.title}</h2>
          <p className={styles.hint}>
            {faqSection.hint}{' '}
            <a className={styles.phone} href={clinic.phoneHref}>
              {clinic.phone}
            </a>
          </p>
        </Reveal>
        <Reveal y={24} delay={0.1}>
          <Accordion items={items} defaultOpenId={items[0]?.id ?? null} />
        </Reveal>
      </div>
    </section>
  );
}
