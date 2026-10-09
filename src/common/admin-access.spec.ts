import { assertAdminCan } from './admin-access';
import { PrismaService } from '../prisma/prisma.service';

type Row = {
  adminType: string;
  role: string;
  permissions: string[];
  isActive: boolean;
};

const prismaReturning = (rows: Row[]) =>
  ({
    $queryRaw: jest.fn().mockResolvedValue(rows),
  }) as unknown as PrismaService;

const platform = (over: Partial<Row> = {}): Row => ({
  adminType: 'PLATFORM',
  role: 'MODERATOR',
  permissions: [],
  isActive: true,
  ...over,
});

const codeOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as { extensions?: { code?: string } }).extensions?.code;
  }
};

describe('assertAdminCan', () => {
  it('rejects a signed-out caller as UNAUTHORIZED', async () => {
    const prisma = prismaReturning([]);
    expect(
      await codeOf(assertAdminCan(prisma, undefined, 'MANAGE_PRODUCTS')),
    ).toBe('UNAUTHORIZED');
  });

  it('rejects an unknown admin id as FORBIDDEN', async () => {
    expect(
      await codeOf(
        assertAdminCan(prismaReturning([]), 'a1', 'MANAGE_PRODUCTS'),
      ),
    ).toBe('FORBIDDEN');
  });

  it('rejects a BUSINESS admin even when it holds the permission', async () => {
    const prisma = prismaReturning([
      platform({ adminType: 'BUSINESS', permissions: ['MANAGE_PRODUCTS'] }),
    ]);
    expect(await codeOf(assertAdminCan(prisma, 'a1', 'MANAGE_PRODUCTS'))).toBe(
      'FORBIDDEN',
    );
  });

  it('rejects an inactive platform admin', async () => {
    const prisma = prismaReturning([
      platform({ isActive: false, role: 'SUPER_ADMIN' }),
    ]);
    expect(await codeOf(assertAdminCan(prisma, 'a1', 'MANAGE_PRODUCTS'))).toBe(
      'FORBIDDEN',
    );
  });

  it('rejects a platform admin without the permission', async () => {
    const prisma = prismaReturning([
      platform({ permissions: ['MANAGE_CATEGORIES'] }),
    ]);
    expect(await codeOf(assertAdminCan(prisma, 'a1', 'MANAGE_PRODUCTS'))).toBe(
      'FORBIDDEN',
    );
  });

  it('allows a platform admin with the permission and returns its id', async () => {
    const prisma = prismaReturning([
      platform({ permissions: ['MANAGE_PRODUCTS'] }),
    ]);
    await expect(assertAdminCan(prisma, 'a1', 'MANAGE_PRODUCTS')).resolves.toBe(
      'a1',
    );
  });

  it('accepts any one of several permissions', async () => {
    const prisma = prismaReturning([
      platform({ permissions: ['MANAGE_PRODUCTS'] }),
    ]);
    await expect(
      assertAdminCan(prisma, 'a1', ['MANAGE_CATEGORIES', 'MANAGE_PRODUCTS']),
    ).resolves.toBe('a1');
  });

  it('rejects when none of several permissions is held', async () => {
    const prisma = prismaReturning([
      platform({ permissions: ['MANAGE_SETTINGS'] }),
    ]);
    expect(
      await codeOf(
        assertAdminCan(prisma, 'a1', ['MANAGE_CATEGORIES', 'MANAGE_PRODUCTS']),
      ),
    ).toBe('FORBIDDEN');
  });

  it('allows SUPER_ADMIN without explicit permissions', async () => {
    const prisma = prismaReturning([platform({ role: 'SUPER_ADMIN' })]);
    expect(
      await codeOf(assertAdminCan(prisma, 'a1', 'MANAGE_CATEGORIES')),
    ).toBe('OK');
  });
});
