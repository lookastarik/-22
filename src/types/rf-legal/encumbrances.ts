// src/types/rf-legal/encumbrances.ts
export const RF_ENCUMBRANCES = {
  MORTGAGE:         'mortgage',         // Ипотека (102-ФЗ)
  LEASE:            'lease',            // Долгосрочная аренда (>1 года)
  EASEMENT:         'easement',         // Сервитут (ЗК РФ ст. 23)
  ARREST:           'arrest',           // Арест (судебный)
  TRUST_MANAGEMENT: 'trust',            // Доверительное управление
  CONCESSION:       'concession',       // Концессионное соглашение (115-ФЗ)
  HERITAGE:         'heritage',         // ОКН (памятник, 73-ФЗ)
  SANITARY_ZONE:    'sanitary',         // Санитарно-защитная зона
  AVIATION:         'aviation',         // Авиаохранные зоны
  CULTURAL_LAYER:   'cultural_layer',   // Культурный слой (археология)
  RED_LINES:        'red_lines'         // Красные линии (ГрК РФ)
} as const;

export type RFEncumbrance = typeof RF_ENCUMBRANCES[keyof typeof RF_ENCUMBRANCES];

export const RF_ENCUMBRANCE_LABELS: Record<RFEncumbrance, string> = {
  mortgage: 'Ипотека (102-ФЗ)',
  lease: 'Долгосрочная аренда (>1 года)',
  easement: 'Сервитут (ЗК РФ ст. 23)',
  arrest: '🔴 Судебный арест',
  trust: 'Доверительное управление',
  concession: 'Концессия (115-ФЗ)',
  heritage: '🔴 Культурное наследие (ОКН 73-ФЗ)',
  sanitary: '🔴 Санитарно-защитная зона (СЗЗ)',
  aviation: 'Авиаохранная зона',
  cultural_layer: 'Культурный слой (археология)',
  red_lines: '🔴 Красные линии застройки'
};
