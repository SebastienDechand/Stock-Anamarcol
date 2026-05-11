import { Request, Response } from "express";
import { getRecentEvents } from "../utils/audit.utils";
import HistoryModel from "../models/history.model";
import AuditModel from "../models/audit.model";
import ItemModel from "../models/item.model";
import ContactModel from "../models/contact.model";
import UserModel from "../models/user.model";
import { Role } from "../constants";

export const getHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 200;

    // Fetch audit events (sans logout) and item history entries
    const [auditEvents, itemHistory] = await Promise.all([
      getRecentEvents(limit, {
        action: { $nin: ["logout", "quantity_change"] },
      }),
      HistoryModel.find({ action: { $nin: ["upload", "quantity_change"] } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    // Fetch item denominations for referenced items
    const itemIds = [...new Set(itemHistory.map((h) => String(h.itemId)))];
    const items = await ItemModel.find({ _id: { $in: itemIds } })
      .select("denomination")
      .lean();
    const denomMap = new Map(items.map((i) => [String(i._id), i.denomination]));

    // Fetch names for contacts and users referenced in audit events
    const contactIds = auditEvents
      .filter((e) => e.entity === "contact" && e.entityId)
      .map((e) => String(e.entityId));
    const userIds = auditEvents
      .filter((e) => e.entity === "user" && e.entityId)
      .map((e) => String(e.entityId));
    const auditItemIds = auditEvents
      .filter((e) => e.entity === "item" && e.entityId)
      .map((e) => String(e.entityId));

    const actionUserNames = [
      ...new Set(auditEvents.map((e) => e.userName).filter(Boolean)),
    ] as string[];

    const [contacts, users, auditItems, actionUsers] = await Promise.all([
      contactIds.length > 0
        ? ContactModel.find({ _id: { $in: [...new Set(contactIds)] } })
            .select("nom")
            .lean()
        : [],
      userIds.length > 0
        ? UserModel.find({ _id: { $in: [...new Set(userIds)] } })
            .select("pseudo")
            .lean()
        : [],
      auditItemIds.length > 0
        ? ItemModel.find({ _id: { $in: [...new Set(auditItemIds)] } })
            .select("denomination")
            .lean()
        : [],
      actionUserNames.length > 0
        ? UserModel.find({ pseudo: { $in: actionUserNames } })
            .select("pseudo roles")
            .lean()
        : [],
    ]);

    const contactNameMap = new Map(contacts.map((c) => [String(c._id), c.nom]));
    const userNameMap = new Map(users.map((u) => [String(u._id), u.pseudo]));
    const auditItemNameMap = new Map(
      auditItems.map((i) => [String(i._id), i.denomination]),
    );

    const superadminMap = new Map(
      actionUsers.map((u) => [
        u.pseudo,
        (u.roles as string[])?.includes(Role.SUPERADMIN) || false,
      ]),
    );

    const enrichedAuditEvents = auditEvents
      .filter((e) => {
        // Exclude login events for superadmins
        if (e.action === "login" && e.userName) {
          return !superadminMap.get(e.userName);
        }
        return true;
      })
      .map((e) => {
        const obj = { ...e } as Record<string, unknown>;
        const details = (obj.details as Record<string, unknown>) || {};
        let entityName: string | undefined;

        if (e.entity === "contact") {
          entityName =
            contactNameMap.get(String(e.entityId)) ||
            ((details.deleted as Record<string, unknown>)?.nom as string) ||
            undefined;
        } else if (e.entity === "user") {
          entityName =
            userNameMap.get(String(e.entityId)) ||
            ((details.deleted as Record<string, unknown>)?.pseudo as string) ||
            undefined;
        } else if (e.entity === "item") {
          entityName =
            auditItemNameMap.get(String(e.entityId)) ||
            (details.denomination as string) ||
            undefined;
        }

        if (entityName) {
          obj.details = { ...details, entityName };
        }
        return obj;
      });

    // Normalize item history entries into audit-like shape
    const itemEvents = itemHistory.map((h) => ({
      _id: h._id,
      action: h.action,
      entity: "item",
      entityId: String(h.itemId),
      userName: h.userName,
      details: {
        field: h.field,
        oldValue: h.oldValue,
        newValue: h.newValue,
        denomination: denomMap.get(String(h.itemId)) || h.oldValue || undefined,
        entityName: denomMap.get(String(h.itemId)) || undefined,
      },
      createdAt: h.createdAt,
    }));

    const merged = [...enrichedAuditEvents, ...itemEvents].sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    );

    res.status(200).json(merged.slice(0, limit));
  } catch (err) {
    console.error("Error fetching audit history:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const purgeAllHistoryAndAudit = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userName = (res.locals.user?.pseudo as string) || "unknown";
    const [auditRes, historyRes] = await Promise.all([
      AuditModel.deleteMany({}),
      HistoryModel.deleteMany({}),
    ]);

    // Log the purge action into the audit collection
    try {
      // lazy import to avoid circular issues
      const { logEvent } = await import("../utils/audit.utils");
      await logEvent("purge", "system", undefined, userName, {
        target: "audit+history",
      });
    } catch (e) {
      console.error("Failed to log purge action:", e);
    }

    console.log(
      `Purge performed by ${userName}: audit=${auditRes.deletedCount}, history=${historyRes.deletedCount}`,
    );

    res.status(200).json({
      deletedAudit: auditRes.deletedCount ?? null,
      deletedHistory: historyRes.deletedCount ?? null,
    });
  } catch (err) {
    console.error("Error purging audit/history:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
