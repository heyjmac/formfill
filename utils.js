export const sanitizeObject = (input) => {
  const map = new Map([
    // quotes/apostrophes/backticks
    ['\u2018', "'"],
    ['\u2019', "'"],
    ['\u201B', "'"],
    ['\u2032', "'"],
    ['\u275B', "'"],
    ['\u275C', "'"],
    ['\u201C', '"'],
    ['\u201D', '"'],
    ['\u201F', '"'],
    ['\u2033', '"'],
    ['\u275D', '"'],
    ['\u275E', '"'],
    ['\u00B4', "'"],
    ['\u2035', "'"],
    ['\u2036', '"'],
    ['\u0060', "'"],
    ['\u00AB', '"'],
    ['\u00BB', '"'],
    // dashes/minus/hyphens
    ['\u2013', '-'],
    ['\u2014', '-'],
    ['\u2212', '-'],
    ['\u2010', '-'],
    ['\u2012', '-'],
    ['\u2015', '-'],
    // ellipsis
    ['\u2026', '...'],
    // spaces/joins
    ['\u00A0', ' '],
    ['\u2009', ' '],
    ['\u2002', ' '],
    ['\u2003', ' '],
    ['\u2004', ' '],
    ['\u2005', ' '],
    ['\u2006', ' '],
    ['\u2007', ' '],
    ['\u2008', ' '],
    // bullets/middot
    ['\u2022', '-'],
    ['\u00B7', '-'],
    // math-like symbols
    ['\u00D7', 'x'],
    ['\u00F7', '/'],
    ['\u2264', '<='],
    ['\u2265', '>='],
    ['\u2260', '!='],
    ['\u221E', 'infinity'],
    // fractions
    ['\u00BC', '1/4'],
    ['\u00BD', '1/2'],
    ['\u00BE', '3/4'],
    ['\u2153', '1/3'],
    ['\u2154', '2/3'],
    ['\u2155', '1/5'],
    ['\u2156', '2/5'],
    ['\u2157', '3/5'],
    ['\u2158', '4/5'],
    // degree/currency/trademark/copyright
    ['\u00B0', ' deg'],
    ['\u20AC', ' EUR'],
    ['\u00A3', ' GBP'],
    ['\u00A5', ' JPY'],
    ['\u00A2', ' cent'],
    ['\u2122', ' (TM)'],
    ['\u00AE', ' (R)'],
    ['\u00A9', ' (C)'],
  ]);
  const zeroWidthRe = /[\u200B-\u200D\uFEFF\u2060]/g; // ZWSP, ZWJ, ZWNJ, BOM, WORD JOINER
  const controlRe = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g; // control chars except TAB(9), LF(10), CR(13)
  const replaceChars = (s) => {
    let out = s.normalize('NFKC').replace(zeroWidthRe, '').replace(controlRe, ' ');
    // fast path for mapped chars
    out = out.replace(
      /[\u00A0\u00A2\u00A3\u00A5\u00A9\u00AB\u00AD\u00AE\u00B0\u00B4\u00B7\u00BB\u00BC-\u00BE\u00D7\u00F7\u2002-\u2009\u2010-\u2015\u2018-\u201F\u2022\u2026\u2032-\u2036\u2060\u2212\u221E\u2260\u2264\u2265\u275B-\u275E]/g,
      (ch) => map.get(ch) ?? ch,
    );
    // collapse whitespace and trim
    return out
      .replace(/[ \t\f\v]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim();
  };
  const sanitize = (val, seen = new WeakSet()) => {
    if (val == null) return val;
    if (typeof val === 'string') return replaceChars(val);
    if (typeof val === 'number' || typeof val === 'boolean') return val;
    if (typeof val === 'bigint')
      return Number.isSafeInteger(Number(val)) ? Number(val) : replaceChars(String(val));
    if (typeof val === 'symbol' || typeof val === 'function') return replaceChars(String(val));
    if (Array.isArray(val)) return val.map((v) => sanitize(v, seen));
    if (typeof val === 'object') {
      if (seen.has(val)) return null;
      seen.add(val);
      const out = {};
      for (const [k, v] of Object.entries(val)) out[replaceChars(String(k))] = sanitize(v, seen);
      return out;
    }
    return replaceChars(String(val));
  };
  return sanitize(input);
};
