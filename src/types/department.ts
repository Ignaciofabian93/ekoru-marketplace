import type { Language } from '@prisma/client';

export type Department = {
  id: number;
  isActive: boolean;
  sortOrder: number;
};

export type DepartmentTranslation = {
  id: number;
  departmentId: number;
  language: Language;
  name: string;
  slug: string;
  href: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
};
