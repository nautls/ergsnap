export function shorten(
  val: string | undefined,
  maxLength: number | undefined,
  ellipsisPosition: "middle" | "end" = "middle",
): string {
  if (!val || !maxLength || maxLength >= val.length) {
    return val || "";
  }

  const ellipsis = "…";
  if (ellipsisPosition === "middle") {
    const fragmentSize = Math.trunc((maxLength - ellipsis.length) / 2);
    if (fragmentSize * 2 + ellipsis.length >= val.length) {
      return val;
    }

    return `${val.slice(0, fragmentSize).trimEnd()}${ellipsis}${val
      .slice(val.length - fragmentSize)
      .trimStart()}`;
  } else {
    return `${val
      .slice(0, maxLength - ellipsis.length + 1)
      .trimEnd()}${ellipsis}`;
  }
}
