// src/types/rf-legal/RFRealEstate.ts
import { RFLandCategory } from './landCategories';
import { RFBuildingPurpose } from './buildingPurpose';
import { RFCommercialClass, RFFireResistance, RFEnergyClass } from './commercialClass';
import { RFEncumbrance } from './encumbrances';

export const RF_EGRN_STATUSES = {
  REGISTERED:       'registered',       // Учтённый
  PREVIOUS:         'previous',         // Ранее учтённый
  TEMPORARY:        'temporary',        // Временный
  ANNULLED:         'annulled',         // Аннулированный
  ARCHIVE:          'archive'           // Архивный
} as const;

export type RFEgrnStatus = typeof RF_EGRN_STATUSES[keyof typeof RF_EGRN_STATUSES];

export const RF_OWNERSHIP_TYPES = {
  PRIVATE:          'private',          // Частная
  STATE:            'state',            // Государственная
  MUNICIPAL:        'municipal',        // Муниципальная
  FEDERAL:          'federal'           // Федеральная
} as const;

export type RFOwnershipType = typeof RF_OWNERSHIP_TYPES[keyof typeof RF_OWNERSHIP_TYPES];

export interface RFRealEstate {
  // Идентификация
  cadastralNumber: string;          // 77:01:0001001:4432
  egrnStatus: RFEgrnStatus;
  
  // Земельный участок
  landCategory: RFLandCategory;
  vri: string;                       // код ВРИ из Приказа П/0336
  vriMain: string;
  vriAuxiliary: string[];
  landArea: number;                  // м²
  
  // Здание
  purpose: RFBuildingPurpose;
  commercialClass?: RFCommercialClass;
  residentialType?: string;
  
  // Технические
  fireResistance: RFFireResistance;
  energyClass: RFEnergyClass;
  depreciation: number;              // 0-100%
  yearBuilt: number;
  totalArea: number;                 // м²
  levels: number;
  
  // Юридические
  ownershipType: RFOwnershipType;
  encumbrances: RFEncumbrance[];
  
  // Инвестиционные
  okpd2Code: string;                 // ОКПД2 код
  okvedCode: string;                 // ОКВЭД эксплуатации
}

export const validateCadastralNumber = (cad: string): boolean => {
  // Формат: 77:01:0001001:4432 или похожего типа
  const regex = /^\d{2}:\d{2}:\d{6,7}:\d{1,}$/;
  return regex.test(cad);
};

export const extractRegion = (cad: string): number | null => {
  if (!validateCadastralNumber(cad)) return null;
  return parseInt(cad.split(':')[0]);
};
