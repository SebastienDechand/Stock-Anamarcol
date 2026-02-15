import { Request, Response } from "express";
import { getRecentEvents } from "../utils/audit.utils";
import HistoryModel from "../models/history.model";
import ItemModel from "../models/item.model";
import ContactModel from "../models/contact.model";
import UserModel from "../models/user.model";

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 200;

    // Fetch audit events (sans logout) and item history entries
    const [auditEvents, itemHistory] = await Promise.all([
      getRecentEvents(limit, { action: { $nin: ["logout", "upload", "quantity_change"] } }),
      HistoryModel.find({ action: { $nin: ["upload", "quantity_change"] } }).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    // Récupérer les dénominations des items référencés
    const itemIds = [...new Set(itemHistory.map((h) => String(h.itemId)))];
    const items = await ItemModel.find({ _id: { $in: itemIds } })
      .select("denomination")
      .lean();
    const denomMap = new Map(items.map((i) => [String(i._id), i.denomination]));

    // Récupérer les noms des contacts et membres référencés dans les audit events
    const contactIds = auditEvents
      .filter((e) => e.entity === "contact" && e.entityId)
      .map((e) => String(e.entityId));
    const userIds = auditEvents
      .filter((e) => e.entity === "user" && e.entityId)
      .map((e) => String(e.entityId));
    const auditItemIds = auditEvents
      .filter((e) => e.entity === "item" && e.entityId)
      .map((e) => String(e.entityId));

    const [contacts, users, auditItems] = await Promise.all([
      contactIds.length > 0
        ? ContactModel.find({ _id: { $in: [...new Set(contactIds)] } }).select("nom").lean()
        : [],
      userIds.length > 0
        ? UserModel.find({ _id: { $in: [...new Set(userIds)] } }).select("pseudo").lean()
        : [],
      auditItemIds.length > 0
        ? ItemModel.find({ _id: { $in: [...new Set(auditItemIds)] } }).select("denomination").lean()
        : [],
    ]);

    const contactNameMap = new Map(contacts.map((c) => [String(c._id), c.nom]));
    const userNameMap = new Map(users.map((u) => [String(u._id), u.pseudo]));
    const auditItemNameMap = new Map(auditItems.map((i) => [String(i._id), i.denomination]));

    // Enrichir les audit events avec le nom de l'entité
    const enrichedAuditEvents = auditEvents.map((e) => {
      const obj = { ...e } as Record<string, unknown>;
      const details = (obj.details as Record<string, unknown>) || {};
      let entityName: string | undefined;

      if (e.entity === "contact") {
        entityName = contactNameMap.get(String(e.entityId))
          || (details.deleted as Record<string, unknown>)?.nom as string
          || undefined;
      } else if (e.entity === "user") {
        entityName = userNameMap.get(String(e.entityId))
          || (details.deleted as Record<string, unknown>)?.pseudo as string
          || undefined;
      } else if (e.entity === "item") {
        entityName = auditItemNameMap.get(String(e.entityId))
          || details.denomination as string
          || undefined;
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
      (a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
    );

    res.status(200).json(merged.slice(0, limit));
  } catch (err) {
    console.error("Error fetching audit history:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
