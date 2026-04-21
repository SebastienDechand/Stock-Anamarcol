import HistoryModel from "../models/history.model";
import AuditModel from "../models/audit.model";

/**
 * Purge entries older than 60 days from both History and Audit tables
 * Runs automatically via TTL indexes and as a fallback mechanism
 */
export const purgeOldEntries = async () => {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [historyResult, auditResult] = await Promise.all([
      HistoryModel.deleteMany({
        createdAt: { $lt: sixtyDaysAgo },
      }),
      AuditModel.deleteMany({
        createdAt: { $lt: sixtyDaysAgo },
      }),
    ]);

    const totalDeleted =
      (historyResult.deletedCount || 0) + (auditResult.deletedCount || 0);
    if (totalDeleted > 0) {
      console.log(
        `[Purge] Deleted ${historyResult.deletedCount || 0} history + ${auditResult.deletedCount || 0} audit entries (total: ${totalDeleted})`,
      );
    }
  } catch (err) {
    console.error("[Purge] Error:", err);
  }
};
