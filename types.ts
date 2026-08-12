export enum LifeSkill {
    DESAIN_GRAFIS = "Desain Grafis",
    OTOMOTIF = "Otomotif",
    TATA_BOGA = "Tata Boga",
    CLOTHING_LINE = "Clothing Line",
    SETIR_MOBIL = "Setir Mobil",
    TATA_RIAS = "Tata Rias",
}

export const CLASS_LEVELS = [
    "11.1", "11.2", "11.3", "11.4", 
    "11.5", "11.6", "11.7", "11.8"
] as const;

export type ClassLevel = typeof CLASS_LEVELS[number];

export type Gender = 'Laki-laki' | 'Perempuan';

export interface Student {
    id: string;
    nis: string;
    fullName: string;
    classLevel: ClassLevel;
    whatsappNumber: string;
    lifeSkill: LifeSkill | null;
    jenisKelamin: Gender;
    createdAt?: string;
    updatedAt?: string;
}

export interface MasterStudentImportItem {
    nis: string;
    fullName: string;
    classLevel: string;
    jenisKelamin: string;
    whatsappNumber?: string;
}

export interface SkillSetting {
    skill: LifeSkill;
    disabled: boolean;
    reason?: string;
}
