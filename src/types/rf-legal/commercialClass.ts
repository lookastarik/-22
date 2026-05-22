// src/types/rf-legal/commercialClass.ts
export const RF_COMMERCIAL_CLASSES = {
  AP: 'A+',  // Premium Grade
  A:  'A',   // Grade A
  BP: 'B+',  // Grade B+
  B:  'B',   // Grade B
  C:  'C'    // Grade C
} as const;

export type RFCommercialClass = typeof RF_COMMERCIAL_CLASSES[keyof typeof RF_COMMERCIAL_CLASSES];

export const RF_RETAIL_FORMATS = {
  MALL:          'mall',          // ТРЦ (>15 000 кв.м GLA)
  DISTRICT:      'district',      // Окружной центр (5-15k кв.м)
  NEIGHBORHOOD:  'neighborhood',  // Районный (1-5k кв.м)
  STREET_RETAIL: 'street_retail', // Стрит-ритейл (1 этаж жилого дома)
  CONVENIENCE:   'convenience'    // Магазин у дома (<1000 кв.м)
} as const;

export type RFRetailFormat = typeof RF_RETAIL_FORMATS[keyof typeof RF_RETAIL_FORMATS];

export const RF_FIRE_RESISTANCE = {
  I:    'I',    // Высотные здания, ТРЦ
  II:   'II',   // Многоэтажные офисы, МКД
  III:  'III',  // Малоэтажные (до 5 этажей)
  IV:   'IV',   // Деревянные здания
  V:    'V'     // Без требований
} as const;

export type RFFireResistance = typeof RF_FIRE_RESISTANCE[keyof typeof RF_FIRE_RESISTANCE];

export const RF_ENERGY_CLASSES = {
  APP:  'A++',  // Высочайший
  AP:   'A+',  // Повышенный
  A:    'A',   // Высокий
  B:    'B',   // Нормальный
  C:    'C',   // Пониженный
  D:    'D',   // Низкий
  E:    'E'    // Очень низкий (запрет на ввод с 2025)
} as const;

export type RFEnergyClass = typeof RF_ENERGY_CLASSES[keyof typeof RF_ENERGY_CLASSES];

export const RF_DEPRECIATION_LEVELS = {
  GOOD:          { min: 0,  max: 20, label: 'Хорошее' },
  SATISFACTORY:  { min: 21, max: 40, label: 'Удовлетворительное' },
  UNSATISFACTORY:{ min: 41, max: 60, label: 'Неудовлетворительное' },
  UNFIT:         { min: 61, max: 80, label: 'Непригодное' },
  CONDEMNED:     { min: 81, max: 100, label: 'Аварийное (под снос)' }
} as const;
