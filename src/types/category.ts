import type { Language } from '@prisma/client';

export type DepartmentCategory = {
  id: number;
  departmentId: number;
  isActive: boolean;
  sortOrder: number;
};

export type DepartmentCategoryTranslation = {
  id: number;
  departmentCategoryId: number;
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
