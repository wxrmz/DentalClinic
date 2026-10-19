import type { Service, ServicesSection } from './types';

export const servicesSection: ServicesSection = {
  eyebrow: 'Услуги',
  title: 'Всё для здоровой улыбки',
  previewNote: 'Консультация и план лечения — бесплатно.',
  cta: 'Записаться',
  pricesLink: 'Цены',
};

export const services: Service[] = [
  { id: 'caries', title: 'Лечение кариеса', short: 'Пломбы, которые не видно и не чувствуется', priceFrom: 3500, icon: 'dental' },
  { id: 'hygiene', title: 'Гигиена', short: 'Чистка Air Flow, ультразвук и полировка', priceFrom: 4900, icon: 'sparkles' },
  { id: 'implants', title: 'Имплантация', short: 'Импланты под ключ с гарантией', priceFrom: 55000, icon: 'screw' },
  { id: 'prosthetics', title: 'Протезирование', short: 'Коронки и виниры из керамики и циркония', priceFrom: 18000, icon: 'crown' },
  { id: 'orthodontics', title: 'Брекеты и элайнеры', short: 'Ровные зубы в любом возрасте', priceFrom: 65000, icon: 'brackets' },
  { id: 'whitening', title: 'Отбеливание', short: 'На несколько тонов светлее за один визит', priceFrom: 15000, icon: 'sun' },
  { id: 'surgery', title: 'Хирургия', short: 'Удаление зубов, включая зубы мудрости', priceFrom: 4000, icon: 'first-aid' },
];
