// src/types/rf-legal/buildingPurpose.ts
export enum RFBuildingPurpose {
  RESIDENTIAL = 'RESIDENTIAL',       // Жилые (ЖК РФ)
  NON_RESIDENTIAL = 'NON_RESIDENTIAL', // Нежилые
  INDUSTRIAL = 'INDUSTRIAL',         // Производственные
  AGRICULTURAL = 'AGRICULTURAL',     // Сельхоз
  LINEAR = 'LINEAR',                 // Линейные (трубопроводы, ЛЭП)
  UNFINISHED = 'UNFINISHED'          // Объекты незавершённого строительства
}

export const RF_RESIDENTIAL_TYPES = {
  HOUSE:          'house',          // Жилой дом (отдельно стоящий, <=3 этажей)
  APARTMENT:      'apartment',      // Квартира
  ROOM:           'room',           // Комната
  BLOCKED_HOUSE:  'blocked_house',  // Часть жилого дома блокированного типа
  MANSION:        'mansion'         // Индивидуальный жилой дом (ИЖС)
} as const;

export type RFResidentialType = typeof RF_RESIDENTIAL_TYPES[keyof typeof RF_RESIDENTIAL_TYPES];

export const APARTMENTS_LEGAL_STATUS = {
  residential: false,         // Без регистрации по месту жительства
  utilities: 'commercial',    // Тарифы как для юрлиц (+30-50%)
  tax: 0.5,                   // Ставка налога 0.5% vs 0.1% у квартир
  maternityCapital: false,    // Мат.капитал использовать нельзя
  mortgageSubsidy: false      // Льготная ипотека недоступна
} as const;
