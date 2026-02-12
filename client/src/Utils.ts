export const dateParser = (num: string | undefined): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const timestamp = Date.parse(num || "");
  const date = new Date(timestamp).toLocaleDateString("fr-FR", options);

  return date.toString();
};

export const uploadErrors = (
  err: Error,
  detectedMimeType: string | null,
  fileName: string,
): { format: string; maxSize: string } => {
  const errors = { format: "", maxSize: "" };

  if (err.message.includes("Invalid file")) {
    const detectedMimeMessage = detectedMimeType
      ? `Detected MIME type: ${detectedMimeType}.`
      : "";
    errors.format = `Format incompatible. ${detectedMimeMessage} `;
  }

  if (err.message.includes("Max size")) {
    errors.maxSize = "Le fichier est trop volumineux, maximum 2.5Mo";
  }

  console.error("Detected MIME Type:", detectedMimeType);
  console.error("File Name:", fileName);

  return errors;
};
