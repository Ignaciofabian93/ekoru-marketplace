# Marketplace Catalog Feature

## Overview

The catalog feature provides a GraphQL API to fetch the complete marketplace navigation menu with departments, categories, and product categories, all with multi-language support.

## Architecture

### Layers

1. **Entity Layer** (`src/catalog-v2/entities/catalog.entity.ts`)
   - `MarketplaceCatalogItemEntity` - Top-level department with nested categories
   - `DepartmentCategoryItemEntity` - Category with nested product categories
   - `ProductCategoryItemEntity` - Leaf-level product category

2. **Type Layer** (`src/types/catalog.ts`)
   - `MarketplaceCatalog` - TypeScript types matching the entity structure
   - Used for type safety in services and repositories

3. **Repository Layer** (`src/repositories/catalog.repository.ts`)
   - `getMarketplaceCatalog(language)` - Single optimized query that:
     - Fetches active departments with nested categories
     - Filters translations by language at query level
     - Orders by `sortOrder` field
     - Returns only needed fields (id, name, href)

4. **Service Layer** (`src/services/catalog.service.ts`)
   - `getMarketplaceCatalog(language?)` - Business logic layer
   - Handles language defaults using I18nService
   - Validates results and throws NotFoundException if empty

5. **Resolver Layer** (`src/resolvers/catalog.resolver.ts`)
   - `getMarketplaceCatalog` query - GraphQL endpoint
   - Accepts optional language parameter (defaults to ES)

## GraphQL Query

```graphql
query GetMarketplaceCatalog($language: Language = ES) {
  getMarketplaceCatalog(language: $language) {
    id
    name
    href
    categories {
      id
      name
      href
      productCategories {
        id
        name
        href
      }
    }
  }
}
```

## Response Structure

```json
[
  {
    "id": 1,
    "name": "Electronics",
    "href": "/electronics",
    "categories": [
      {
        "id": 10,
        "name": "Computers",
        "href": "/electronics/computers",
        "productCategories": [
          {
            "id": 100,
            "name": "Laptops",
            "href": "/electronics/computers/laptops"
          }
        ]
      }
    ]
  }
]
```

## Performance

- **Single Database Query**: All data fetched in one optimized Prisma query
- **Translation Filtering**: Translations filtered at database level (not in application)
- **Minimal Fields**: Only id, name, href returned (no unnecessary data)
- **Ordered Results**: Properly sorted by sortOrder at each level

## Usage Example

### In Frontend

```typescript
const { data } = await client.query({
  query: GET_MARKETPLACE_CATALOG,
  variables: { language: 'ES' },
});

// Render nested menu
data.getMarketplaceCatalog.forEach((department) => {
  renderDepartment(department);
  department.categories.forEach((category) => {
    renderCategory(category);
    category.productCategories.forEach((prodCat) => {
      renderProductCategory(prodCat);
    });
  });
});
```

## Module Registration

The catalog feature is registered in `CatalogV2Module`:

- `CatalogRepository` - Data access
- `CatalogService` - Business logic
- `CatalogResolver` - GraphQL endpoint
- Depends on `I18nService` for language handling

## Database Schema

Requires these tables:

- `department` - Top-level departments (isActive, sortOrder)
- `departmentTranslation` - Multi-language department names
- `departmentCategory` - Categories within departments (isActive, sortOrder)
- `departmentCategoryTranslation` - Multi-language category names
- `productCategory` - Leaf categories (isActive, sortOrder)
- `productCategoryTranslation` - Multi-language product category names

All translations use the `Language` enum (ES, EN, FR, PT, DE).
