import type { Language, ProductSize, WeightUnit } from '@prisma/client';

export type ProductCategory = {
  id: number;
  departmentCategoryId: number;
  averageWeight: number | null;
  size: ProductSize | null;
  weightUnit: WeightUnit | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductCategoryTranslation = {
  id: number;
  productCategoryId: number;
  language: Language;
  name: string;
  slug: string;
  keywords: string[];
  href: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
};
