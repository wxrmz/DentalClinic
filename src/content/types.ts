export type ServiceId =
  | 'caries'
  | 'hygiene'
  | 'implants'
  | 'prosthetics'
  | 'orthodontics'
  | 'whitening'
  | 'surgery';

export type ServiceIcon =
  | 'dental'
  | 'sparkles'
  | 'screw'
  | 'crown'
  | 'brackets'
  | 'sun'
  | 'first-aid';

export interface SectionHeading {
  eyebrow: string;
  title: string;
}

export interface Stat {
  value: number;
  label: string;
  decimals?: number;
  suffix?: string;
  star?: boolean;
}

export interface Photo {
  src: string;
  alt: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Hero {
  eyebrow: string;
  titleLines: string[];
  titleAccent: string;
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: Stat[];
}

export interface About {
  eyebrow: string;
  manifesto: string;
  photos: Photo[];
  counters: Stat[];
}

export interface Clinic {
  name: string;
  fullName: string;
  city: string;
  phone: string;
  phoneHref: string;
  address: string;
  metro: string;
  hours: string;
  openHours: [number, number];
  routeHref: string;
  rating: number;
  hero: Hero;
  about: About;
  nav: NavLink[];
  menuExtra: NavLink[];
}

export interface Service {
  id: ServiceId;
  title: string;
  short: string;
  priceFrom: number;
  icon: ServiceIcon;
}

export interface ServicesSection extends SectionHeading {
  previewNote: string;
  cta: string;
  pricesLink: string;
}

export interface DoctorsSection extends SectionHeading {
  visibleCount: number;
  expandLabel: string;
  collapseLabel: string;
}

export interface Doctor {
  name: string;
  role: string;
  experienceYears: number;
  avatar: DoctorAvatar;
  alt: string;
}

export type DoctorAvatar =
  | 'anna'
  | 'igor'
  | 'maria'
  | 'oleg'
  | 'elena'
  | 'dmitry'
  | 'natalia'
  | 'artem'
  | 'svetlana'
  | 'aleksey'
  | 'ksenia'
  | 'mikhail';

export interface PricesSection extends SectionHeading {
  note: string;
}

export interface PriceItem {
  name: string;
  price: number | null;
  from?: boolean;
  preset?: number;
}

export interface PriceCategory {
  id: ServiceId;
  title: string;
  items: PriceItem[];
}

export interface CalculatorText {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  clear: string;
  all: string;
  notFound: string;
  add: string;
  remove: string;
  free: string;
  from: string;
  itemForms: [string, string, string];
  toEstimate: string;
  paymentLabel: string;
  total: string;
  cta: string;
  receiptTitle: string;
  empty: string;
  payNow: string;
  months: number[];
  monthsSuffix: string;
  perMonth: string;
}

export type ReviewSource = 'Яндекс Карты' | 'ПроДокторов' | '2ГИС';

export interface ReviewsSummary {
  count: string;
  sources: { name: ReviewSource; rating: string }[];
}

export interface Review {
  name: string;
  initials: string;
  source: ReviewSource;
  rating: number;
  text: string;
}

export interface FaqSection extends SectionHeading {
  hint: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ContactsSection extends SectionHeading {
  call: string;
  route: string;
  openNow: string;
  closedNow: string;
  until: string;
  opensAt: string;
  facts: { address: string; metro: string; hours: string };
}

export interface Footer {
  copyright: string;
}
