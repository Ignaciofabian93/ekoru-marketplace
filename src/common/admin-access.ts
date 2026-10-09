import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenError, UnAuthorizedError } from './exceptions';

/** The admin permissions this subgraph checks (subset of the AdminPermission enum). */
export type AdminPermissionName =
  | 'MANAGE_CATEGORIES'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_SETTINGS';

interface AdminRow {
  adminType: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

/**
 * Ensures the caller is an active PLATFORM admin who is SUPER_ADMIN or holds
 * `permission` — the same rule ekoru-users applies (SEC-8). Returns the admin id.
 * Pass several permissions when any one of them is enough, for a read that
 * more than one panel screen needs.
 *
 * A token only proves *who* the admin is. Before this check, any admin token,
 * including a BUSINESS admin's, could rewrite the marketplace catalog, the
 * material impact constants, every listing and the ads. The Admin table
 * belongs to ekoru-users, so it is read with raw SQL (the cross-subgraph
 * convention); reading it per request means a deactivated admin or a revoked
 * permission takes effect at once.
 */
export async function assertAdminCan(
  prisma: PrismaService,
  adminId: string | undefined,
  permission: AdminPermissionName | readonly AdminPermissionName[],
): Promise<string> {
  const accepted: readonly AdminPermissionName[] = Array.isArray(permission)
    ? permission
    : [permission as AdminPermissionName];
  if (!adminId) throw new UnAuthorizedError('Admin authentication required');

  const rows = await prisma.$queryRaw<AdminRow[]>`
    SELECT "adminType"::text     AS "adminType",
           "role"::text          AS "role",
           "permissions"::text[] AS "permissions",
           "isActive"
    FROM "Admin"
    WHERE "id" = ${adminId}
    LIMIT 1`;
  const admin = rows[0];

  const allowed =
    !!admin &&
    admin.isActive &&
    admin.adminType === 'PLATFORM' &&
    (admin.role === 'SUPER_ADMIN' ||
      accepted.some((p) => (admin.permissions ?? []).includes(p)));

  if (!allowed) {
    throw new ForbiddenError(
      accepted.length === 1
        ? `This action requires the ${accepted[0]} permission`
        : `This action requires one of these permissions: ${accepted.join(', ')}`,
    );
  }
  return adminId;
}
