const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decodeNumericEntity = (entity) => {
  const isHex = entity[1] === "x" || entity[1] === "X";
  const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
  if (!Number.isFinite(code)) return null;
  try {
    return String.fromCodePoint(code);
  } catch {
    return null;
  }
};

export function decodeHtmlEntities(value = "") {
  if (!value) return "";
  return String(value).replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (match, entity) => {
    if (!entity) return match;
    if (entity[0] === "#") {
      const decoded = decodeNumericEntity(entity);
      return decoded !== null ? decoded : match;
    }
    const key = entity.toLowerCase();
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key)
      ? NAMED_ENTITIES[key]
      : match;
  });
}

export function richTextToPlainText(value = "") {
  if (!value) return "";
  let text = decodeHtmlEntities(String(value));

  // Normalize common block separators to newlines
  text = text
    .replace(/\r\n?/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n");

  // Drop any remaining tags and collapse spaces
  text = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ");

  return text.trim();
}
