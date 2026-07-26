import HistoryModel from '../../models/history.model';

type ItemSnapshot = Record<string, unknown>;

const TRACKED_FIELDS = ['name', 'supplier', 'status', 'cgKit', 'tpvKit', 'image'] as const;

export async function logItemCreate(itemId: string, userName: string): Promise<void> {
  try {
    await HistoryModel.create({
      itemId,
      action: 'create',
      userName,
    });
  } catch (err) {
    console.error('History log error (create):', err);
  }
}

export async function logItemDelete(itemId: string, name: string, userName: string): Promise<void> {
  try {
    await HistoryModel.create({
      itemId,
      action: 'delete',
      field: 'name',
      oldValue: name,
      userName,
    });
  } catch (err) {
    console.error('History log error (delete):', err);
  }
}

export async function logItemChanges(
  itemId: string,
  oldItem: ItemSnapshot,
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
      Object.prototype.hasOwnProperty.call(newData, 'quantity') &&
      Number(newData.quantity) !== Number(oldItem.quantity)
    ) {
      entries.push({
        itemId,
        action: 'quantity_change',
        field: 'quantity',
        oldValue: String(oldItem.quantity),
        newValue: String(newData.quantity),
        userName,
      });
    }

    // Check tracked fields
    for (const field of TRACKED_FIELDS) {
      if (
        Object.prototype.hasOwnProperty.call(newData, field) &&
        String(newData[field]) !== String(oldItem[field])
      ) {
        entries.push({
          itemId,
          action: 'update',
          field,
          oldValue: String(oldItem[field] ?? ''),
          newValue: String(newData[field]),
          userName,
        });
      }
    }

    if (entries.length > 0) {
      await HistoryModel.insertMany(entries);
    }
  } catch (err) {
    console.error('History log error (update):', err);
  }
}
