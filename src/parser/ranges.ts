export interface LocalCodeLocation {
  line: number;
  column: number;
}

// tslint:disable-next-line:no-empty-interface
export type CodeLocation = LocalCodeLocation;

export interface CodeLocationRange {
  start: CodeLocation;
  end: CodeLocation;
}

export const rangesEqual = (a: CodeLocation, b: CodeLocation) =>
  // a.file === b.file &&
  a.line === b.line && a.column === b.column;

export const rangesIntervalEqual = (a: CodeLocationRange, b: CodeLocationRange) =>
  rangesEqual(a.start, b.start) && rangesEqual(a.end, b.end);

export const localRangeMin = (v: CodeLocation, max: LocalCodeLocation): CodeLocation => {
  if (v.line < max.line) {
    return v;
  }

  if (v.line === max.line) {
    return {
      // file: v.file,
      line: v.line,
      column: Math.min(v.column, max.column),
    };
  }

  return {
    // file: v.file,
    ...max,
  };
};

export const localRangeMax = (v: CodeLocation, min: LocalCodeLocation): CodeLocation => {
  if (v.line > min.line) {
    return v;
  }

  if (v.line === min.line) {
    return {
      // file: v.file,
      line: v.line,
      column: Math.max(v.column, min.column),
    };
  }

  return {
    // file: v.file,
    ...min,
  };
};

export const createRange = (line: number, column: number): CodeLocation => ({
  line,
  column,
});
