# Quick Start Guide - DataLoader Catalog V2

## 🚀 Getting Started

This guide will help you quickly understand and use the new DataLoader-based multi-language catalog system.

## ✅ Prerequisites

- NestJS 11+
- Prisma 5+
- PostgreSQL database
- Node.js 22+

## 📦 Installation

The implementation is already integrated into your project. No additional installation needed!

**Dependencies added**:

- `dataloader` - For batch loading and caching

## 🎯 Basic Usage

### 1. Query a Department by Slug

```graphql
query {
  getDepartmentBySlug(slug: "tecnologia", language: ES) {
    id
    translation {
      name
      slug
      href
      metaTitle
      metaDescription
    }
  }
}
```

**Response**:

```json
{
  "data": {
    "getDepartmentBySlug": {
      "id": 1,
      "translation": {
        "name": "Tecnología",
        "slug": "tecnologia",
        "href": "/tecnologia",
        "metaTitle": "Tecnología - Ekoru Marketplace",
        "metaDescription": "Encuentra productos tecnológicos sustentables"
      }
    }
  }
}
```

### 2. List All Departments with Pagination

```graphql
query {
  getDepartments(limit: 10, offset: 0, language: EN) {
    id
    translation {
      name
      slug
    }
  }
}
```

### 3. Full Nested Catalog Query

```graphql
query GetFullCatalog {
  getDepartments(language: ES) {
    id
    translation {
      name
      slug
      href
    }
    departmentCategory {
      id
      translation {
        name
        slug
      }
      productCategory {
        id
        translation {
          name
          slug
          keywords
        }
        averageWeight
        size
        weightUnit
      }
    }
  }
}
```

## 🌍 Supported Languages

```graphql
enum Language {
  ES # Spanish (Default)
  EN # English
  FR # French
  PT # Portuguese
  DE # German
}
```

## 📖 Common Queries

### Get Department with Categories

```graphql
query {
  getDepartmentBySlug(slug: "tecnologia", language: ES) {
    id
    translation {
      name
    }
    departmentCategory {
      id
      translation {
        name
        slug
      }
    }
  }
}
```

### Get Department with Full Nesting

```graphql
query CatalogDetail {
  getDepartmentBySlug(slug: "tecnologia", language: ES) {
    id
    translation {
      name
      slug
      href
      description
      metaTitle
      metaDescription
      metaKeywords
    }
    departmentCategory {
      id
      translation {
        name
        slug
        href
        description
      }
      productCategory {
        id
        translation {
          name
          slug
          keywords
          href
        }
        averageWeight
        size
        weightUnit
      }
    }
  }
}
```

### Paginated Departments

```graphql
query {
  getDepartments(limit: 5, offset: 0, language: EN) {
    id
    translation {
      name
      slug
    }
  }
}
```

## 🔧 Using in Your Code

### Option 1: GraphQL Queries (Recommended)

Use the GraphQL API directly from your frontend:

```typescript
// Apollo Client example
import { gql, useQuery } from '@apollo/client';

const GET_CATALOG = gql`
  query GetCatalog($language: Language!) {
    getDepartments(language: $language) {
      id
      translation {
        name
        slug
      }
    }
  }
`;

function CatalogComponent() {
  const { data, loading } = useQuery(GET_CATALOG, {
    variables: { language: 'ES' }
  });

  return (
    <div>
      {data?.getDepartments.map(dept => (
        <div key={dept.id}>
          <h2>{dept.translation.name}</h2>
          <a href={`/${dept.translation.slug}`}>View</a>
        </div>
      ))}
    </div>
  );
}
```

### Option 2: Using Services Directly (Backend)

If you need to use the services in other NestJS modules:

```typescript
import { Injectable } from '@nestjs/common';
import { DepartmentService } from './services/department.service';
import { Language } from '@prisma/client';

@Injectable()
export class MyCustomService {
  constructor(private readonly departmentService: DepartmentService) {}

  async getSpanishDepartments() {
    return this.departmentService.getDepartments(20, 0, Language.ES);
  }

  async getDepartmentBySlug(slug: string) {
    return this.departmentService.getDepartmentBySlug(slug, Language.ES);
  }
}
```

### Option 3: Using Repositories (Advanced)

For custom data loading logic:

```typescript
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from './repositories/department.repository';
import { Language } from '@prisma/client';

@Injectable()
export class MyAdvancedService {
  constructor(private readonly deptRepo: DepartmentRepository) {}

  async loadTranslationsEfficiently() {
    // Create DataLoader
    const loader = this.deptRepo.createTranslationLoader();

    // Batch load translations
    const [es, en, fr] = await Promise.all([
      loader.load('1:ES'),
      loader.load('1:EN'),
      loader.load('1:FR'),
    ]);

    // Only 1 database query executed!
    return { es, en, fr };
  }
}
```

## 🌐 Language Handling

### Automatic Language Detection

The system automatically detects language from the `Accept-Language` header:

```bash
curl -H "Accept-Language: en-US,en;q=0.9" \
  http://localhost:3000/graphql \
  -d '{"query": "{ getDepartments { id translation { name } } }"}'
```

### Manual Language Selection

Override with explicit language parameter:

```graphql
query {
  getDepartments(language: FR) {
    translation {
      name
    }
  }
}
```

## 📊 Performance Tips

### 1. Request Only What You Need

❌ **Bad** - Over-fetching:

```graphql
query {
  getDepartments {
    id
    translation {
      name
      slug
      href
      description
      metaTitle
      metaDescription
      metaKeywords
    }
    departmentCategory {
      # ... all fields
    }
  }
}
```

✅ **Good** - Selective fields:

```graphql
query {
  getDepartments {
    id
    translation {
      name
      slug
    }
  }
}
```

### 2. Use Pagination

```graphql
query {
  getDepartments(limit: 20, offset: 0) {
    id
    translation {
      name
    }
  }
}
```

### 3. Cache on the Client

```typescript
// Apollo Client with caching
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Department: {
        keyFields: ['id'],
      },
    },
  }),
});
```

## 🔍 Debugging

### Enable Debug Logging

Set environment variable:

```env
LOG_LEVEL=debug
```

### Check Database Queries

In development, you can enable Prisma query logging:

```typescript
// prisma/prisma.service.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Verify DataLoader Batching

Check server logs for batching evidence:

```
[DepartmentRepository] Loading translations: 1:ES, 2:ES, 3:ES
[DepartmentRepository] Loaded 3 translations
```

## 🆘 Common Issues

### Issue: Getting null for translation

**Cause**: Translation doesn't exist for that language

**Solution**: Ensure translations exist in database or fall back to default:

```typescript
const translation =
  (await repo.getTranslation(loader, id, language)) ||
  (await repo.getTranslation(loader, id, Language.ES)); // Fallback
```

### Issue: Slow queries

**Cause**: Not using DataLoaders properly

**Solution**: Check that field resolvers use `context.loaders`

### Issue: Wrong language returned

**Cause**: Language not passed correctly

**Solution**: Verify language parameter in query

## 📚 Examples Repository

See more examples in the test files:

```
src/
├── repositories/*.spec.ts
├── services/*.spec.ts
└── resolvers/*.spec.ts
```

## 🎓 Next Steps

1. **Add more queries** - Extend resolvers for your use cases
2. **Implement mutations** - Add create/update/delete operations
3. **Add filtering** - Implement search and filter capabilities
4. **Add sorting** - Allow custom sort orders
5. **Implement subscriptions** - Real-time catalog updates

## 📞 Support

For questions or issues:

- Check the [Full Architecture Documentation](./DATALOADER_ARCHITECTURE.md)
- Review code comments in source files
- Contact the development team

---

**Happy Coding! 🚀**
