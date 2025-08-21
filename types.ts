export enum LifeSkill {
    TATA_RIAS = "Tata Rias",
    TATA_BOGA = "Tata Boga",
    TATA_BUSANA = "Tata Busana",
    SETIR_MOBIL = "Setir Mobil",
    DESAIN_GRAFIS = "Desain Grafis",
    OTOMOTIF = "Otomotif",
}

export const CLASS_LEVELS = [
    "11.1", "11.2", "11.3", "11.4", 
    "11.5", "11.6", "11.7", "11.8"
] as const;

export type ClassLevel = typeof CLASS_LEVELS[number];

export type Gender = 'Laki-laki' | 'Perempuan';

export interface Student {
    id: string;
    fullName: string;
    classLevel: ClassLevel;
    whatsappNumber: string;
    lifeSkill: LifeSkill | null;
    jenisKelamin: Gender;
    createdAt?: string;
    updatedAt?: string;
}
