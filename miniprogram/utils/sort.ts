function toDisplayText(value: any) {
  return String(value ?? '').trim();
}

function extractFloorRank(name?: string | null) {
  const raw = toDisplayText(name);
  const match = raw.match(/-?\d+(\.\d+)?/);

  if (match) {
    return Number(match[0]);
  }

  const zhMap: Record<string, number> = {
    地下: -1,
    负一: -1,
    负二: -2,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };

  for (const [key, value] of Object.entries(zhMap)) {
    if (raw.includes(key)) {
      return value;
    }
  }

  return Number.POSITIVE_INFINITY;
}

export function compareNaturalText(a?: string | null, b?: string | null) {
  return toDisplayText(a).localeCompare(toDisplayText(b), 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  });
}

export function compareFloorName(a?: string | null, b?: string | null) {
  const rankA = extractFloorRank(a);
  const rankB = extractFloorRank(b);

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return compareNaturalText(a, b);
}

export function compareSeatPosition(
  a: {
    floorName?: string | null;
    floor?: string | null;
    zone?: string | null;
    row?: number | string | null;
    rowNum?: number | string | null;
    col?: number | string | null;
    colNum?: number | string | null;
    id?: number | string | null;
  },
  b: {
    floorName?: string | null;
    floor?: string | null;
    zone?: string | null;
    row?: number | string | null;
    rowNum?: number | string | null;
    col?: number | string | null;
    colNum?: number | string | null;
    id?: number | string | null;
  }
) {
  const floorCompare = compareFloorName(a.floorName ?? a.floor, b.floorName ?? b.floor);
  if (floorCompare !== 0) return floorCompare;

  const zoneCompare = compareNaturalText(a.zone, b.zone);
  if (zoneCompare !== 0) return zoneCompare;

  const rowCompare =
    Number(a.row ?? a.rowNum ?? Number.POSITIVE_INFINITY) -
    Number(b.row ?? b.rowNum ?? Number.POSITIVE_INFINITY);
  if (rowCompare !== 0) return rowCompare;

  const colCompare =
    Number(a.col ?? a.colNum ?? Number.POSITIVE_INFINITY) -
    Number(b.col ?? b.colNum ?? Number.POSITIVE_INFINITY);
  if (colCompare !== 0) return colCompare;

  return compareNaturalText(String(a.id ?? ''), String(b.id ?? ''));
}

export function sortByFloorName<T extends { name?: string | null }>(list: T[]) {
  return [...list].sort((a, b) => compareFloorName(a.name, b.name));
}

export function sortBySeatPosition<
  T extends {
    floorName?: string | null;
    floor?: string | null;
    zone?: string | null;
    row?: number | string | null;
    rowNum?: number | string | null;
    col?: number | string | null;
    colNum?: number | string | null;
    id?: number | string | null;
  },
>(list: T[]) {
  return [...list].sort(compareSeatPosition);
}
