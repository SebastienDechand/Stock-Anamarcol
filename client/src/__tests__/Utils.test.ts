import { dateParser, uploadErrors } from "../Utils";

describe("Utils", () => {
  describe("dateParser", () => {
    it("should format an ISO date into a French locale string", () => {
      const result = dateParser("2024-01-15T10:30:00.000Z");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("2024");
    });

    it("should handle a timestamp date", () => {
      const result = dateParser("2023-06-20T14:00:00Z");
      expect(result).toContain("2023");
    });
  });

  describe("uploadErrors", () => {
    it("should detect an invalid file format", () => {
      const err = { message: "Invalid file format" } as Error;
      const result = uploadErrors(err, "application/pdf", "test.pdf");
      expect(result.format).toContain("Format incompatible");
      expect(result.format).toContain("application/pdf");
    });

    it("should detect a file that is too large", () => {
      const err = { message: "Max size exceeded" } as Error;
      const result = uploadErrors(err, null, "big.jpg");
      expect(result.maxSize).toBe(
        "Le fichier est trop volumineux, maximum 2.5Mo",
      );
    });

    it("should return empty fields when no matching error", () => {
      const err = { message: "unknown error" } as Error;
      const result = uploadErrors(err, null, "file.txt");
      expect(result.format).toBe("");
      expect(result.maxSize).toBe("");
    });
  });
});
