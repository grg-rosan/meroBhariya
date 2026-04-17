// src/modules/admin/overview/overview.service.js
import { prisma } from '../../../config/db.config.js';

// ─── GET /api/admin/overview/stats ────────────────────────────────────────────
// Called by: getStatsHandler → overviewService.getPlatformStats()
// Returns:   { activeMerchants, activeRiders, shipmentsToday, codHeld }

export async function getPlatformStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeMerchants, activeRiders, shipmentsToday, codResult] = await Promise.all([
    prisma.merchantProfile.count({
      where: { user: { isActive: true } },
    }),
    prisma.riderProfile.count({
      where: { isOnline: true, isVerified: true },
    }),
    prisma.shipment.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.transaction.aggregate({
      _sum:  { codAmount: true },
      where: { isRemitted: false, paymentType: 'COD' },
    }),
  ]);

  return {
    activeMerchants,
    activeRiders,
    shipmentsToday,
    codHeld: codResult._sum.codAmount ?? 0,
  };
}

// ─── GET /api/admin/overview/health ──────────────────────────────────────────
// Called by: getHealthHandler → overviewService.getPlatformHealth()
// Returns:   { successRate, riderAvailability }

export async function getPlatformHealth() {
  const [total, delivered, totalRiders, onlineRiders] = await Promise.all([
    prisma.shipment.count({
      where: { status: { in: ['DELIVERED', 'CANCELLED', 'RETURNED'] } },
    }),
    prisma.shipment.count({
      where: { status: 'DELIVERED' },
    }),
    prisma.riderProfile.count({
      where: { isVerified: true },
    }),
    prisma.riderProfile.count({
      where: { isVerified: true, isOnline: true },
    }),
  ]);

  return {
    successRate:       total > 0 ? Math.round((delivered / total) * 100) : 0,
    riderAvailability: totalRiders > 0 ? Math.round((onlineRiders / totalRiders) * 100) : 0,
  };
}

// ─── GET /api/admin/overview/quick-actions ────────────────────────────────────
// Called by: getQuickActionCountsHandler → overviewService.getQuickActionCounts()
// Returns:   { pendingMerchants, pendingRiders, expiredDocs }

export async function getQuickActionCounts() {
  const [pendingMerchants, pendingRiders, expiredDocs] = await Promise.all([
    prisma.merchantProfile.count({
      where: { documents: { some: { status: 'PENDING' } } },
    }),
    prisma.riderProfile.count({
      where: { documents: { some: { status: 'PENDING' } } },
    }),
    prisma.riderDocument.count({
      where: { status: 'APPROVED', expiresAt: { lt: new Date() } },
    }),
  ]);

  return { pendingMerchants, pendingRiders, expiredDocs };
}

// ─── GET /api/admin/overview/activity ────────────────────────────────────────
// Called by: getRecentActivityHandler → overviewService.getRecentActivity(limit)
// Returns:   [{ time, text, type }]

export async function getRecentActivity(limit = 10) {
  const logs = await prisma.shipmentLog.findMany({
    take:    limit,
    orderBy: { createdAt: 'desc' },
    include: {
      shipment:  { select: { trackingNumber: true } },
      updatedBy: { select: { fullName: true, role: true } },
    },
  });

  return logs.map(log => ({
    time: timeAgo(log.createdAt),
    text: formatLogText(log),
    type: statusToType(log.status),
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatLogText(log) {
  const track = log.shipment?.trackingNumber ?? '';
  const actor = log.updatedBy?.fullName ?? 'System';
  const map = {
    PENDING:          `Shipment ${track} created`,
    ASSIGNED:         `Shipment ${track} assigned by ${actor}`,
    PICKED_UP:        `Shipment ${track} picked up by ${actor}`,
    IN_HUB:           `Shipment ${track} arrived at hub`,
    OUT_FOR_DELIVERY: `Shipment ${track} out for delivery`,
    DELIVERED:        `Shipment ${track} delivered by ${actor}`,
    CANCELLED:        `Shipment ${track} cancelled`,
    RETURNED:         `Shipment ${track} returned`,
  };
  return map[log.status] ?? `Shipment ${track} updated to ${log.status}`;
}

function statusToType(status) {
  const map = {
    DELIVERED:        'success',
    CANCELLED:        'error',
    RETURNED:         'warning',
    OUT_FOR_DELIVERY: 'info',
    ASSIGNED:         'info',
    PENDING:          'info',
    IN_HUB:           'info',
    PICKED_UP:        'info',
  };
  return map[status] ?? 'info';
}