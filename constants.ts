import { LifeSkill, CLASS_LEVELS, Student } from './types';

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

// Default initial Master Data Siswa to ensure instantaneous NIS lookup & testing
export const INITIAL_MASTER_STUDENTS: Student[] = [
    {
        id: 'mst-202411001',
        nis: '202411001',
        fullName: 'ABDUL AZIS',
        classLevel: '11.1',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567801',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411002',
        nis: '202411002',
        fullName: 'ABDUL MAJID',
        classLevel: '11.1',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567802',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411003',
        nis: '202411003',
        fullName: 'ADELA ALIFATUL RESTIANA',
        classLevel: '11.1',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567803',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411004',
        nis: '202411004',
        fullName: 'AHMAD FAUZI RIDWAN',
        classLevel: '11.1',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567804',
        lifeSkill: LifeSkill.DESAIN_GRAFIS,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411005',
        nis: '202411005',
        fullName: 'AISYAH SALSABILA',
        classLevel: '11.2',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567805',
        lifeSkill: LifeSkill.TATA_BOGA,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411006',
        nis: '202411006',
        fullName: 'BAGAS PRASETYO',
        classLevel: '11.2',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567806',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411007',
        nis: '202411007',
        fullName: 'CINTA AULIA PUTRI',
        classLevel: '11.3',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567807',
        lifeSkill: LifeSkill.CLOTHING_LINE,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411008',
        nis: '202411008',
        fullName: 'DIMAS ARDIANSYAH',
        classLevel: '11.3',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567808',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411009',
        nis: '202411009',
        fullName: 'EKA NUR SAFITRI',
        classLevel: '11.4',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567809',
        lifeSkill: LifeSkill.TATA_RIAS,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411010',
        nis: '202411010',
        fullName: 'FAJAR SHIDDIQ',
        classLevel: '11.4',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567810',
        lifeSkill: LifeSkill.OTOMOTIF,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411011',
        nis: '202411011',
        fullName: 'GALANG RAMADHAN',
        classLevel: '11.5',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567811',
        lifeSkill: LifeSkill.SETIR_MOBIL,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411012',
        nis: '202411012',
        fullName: 'HANIFAH AZ-ZAHRA',
        classLevel: '11.5',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567812',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411013',
        nis: '202411013',
        fullName: 'IKHWAN MAULANA',
        classLevel: '11.6',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567813',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411014',
        nis: '202411014',
        fullName: 'JASMINE KHAIRUNNISA',
        classLevel: '11.6',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567814',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411015',
        nis: '202411015',
        fullName: 'KURNIAWAN DWI SAPUTRA',
        classLevel: '11.7',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567815',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411016',
        nis: '202411016',
        fullName: 'LESTARI WIDIANINGSIH',
        classLevel: '11.7',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567816',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411017',
        nis: '202411017',
        fullName: 'MUHAMMAD ILHAM FAHRI',
        classLevel: '11.8',
        jenisKelamin: 'Laki-laki',
        whatsappNumber: '081234567817',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mst-202411018',
        nis: '202411018',
        fullName: 'NABILA AZKA',
        classLevel: '11.8',
        jenisKelamin: 'Perempuan',
        whatsappNumber: '081234567818',
        lifeSkill: null,
        createdAt: new Date().toISOString()
    }
];
