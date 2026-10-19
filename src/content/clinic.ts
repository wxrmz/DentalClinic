import type { Clinic } from './types';

const address = 'Москва, ул. Мятная, 12';

export const clinic: Clinic = {
  name: 'мята',
  fullName: 'Семейная стоматология «Мята»',
  city: 'Москва',
  phone: '+7 495 000-00-00',
  phoneHref: 'tel:+74950000000',
  address,
  metro: 'м. Тверская, 5 минут пешком',
  hours: 'Ежедневно 9:00–21:00',
  openHours: [9, 21],
  routeHref: 'https://yandex.ru/maps/?text=' + encodeURIComponent(address),
  rating: 4.9,
  hero: {
    eyebrow: 'Семейная стоматология · Москва',
    titleLines: ['Лечим зубы', 'всей семьёй'],
    titleAccent: 'без страха',
    lead: 'От профчистки до имплантов. Бережно, понятно и по честной цене.',
    ctaPrimary: 'Записаться',
    ctaSecondary: 'Услуги и цены',
    stats: [
      { value: 15, label: 'лет работы' },
      { value: 12, label: 'врачей' },
      { value: 4.9, decimals: 1, label: 'рейтинг', star: true },
    ],
  },
  about: {
    eyebrow: 'О клинике',
    manifesto:
      'Мы лечим так, как лечили бы своих детей и родителей: не торопимся, объясняем каждый шаг, называем цену до начала работы и не предлагаем того, что вам не нужно.',
    photos: [
      { src: '/images/about-1.jpg', alt: 'Светлый кабинет клиники «Мята» со стоматологическим креслом' },
      { src: '/images/about-2.jpg', alt: 'Светлая стойка ресепшн в клинике «Мята»' },
    ],
    counters: [
      { value: 15, label: 'лет работаем' },
      { value: 15000, suffix: '+', label: 'пациентов' },
      { value: 12, label: 'врачей' },
      { value: 98, suffix: '%', label: 'рекомендуют нас' },
    ],
  },
  nav: [
    { label: 'Услуги', href: '#services' },
    { label: 'Цены', href: '#prices' },
    { label: 'Врачи', href: '#doctors' },
    { label: 'Отзывы', href: '#reviews' },
    { label: 'Контакты', href: '#contacts' },
  ],
  menuExtra: [{ label: 'О клинике', href: '#about' }],
};
