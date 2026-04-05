export const extractReadableText = async (file) => {
  const buffer = await file.arrayBuffer();
  const utf8Text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const latin1Text = new TextDecoder("latin1", { fatal: false }).decode(buffer);
  const sourceText = utf8Text.length > latin1Text.length ? utf8Text : latin1Text;

  return sourceText
    .replace(/<[^>]+>/g, " ")
    .replace(/[_]{2,}/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ")
    .replace(/\b(?:PK|obj|endobj|stream|endstream|xref)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const formatFileSize = (bytes = 0) => {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
