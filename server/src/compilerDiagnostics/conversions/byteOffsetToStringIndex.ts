/**
 * solc reports source locations as offsets into the UTF-8 encoded source, while
 * `TextDocument` and `@solidity-parser` both work in UTF-16 code units. The two
 * agree only while the file stays ASCII - one accented character, em dash or
 * emoji anywhere earlier in the file and every solc offset after it is too
 * large.
 *
 * Returns the index into `text` that `byteOffset` points at.
 */
export function byteOffsetToStringIndex(
  text: string,
  byteOffset: number
): number {
  if (byteOffset <= 0) {
    return 0;
  }

  let bytes = 0;
  let index = 0;

  while (index < text.length && bytes < byteOffset) {
    // Non-null assertion is safe: index is inside the string.
    const codePoint = text.codePointAt(index)!;

    if (codePoint < 0x80) {
      bytes += 1;
    } else if (codePoint < 0x800) {
      bytes += 2;
    } else if (codePoint < 0x10000) {
      bytes += 3;
    } else {
      bytes += 4;
    }

    // Anything above the BMP is stored as a surrogate pair.
    index += codePoint > 0xffff ? 2 : 1;
  }

  return index;
}
