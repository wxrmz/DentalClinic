import type { Doctor, DoctorsSection } from './types';

export const doctorsSection: DoctorsSection = {
  eyebrow: 'Врачи',
  title: 'Наша команда',
  visibleCount: 8,
  expandLabel: 'Показать ещё 4 врача',
  collapseLabel: 'Свернуть',
};

const portrait = (name: string, role: string) => `Иллюстрированный портрет: ${name}, ${role}`;

export const doctors: Doctor[] = [
  { name: 'Анна Соколова', role: 'Главный врач, терапевт', experienceYears: 18, avatar: 'anna', alt: portrait('Анна Соколова', 'главный врач') },
  { name: 'Игорь Белов', role: 'Хирург-имплантолог', experienceYears: 14, avatar: 'igor', alt: portrait('Игорь Белов', 'хирург-имплантолог') },
  { name: 'Мария Ким', role: 'Стоматолог-терапевт', experienceYears: 9, avatar: 'maria', alt: portrait('Мария Ким', 'стоматолог-терапевт') },
  { name: 'Олег Романов', role: 'Ортодонт', experienceYears: 12, avatar: 'oleg', alt: portrait('Олег Романов', 'ортодонт') },
  { name: 'Елена Морозова', role: 'Пародонтолог', experienceYears: 11, avatar: 'elena', alt: portrait('Елена Морозова', 'пародонтолог') },
  { name: 'Дмитрий Волков', role: 'Челюстно-лицевой хирург', experienceYears: 16, avatar: 'dmitry', alt: portrait('Дмитрий Волков', 'челюстно-лицевой хирург') },
  { name: 'Наталья Лебедева', role: 'Гигиенист', experienceYears: 7, avatar: 'natalia', alt: portrait('Наталья Лебедева', 'гигиенист') },
  { name: 'Артём Ковалёв', role: 'Стоматолог-ортопед', experienceYears: 10, avatar: 'artem', alt: portrait('Артём Ковалёв', 'стоматолог-ортопед') },
  { name: 'Светлана Орлова', role: 'Эстетический стоматолог', experienceYears: 13, avatar: 'svetlana', alt: portrait('Светлана Орлова', 'эстетический стоматолог') },
  { name: 'Алексей Никитин', role: 'Анестезиолог', experienceYears: 15, avatar: 'aleksey', alt: portrait('Алексей Никитин', 'анестезиолог') },
  { name: 'Ксения Павлова', role: 'Эндодонтист', experienceYears: 8, avatar: 'ksenia', alt: portrait('Ксения Павлова', 'эндодонтист') },
  { name: 'Михаил Егоров', role: 'Рентгенолог', experienceYears: 21, avatar: 'mikhail', alt: portrait('Михаил Егоров', 'рентгенолог') },
];
