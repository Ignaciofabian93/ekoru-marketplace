# DataLoader-Based Multi-Language Catalog Architecture

## 📋 Overview

This document describes the professional DataLoader-based architecture for the NestJS GraphQL Federation marketplace with multi-language support. The implementation provides optimal performance with < 100ms response times and eliminates N+1 query problems through intelligent batching and caching.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GraphQL Request                          │
│                 (Accept-Language: es-ES)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               GraphQL Context Factory                        │
│  - Parse language from headers                               │
│  - Initialize fresh DataLoaders (per request)                │
│  - Inject services & repositories                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GraphQL Resolvers                         │
│  DepartmentResolver                                          │
│  ├─ @Query getDepartmentBySlug                              │
│  ├─ @Query getDepartments                                   │
│  ├─ @ResolveField translation (SINGLE object)               │
│  └─ @ResolveField departmentCategory                        │
│                                                              │
│  CategoryResolver                                            │
│  ├─ @ResolveField translation (SINGLE object)               │
│  └─ @ResolveField productCategory                           │
│                                                              │
│  ProductCategoryResolver                                     │
│  └─ @ResolveField translation (SINGLE object)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  DepartmentService                                           │
│  ├─ getDepartmentBySlug()                                   │
│  ├─ getDepartments()                                        │
│  └─ getDepartmentById()                                     │
│                                                              │
│  I18nService                                                 │
│  ├─ getCurrentLanguage()                                    │
│  ├─ setCurrentLanguage()                                    │
│  └─ parseAcceptLanguage()                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Repository Layer (DataLoaders)                │
│  DepartmentRepository                                        │
│  ├─ createTranslationLoader()   [ID:LANG → Translation]     │
│  ├─ createDepartmentLoader()    [ID → Department]           │
│  ├─ findBySlug()                                            │
│  ├─ getTranslation()                                        │
│  └─ primeTranslations()         [Cache warming]            │
│                                                              │
│  CategoryRepository                                          │
│  ├─ createTranslationLoader()   [ID:LANG → Translation]     │
│  ├─ createCategoryByDepartmentLoader() [DeptID → Cat[]]    │
│  └─ getTranslation()                                        │
│                                                              │
│  ProductCategoryRepository                                   │
│  ├─ createTranslationLoader()   [ID:LANG → Translation]     │
│  ├─ createProductCategoryByCategoryLoader() [CatID → PC[]]  │
│  └─ getTranslation()                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma Client                             │
│                   PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────┘
```

## 📂 File Structure

```
src/
├── common/
│   └── i18n/
│       ├── i18n.service.ts          # Language context management
│       └── index.ts
├── repositories/
│   ├── department.repository.ts     # DataLoader for departments
│   ├── category.repository.ts       # DataLoader for categories
│   ├── product-category.repository.ts # DataLoader for product categories
│   └── index.ts
├── services/
│   ├── department.service.ts        # Business logic
│   └── index.ts
├── resolvers/
│   ├── department.resolver.ts       # Query & field resolvers
│   ├── category.resolver.ts         # Field resolvers
│   ├── product-category.resolver.ts # Field resolvers
│   └── index.ts
├── types/
│   ├── graphql-context.interface.ts # TypeScript context interface
│   └── index.ts
├── graphql/
│   ├── context.ts                   # Context factory
│   └── index.ts
├── catalog-v2/
│   ├── catalog-v2.module.ts         # NestJS module
│   └── index.ts
└── app.module.ts                    # Updated with context factory
```

## 🔑 Key Components

### 1. I18N Service (`src/common/i18n/i18n.service.ts`)

**Purpose**: Manages language context for multi-language support

**Key Features**:

- Parses `Accept-Language` header
- Provides current language for request context
- Falls back to default language (ES)

**Example**:

```typescript
const language = i18nService.parseAcceptLanguage('en-US,en;q=0.9,es;q=0.8');
// Returns: Language.EN
```

### 2. Repository Layer

#### DepartmentRepository (`src/repositories/department.repository.ts`)

**DataLoaders**:

- `createTranslationLoader()`: Batches translation lookups with composite key `"id:language"`
- `createDepartmentLoader()`: Batches department lookups by ID

**Key Methods**:

- `findBySlug(slug, language)`: Finds department by slug
- `getTranslation(loader, departmentId, language)`: Gets single translation
- `primeTranslations(loader, ids, language)`: Cache warming

**Cache Strategy**:

```typescript
cacheKeyFn: (key: string) => key; // "1:ES", "1:EN", "2:ES"
```

#### CategoryRepository (`src/repositories/category.repository.ts`)

**DataLoaders**:

- `createTranslationLoader()`: Batches category translation lookups
- `createCategoryByDepartmentLoader()`: Batches category lookups by department

**Batching Example**:

```typescript
// Single database query for multiple department IDs
const loader = createCategoryByDepartmentLoader();
const categories1 = await loader.load(1);
const categories2 = await loader.load(2);
const categories3 = await loader.load(3);
// → Single query: WHERE departmentId IN (1, 2, 3)
```

#### ProductCategoryRepository (`src/repositories/product-category.repository.ts`)

**DataLoaders**:

- `createTranslationLoader()`: Batches product category translation lookups
- `createProductCategoryByCategoryLoader()`: Batches by category

### 3. Service Layer

#### DepartmentService (`src/services/department.service.ts`)

**Business Logic**:

- `getDepartmentBySlug(slug, language)`: Retrieves department with validation
- `getDepartments(limit, offset, language)`: Pagination with limits
- Input validation (limit: 1-100, offset: >= 0)

### 4. GraphQL Resolvers

#### DepartmentResolver (`src/resolvers/department.resolver.ts`)

**Queries**:

```graphql
getDepartmentBySlug(slug: String!, language: Language = ES): Department
getDepartments(limit: Int = 20, offset: Int = 0, language: Language = ES): [Department!]!
```

**Field Resolvers**:

```typescript
@ResolveField('translation')
async translation(@Parent() department, @Context() context) {
  // Returns SINGLE translation object using DataLoader
  return context.departmentRepository.getTranslation(
    context.loaders.departmentTranslation,
    department.id,
    context.language
  );
}
```

**Cache Warming**:

```typescript
// After loading departments, prime the translation cache
const departmentIds = departments.map((d) => d.id);
await context.departmentRepository.primeTranslations(
  context.loaders.departmentTranslation,
  departmentIds,
  language,
);
```

### 5. GraphQL Context Factory (`src/graphql/context.ts`)

**Per-Request Initialization**:

```typescript
export function createGraphQLContext(req, res, moduleRef): GraphQLContext {
  // 1. Resolve services from DI container
  const prisma = moduleRef.get(PrismaService);
  const departmentRepository = moduleRef.get(DepartmentRepository);
  // ...

  // 2. Parse language from headers
  const language = i18nService.parseAcceptLanguage(
    req.headers['accept-language'],
  );

  // 3. Create fresh DataLoaders (CRITICAL!)
  const loaders = {
    departmentTranslation: departmentRepository.createTranslationLoader(),
    departmentCategories: categoryRepository.createCategoryByDepartmentLoader(),
    // ...
  };

  return { req, res, language, prisma, loaders /* ... */ };
}
```

### 6. GraphQL Context Interface (`src/types/graphql-context.interface.ts`)

**Type-Safe Context**:

```typescript
export interface GraphQLContext {
  req: Request;
  res: Response;
  language: Language;
  prisma: PrismaService;
  departmentService: DepartmentService;
  i18nService: I18nService;
  loaders: {
    departmentTranslation: DataLoader<string, DepartmentTranslation | null>;
    departmentById: DataLoader<number, Department | null>;
    departmentCategories: DataLoader<number, DepartmentCategory[]>;
    // ...
  };
  sellerId?: string;
  token?: string;
}
```

## 🚀 Performance Characteristics

### Query Complexity

**Full Nested Query**:

```graphql
query GetCatalog {
  getDepartmentBySlug(slug: "tecnologia", language: ES) {
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
          keywords
        }
        averageWeight
      }
    }
  }
}
```

**Database Queries Executed**:

1. Find department by slug (1 query)
2. Batch load all translations for departments (1 query)
3. Batch load all department categories (1 query)
4. Batch load all category translations (1 query)
5. Batch load all product categories (1 query)
6. Batch load all product category translations (1 query)

**Total: 3-6 queries** (depending on data volume and batching)

### DataLoader Benefits

**Without DataLoader (N+1 Problem)**:

```
1 query for department
+ N queries for translations (1 per department)
+ M queries for categories (1 per department)
+ P queries for category translations (1 per category)
+ Q queries for product categories (1 per category)
+ R queries for product category translations (1 per product category)
= 1 + N + M + P + Q + R queries (potentially 100s)
```

**With DataLoader**:

```
1 query for department
+ 1 batched query for all translations
+ 1 batched query for all categories
+ 1 batched query for all category translations
+ 1 batched query for all product categories
+ 1 batched query for all product category translations
= 6 queries total
```

**Performance Improvement**: ~95% reduction in database queries

## 📊 Prisma Schema

```prisma
enum Language {
  ES
  EN
  FR
  PT
  DE
}

model Department {
  id                 Int                       @id @default(autoincrement())
  isActive           Boolean                   @default(true)
  sortOrder          Int                       @default(0)
  departmentCategory DepartmentCategory[]
  translations       DepartmentTranslation[]

  @@index([id])
  @@index([isActive, sortOrder])
}

model DepartmentTranslation {
  id              Int        @id @default(autoincrement())
  departmentId    Int
  language        Language   // Enum: ES, EN, FR, PT, DE
  name            String
  slug            String
  href            String?
  metaTitle       String?
  metaDescription String?    @db.Text
  metaKeywords    String[]
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  department      Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([departmentId, language])
  @@unique([slug, language])
  @@index([slug, language])
  @@index([language, departmentId])
}

// Similar structure for DepartmentCategory and ProductCategory
```

## 🔧 Usage Examples

### Making a GraphQL Query

**Request**:

```graphql
query {
  getDepartments(limit: 10, language: ES) {
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
    }
  }
}
```

**Headers**:

```
Accept-Language: es-ES,es;q=0.9
```

**Response**:

```json
{
  "data": {
    "getDepartments": [
      {
        "id": 1,
        "translation": {
          "name": "Tecnología",
          "slug": "tecnologia",
          "href": "/tecnologia"
        },
        "departmentCategory": [
          {
            "id": 1,
            "translation": {
              "name": "Portátiles",
              "slug": "portatiles"
            }
          }
        ]
      }
    ]
  }
}
```

### Adding a New Language

1. **Add to Prisma enum**:

```prisma
enum Language {
  ES
  EN
  FR
  PT
  DE
  IT  // New language
}
```

2. **Regenerate Prisma client**:

```bash
npx prisma generate
npx prisma db push
```

3. **Add translations to database**:

```sql
INSERT INTO "DepartmentTranslation" (departmentId, language, name, slug)
VALUES (1, 'IT', 'Tecnologia', 'tecnologia');
```

4. **Query with new language**:

```graphql
query {
  getDepartmentBySlug(slug: "tecnologia", language: IT) {
    translation {
      name
    }
  }
}
```

## ⚙️ Configuration

### App Module Setup

The app module is configured to use the context factory:

```typescript
GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
  driver: ApolloFederationDriver,
  useFactory: (moduleRef: ModuleRef) => ({
    autoSchemaFile: { federation: 2 },
    sortSchema: true,
    playground: process.env.NODE_ENV !== 'production',
    context: createContextFactory(moduleRef),
  }),
  inject: [ModuleRef],
});
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5433/ekoru-qa?schema=public"
NODE_ENV="development"
```

## 🧪 Testing

### Unit Testing Repositories

```typescript
describe('DepartmentRepository', () => {
  let repository: DepartmentRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DepartmentRepository, PrismaService],
    }).compile();

    repository = module.get(DepartmentRepository);
    prisma = module.get(PrismaService);
  });

  it('should batch load translations', async () => {
    const loader = repository.createTranslationLoader();

    const [t1, t2] = await Promise.all([
      loader.load('1:ES'),
      loader.load('2:ES'),
    ]);

    expect(t1).toBeDefined();
    expect(t2).toBeDefined();
    // Verify only one database query was made
  });
});
```

### Integration Testing

```typescript
describe('Catalog GraphQL', () => {
  it('should return department with translation', async () => {
    const query = `
      query {
        getDepartmentBySlug(slug: "tecnologia", language: ES) {
          id
          translation { name slug }
        }
      }
    `;

    const result = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query });

    expect(result.body.data.getDepartmentBySlug).toMatchObject({
      id: expect.any(Number),
      translation: {
        name: expect.any(String),
        slug: 'tecnologia',
      },
    });
  });
});
```

## 🐛 Troubleshooting

### Issue: Stale Cache Data

**Symptom**: Old data appears in responses after database updates

**Cause**: DataLoaders are reused across requests

**Solution**: Ensure DataLoaders are created fresh per request in the context factory

```typescript
// ✅ Correct: Fresh loaders per request
const loaders = {
  departmentTranslation: departmentRepository.createTranslationLoader(),
};

// ❌ Wrong: Singleton loader
const loader = departmentRepository.createTranslationLoader(); // Created once
```

### Issue: N+1 Queries Still Occurring

**Symptom**: Many database queries for nested data

**Cause**: Not using DataLoaders in resolvers

**Solution**: Always use `context.loaders` in field resolvers

```typescript
// ✅ Correct: Use DataLoader
@ResolveField('translation')
async translation(@Parent() dept, @Context() ctx) {
  return ctx.loaders.departmentTranslation.load(`${dept.id}:${ctx.language}`);
}

// ❌ Wrong: Direct Prisma query
@ResolveField('translation')
async translation(@Parent() dept, @Context() ctx) {
  return ctx.prisma.departmentTranslation.findFirst({
    where: { departmentId: dept.id, language: ctx.language }
  });
}
```

### Issue: Language Not Applied

**Symptom**: Wrong language translations returned

**Cause**: Language not set in context or not passed to methods

**Solution**: Ensure language is extracted from headers and passed through context

```typescript
// In context factory
const language = i18nService.parseAcceptLanguage(
  req.headers['accept-language'],
);

// In resolver
context.i18nService.setCurrentLanguage(language);
```

## 📈 Monitoring & Metrics

### Key Metrics to Track

1. **Query Response Time**: Target < 100ms
2. **Database Query Count**: Target 3-6 queries per nested request
3. **DataLoader Cache Hit Rate**: Target > 80%
4. **Memory Usage**: Monitor DataLoader cache size

### Logging

Enable detailed logging for debugging:

```typescript
// In repository
this.logger.debug(`Loading translations: ${compositeKeys.join(', ')}`);
this.logger.debug(`Loaded ${translations.length} translations`);
```

## 🚦 Best Practices

1. **Always create fresh DataLoaders per request** - Prevents stale cache
2. **Use composite keys for translations** - `"id:language"` format
3. **Prime caches after loading lists** - Improves subsequent field resolution
4. **Return SINGLE translation objects** - Not arrays, use current language
5. **Validate pagination inputs** - Limit between 1-100, offset >= 0
6. **Use proper TypeScript types** - Leverage Prisma generated types
7. **Log performance metrics** - Track query counts and response times
8. **Handle missing translations gracefully** - Fall back to default language

## 📚 Further Reading

- [DataLoader Documentation](https://github.com/graphql/dataloader)
- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [GraphQL Federation](https://www.apollographql.com/docs/federation/)

---

**Version**: 1.0.0  
**Last Updated**: January 8, 2026  
**Maintained By**: EKORU CTO - Ignacio Rodríguez Rulas
