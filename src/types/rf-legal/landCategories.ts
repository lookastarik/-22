// src/types/rf-legal/landCategories.ts
export const RF_LAND_CATEGORIES = {
  AGRICULTURE:        '003001000000', // Земли сельскохозяйственного назначения
  SETTLEMENT:         '003002000000', // Земли населённых пунктов
  INDUSTRY:           '003003000000', // Земли промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, космического обеспечения, обороны, безопасности и иного специального назначения
  PROTECTED:          '003004000000', // Земли особо охраняемых территорий и объектов
  FOREST:             '003005000000', // Земли лесного фонда
  WATER:              '003006000000', // Земли водного фонда
  RESERVE:            '003007000000'  // Земли запаса
} as const;

export type RFLandCategory = typeof RF_LAND_CATEGORIES[keyof typeof RF_LAND_CATEGORIES];

export const RF_LAND_CATEGORY_LABELS: Record<RFLandCategory, string> = {
  [RF_LAND_CATEGORIES.AGRICULTURE]: 'Земли сельскохозяйственного назначения',
  [RF_LAND_CATEGORIES.SETTLEMENT]: 'Земли населённых пунктов (ИЖС/Офисы/МКД)',
  [RF_LAND_CATEGORIES.INDUSTRY]: 'Земли промышленности и спецназначения',
  [RF_LAND_CATEGORIES.PROTECTED]: 'Земли особо охраняемых территорий',
  [RF_LAND_CATEGORIES.FOREST]: 'Земли лесного фонда',
  [RF_LAND_CATEGORIES.WATER]: 'Земли водного фонда',
  [RF_LAND_CATEGORIES.RESERVE]: 'Земли запаса'
};
