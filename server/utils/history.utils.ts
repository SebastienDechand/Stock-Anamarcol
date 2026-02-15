import HistoryModel from "../models/history.model";
import type { IItem } from "../models/item.model";

const TRACKED_FIELDS = [
  "denomination",
  "fournisseur",
  "etat",
  "prepaCG",
  "prepaTPV",
  "image",
] as const;

export async function logItemCreate(
  itemId: string,
  userName: string,
): Promise<void> {
  try {
    await HistoryModel.create({
      itemId,
      action: "create",
      userName,
    });
  } catch (err) {
    console.error("History log error (create):", err);
  }
}

export async function logItemDelete(
  itemId: string,
  denomination: string,
  userName: string,
): Promise<void> {
  try {
    await HistoryModel.create({
      itemId,
      action: "delete",
      field: "denomination",
      oldValue: denomination,
      userName,
    });
  } catch (err) {
    console.error("History log error (delete):", err);
  }
}

export async function logItemChanges(
  itemId: string,
  oldItem: IItem,
  newData: Record<string, unknown>,
  userName: string,
): Promise<void> {
  try {
    const entries: Array<{
      itemId: string;
      action: string;
      field: string;
      oldValue: string;
      newValue: string;
      userName: string;
    }> = [];

    // Check quantity change separately
    if (
      Object.prototype.hasOwnProperty.call(newData, "quantite") &&
      Number(newData.quantite) !== Number(oldItem.quantite)
    ) {
      entries.push({
        itemId,
        action: "quantity_change",
        field: "quantite",
        oldValue: String(oldItem.quantite),
        newValue: String(newData.quantite),
        userName,
      });
    }

    // Check tracked fields
    for (const field of TRACKED_FIELDS) {
      if (
        Object.prototype.hasOwnProperty.call(newData, field) &&
        String(newData[field]) !== String(oldItem[field as keyof IItem])
      ) {
        entries.push({
          itemId,
          action: "update",
          field,
          oldValue: String(oldItem[field as keyof IItem] ?? ""),
          newValue: String(newData[field]),
          userName,
        });
      }
    }

    if (entries.length > 0) {
      await HistoryModel.insertMany(entries);
    }
  } catch (err) {
    console.error("History log error (update):", err);
  }
}
