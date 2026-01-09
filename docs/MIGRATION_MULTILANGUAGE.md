# Migration Guide: Multilanguage Support

This guide explains how to migrate your database and populate translations for the new multilanguage support.

## Overview

The system now supports multilanguage for Departments, Department Categories, and Product Categories using dedicated translation tables.

### Supported Languages

- Spanish (es) - Default
- English (en)
- French (fr)

## Database Changes

### New Models

- `DepartmentTranslation`
- `DepartmentCategoryTranslation`
- `ProductCategoryTranslation`

### Modified Models

- `Department` - Removed `departmentName`, `href`
- `DepartmentCategory` - Removed `departmentCategoryName`, `href`
- `ProductCategory` - Removed `productCategoryName`, `keywords`, `href`

## Migration Steps

### 1. Generate Prisma Migration

```bash
npx prisma migrate dev --name add_translation_tables
```

This will create the migration files and apply them to your development database.

### 2. Data Migration Script

You'll need to migrate existing data to the translation tables. Create a migration script:

```typescript
// scripts/migrate-translations.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateDepartments() {
  const departments = await prisma.$queryRaw`
    SELECT id, "departmentName", href 
    FROM "Department"
  `;

  for (const dept of departments as any[]) {
    // Create Spanish translation (default)
    await prisma.departmentTranslation.create({
      data: {
        departmentId: dept.id,
        language: 'es',
        name: dept.departmentName,
        slug: dept.departmentName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        href: dept.href,
      },
    });

    // Add English and French translations here
    // You'll need to provide the actual translations
  }
}

async function migrateDepartmentCategories() {
  const categories = await prisma.$queryRaw`
    SELECT id, "departmentCategoryName", href, "departmentId"
    FROM "DepartmentCategory"
  `;

  for (const cat of categories as any[]) {
    await prisma.departmentCategoryTranslation.create({
      data: {
        departmentCategoryId: cat.id,
        language: 'es',
        name: cat.departmentCategoryName,
        slug: cat.departmentCategoryName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        href: cat.href,
      },
    });
  }
}

async function migrateProductCategories() {
  const categories = await prisma.$queryRaw`
    SELECT id, "productCategoryName", keywords, href, "departmentCategoryId"
    FROM "ProductCategory"
  `;

  for (const cat of categories as any[]) {
    await prisma.productCategoryTranslation.create({
      data: {
        productCategoryId: cat.id,
        language: 'es',
        name: cat.productCategoryName,
        slug: cat.productCategoryName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        keywords: cat.keywords || [],
        href: cat.href,
      },
    });
  }
}

async function main() {
  console.log('Starting migration...');

  await migrateDepartments();
  console.log('✓ Departments migrated');

  await migrateDepartmentCategories();
  console.log('✓ Department Categories migrated');

  await migrateProductCategories();
  console.log('✓ Product Categories migrated');

  console.log('Migration completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run the script:

```bash
npx ts-node scripts/migrate-translations.ts
```

### 3. Add Translations for Other Languages

Create a seed file to add English and French translations:

```typescript
// prisma/seeds/translations.seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departmentTranslations = [
  {
    departmentId: 1,
    translations: {
      es: { name: 'Tecnología', slug: 'tecnologia' },
      en: { name: 'Technology', slug: 'technology' },
      fr: { name: 'Technologie', slug: 'technologie' },
    },
  },
  // Add more departments...
];

async function seedTranslations() {
  for (const dept of departmentTranslations) {
    for (const [lang, translation] of Object.entries(dept.translations)) {
      await prisma.departmentTranslation.upsert({
        where: {
          departmentId_language: {
            departmentId: dept.departmentId,
            language: lang,
          },
        },
        update: translation,
        create: {
          departmentId: dept.departmentId,
          language: lang,
          ...translation,
        },
      });
    }
  }
}

seedTranslations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Usage

### Frontend Integration

#### Using URL Slugs (Recommended)

For SEO-friendly URLs:

```typescript
// Spanish
http://localhost:3000/departments/tecnologia

// English
http://localhost:3000/en/departments/technology

// French
http://localhost:3000/fr/departments/technologie
```

GraphQL Query:

```graphql
query GetDepartmentBySlug($slug: String!) {
  getDepartmentBySlug(slug: $slug) {
    id
    name
    slug
    departmentImage
    departmentCategory {
      id
      name
      slug
    }
  }
}
```

#### Using Accept-Language Header

```typescript
fetch('/graphql', {
  headers: {
    'Accept-Language': 'en',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `{ getDepartments { id name slug } }`,
  }),
});
```

#### Using Query Parameter

```
http://localhost:3000/graphql?lang=en
```

### Language Detection Priority

1. Query parameter (`?lang=en`)
2. Accept-Language header
3. Default to Spanish (`es`)

## Testing

### Test Queries

```graphql
# Get all departments in English
query {
  getDepartments {
    id
    name
    slug
    departmentImage
  }
}

# Get department by slug
query {
  getDepartmentBySlug(slug: "technology") {
    id
    name
    slug
    departmentCategory {
      id
      name
      slug
    }
  }
}
```

## Rollback (If Needed)

If you need to rollback:

```bash
npx prisma migrate reset
```

Then restore from backup or previous migration.

## Next Steps

1. Run the migration
2. Execute the data migration script
3. Add translations for all supported languages
4. Update your frontend to pass language preferences
5. Test all endpoints with different languages
6. Update documentation

## Notes

- Slugs must be unique per language
- Always provide at least Spanish (default) translation
- The system falls back to Spanish if translation is not found
- Consider using a translation management system for large-scale projects
