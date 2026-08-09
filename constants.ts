
import { LifeSkill, CLASS_LEVELS } from './types';

export const APP_LOGO = 'https://iili.io/CuUOpWJ.png';

// Dynamic API Base URL (defaults to relative '/api', or uses VITE_API_URL if provided)
export const API_BASE_URL = (((import.meta as any).env?.VITE_API_URL as string) || '/api').replace(/\/+$/, '');

export const LIFE_SKILL_OPTIONS: LifeSkill[] = [
    LifeSkill.DESAIN_GRAFIS,
    LifeSkill.OTOMOTIF,
    LifeSkill.TATA_BOGA,
    LifeSkill.CLOTHING_LINE,
    LifeSkill.SETIR_MOBIL,
    LifeSkill.TATA_RIAS,
];

export const LIFE_SKILL_QUOTAS: Record<LifeSkill, number> = {
    [LifeSkill.DESAIN_GRAFIS]: 35,
    [LifeSkill.OTOMOTIF]: 42,
    [LifeSkill.TATA_BOGA]: 70,
    [LifeSkill.CLOTHING_LINE]: 35,
    [LifeSkill.SETIR_MOBIL]: 63,
    [LifeSkill.TATA_RIAS]: 40,
};

export const CLASS_OPTIONS: readonly string[] = CLASS_LEVELS;
