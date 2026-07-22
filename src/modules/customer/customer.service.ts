import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

type GetCustomersParams = {
  page: number;
  limit: number;
  search?: string;
};

type CustomerRow = {
  phone: string;
  name: string;
  address: string;
  district: string;
  orderCount: bigint;
  deliveredCount: bigint;
  totalSpent: Prisma.Decimal;
  lastOrderAt: Date;
};

type CustomerSummary = {
  phone: string;
  name: string;
  address: string;
  district: string;
  orderCount: number;
  deliveredCount: number;
  totalSpent: number;
  lastOrderAt: Date;
};

// Normalize phone numbers so the same customer is counted once even if the
// same number is written with spaces, dashes, +88 / 880 prefix etc.
// e.g. "+880 1712-345 678" → "01712345678"
const normalizePhoneSql = `
  LOWER(
    REGEXP_REPLACE(
      REPLACE(REPLACE("customerPhone", ' ', ''), '-', ''),
      '^\\+?880',
      '0'
    )
  )
`;

const getCustomers = async (params: GetCustomersParams) => {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  const searchClause = search
    ? Prisma.sql`AND (
      o."customerName" ILIKE ${`%${search}%`}
      OR o."customerPhone" ILIKE ${`%${search}%`}
      OR ${Prisma.raw(normalizePhoneSql)} ILIKE ${`%${search.replace(/[\s\-]/g, '').toLowerCase()}%`}
    )`
    : Prisma.empty;

  // Group all orders by normalized phone number. Only DELIVERED orders
  // contribute to totalSpent — pending/processing/cancelled etc. are excluded.
  const rows = await prisma.$queryRaw<CustomerRow[]>`
    SELECT
      ${Prisma.raw(normalizePhoneSql)} AS phone,
      (ARRAY_AGG(o."customerName" ORDER BY o."createdAt" DESC))[1] AS name,
      (ARRAY_AGG(o."address" ORDER BY o."createdAt" DESC))[1] AS address,
      (ARRAY_AGG(o."district" ORDER BY o."createdAt" DESC))[1] AS district,
      COUNT(*)::bigint AS "orderCount",
      COUNT(*) FILTER (WHERE o.status = 'DELIVERED')::bigint AS "deliveredCount",
      COALESCE(SUM(o.total) FILTER (WHERE o.status = 'DELIVERED'), 0) AS "totalSpent",
      MAX(o."createdAt") AS "lastOrderAt"
    FROM orders o
    WHERE 1=1
    ${searchClause}
    GROUP BY phone
    ORDER BY "lastOrderAt" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Total unique customers (for pagination meta)
  const totalRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM (
      SELECT ${Prisma.raw(normalizePhoneSql)} AS phone
      FROM orders o
      WHERE 1=1
      ${searchClause}
      GROUP BY phone
    ) AS grouped
  `;

  const total = Number(totalRows[0]?.count ?? 0);

  const customers: CustomerSummary[] = rows.map((row) => ({
    phone: row.phone,
    name: row.name,
    address: row.address,
    district: row.district,
    orderCount: Number(row.orderCount),
    deliveredCount: Number(row.deliveredCount),
    totalSpent: Number(row.totalSpent),
    lastOrderAt: row.lastOrderAt,
  }));

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: customers
  };
};

// Aggregate stats across all customers (for summary cards on the frontend).
const getCustomerStats = async () => {
  const rows = await prisma.$queryRaw<{
    totalCustomers: bigint;
    totalOrders: bigint;
    deliveredOrders: bigint;
    totalRevenue: Prisma.Decimal;
  }[]>`
    SELECT
      COUNT(DISTINCT ${Prisma.raw(normalizePhoneSql)})::bigint AS "totalCustomers",
      COUNT(*)::bigint AS "totalOrders",
      COUNT(*) FILTER (WHERE status = 'DELIVERED')::bigint AS "deliveredOrders",
      COALESCE(SUM(total) FILTER (WHERE status = 'DELIVERED'), 0) AS "totalRevenue"
    FROM orders
  `;

  const row = rows[0];
  const totalRevenue = Number(row?.totalRevenue ?? 0);
  const deliveredOrders = Number(row?.deliveredOrders ?? 0);

  return {
    totalCustomers: Number(row?.totalCustomers ?? 0),
    totalOrders: Number(row?.totalOrders ?? 0),
    deliveredOrders,
    totalRevenue,
    avgOrderValue: deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0
  };
};

export const customerService = {
  getCustomers,
  getCustomerStats
};
