import { describe, it, expect, vi, Mock } from "vitest";

const mockContactModel: Record<string, Mock> = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  deleteOne: vi.fn(),
}));

vi.mock("../../models/contact.model", () => ({
  __esModule: true,
  default: mockContactModel,
}));

import {
  listContacts,
  findContactById,
  findContactDocument,
  createContact,
  deleteContactById,
} from "./contacts.service";

describe("contacts.service", () => {
  it("listContacts delegates to ContactModel.find", () => {
    const contacts = [{ _id: "c1" }];
    mockContactModel.find.mockReturnValue(contacts);
    expect(listContacts()).toBe(contacts);
    expect(mockContactModel.find).toHaveBeenCalledWith();
  });

  it("findContactById calls findById().lean()", async () => {
    const lean = vi.fn().mockResolvedValue({ _id: "c1" });
    mockContactModel.findById.mockReturnValue({ lean });
    const result = await findContactById("c1");
    expect(mockContactModel.findById).toHaveBeenCalledWith("c1");
    expect(result).toEqual({ _id: "c1" });
  });

  it("findContactDocument calls findById without lean", () => {
    const doc = { _id: "c1" };
    mockContactModel.findById.mockReturnValue(doc);
    expect(findContactDocument("c1")).toBe(doc);
    expect(mockContactModel.findById).toHaveBeenCalledWith("c1");
  });

  it("createContact delegates to ContactModel.create", async () => {
    const data = {
      name: "Dupont",
      email: "test@test.com",
      link: undefined,
      position: undefined,
      phone: undefined,
      category: "external" as const,
    };
    mockContactModel.create.mockResolvedValue({ _id: "c2", ...data });
    const result = await createContact(data);
    expect(mockContactModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ _id: "c2", ...data });
  });

  it("deleteContactById calls deleteOne({ _id }).exec()", async () => {
    const exec = vi.fn().mockResolvedValue({ deletedCount: 1 });
    mockContactModel.deleteOne.mockReturnValue({ exec });
    await deleteContactById("c1");
    expect(mockContactModel.deleteOne).toHaveBeenCalledWith({ _id: "c1" });
    expect(exec).toHaveBeenCalled();
  });
});
