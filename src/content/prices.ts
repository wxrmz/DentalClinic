import type { PriceCategory, PricesSection } from './types';

export const pricesSection: PricesSection = {
  eyebrow: 'Цены',
  title: 'Честно и заранее',
  note: 'Точная стоимость — после бесплатной консультации',
};

export const priceCategories: PriceCategory[] = [
  {
    id: 'caries',
    title: 'Лечение кариеса',
    items: [
      { name: 'Консультация', price: null, preset: 1 },
      { name: 'Прицельный снимок', price: 600 },
      { name: 'Пломба из светоотверждаемого материала', price: 3500, from: true, preset: 1 },
      { name: 'Лечение каналов, один канал', price: 9000, from: true },
      { name: 'Художественная реставрация', price: 7500, from: true },
    ],
  },
  {
    id: 'hygiene',
    title: 'Гигиена',
    items: [
      { name: 'Профчистка Air Flow и ультразвук', price: 4900, preset: 1 },
      { name: 'Полировка и фторирование', price: 1500 },
      { name: 'Обучение чистке зубов', price: null },
      { name: 'Лечение дёсен, одно посещение', price: 3200, from: true },
    ],
  },
  {
    id: 'implants',
    title: 'Имплантация',
    items: [
      { name: 'Консультация хирурга и КТ', price: null },
      { name: 'Имплант Osstem под ключ', price: 55000 },
      { name: 'Имплант Straumann под ключ', price: 95000 },
      { name: 'Синус-лифтинг', price: 35000, from: true },
      { name: 'Костная пластика', price: 25000, from: true },
    ],
  },
  {
    id: 'prosthetics',
    title: 'Протезирование',
    items: [
      { name: 'Коронка из металлокерамики', price: 18000 },
      { name: 'Коронка из диоксида циркония', price: 25000 },
      { name: 'Керамический винир E.max', price: 35000 },
      { name: 'Съёмный протез', price: 40000, from: true },
    ],
  },
  {
    id: 'orthodontics',
    title: 'Брекеты и элайнеры',
    items: [
      { name: 'Консультация ортодонта', price: null },
      { name: 'Металлические брекеты, одна челюсть', price: 65000 },
      { name: 'Керамические брекеты, одна челюсть', price: 90000 },
      { name: 'Элайнеры, курс лечения', price: 180000, from: true },
      { name: 'Ретейнер', price: 9000 },
    ],
  },
  {
    id: 'whitening',
    title: 'Отбеливание',
    items: [
      { name: 'Отбеливание Zoom', price: 15000 },
      { name: 'Домашнее отбеливание с капами', price: 12000 },
      { name: 'Внутриканальное отбеливание, один зуб', price: 4500 },
    ],
  },
  {
    id: 'surgery',
    title: 'Хирургия',
    items: [
      { name: 'Простое удаление зуба', price: 4000 },
      { name: 'Сложное удаление зуба', price: 7000, from: true },
      { name: 'Удаление зуба мудрости', price: 9500, from: true },
      { name: 'Резекция верхушки корня', price: 14000 },
    ],
  },
];
