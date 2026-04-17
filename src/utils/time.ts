const BANGLADESH_TIMEZONE_OFFSET_HOURS = 6;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const toBangladeshIsoString = (date: Date): string => {
  const shiftedDate = new Date(
    date.getTime() + BANGLADESH_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
  );

  return shiftedDate.toISOString().replace('Z', '+06:00');
};

export const mapDatesToBangladeshTime = <T>(value: T): T => {
  if (value instanceof Date) {
    return toBangladeshIsoString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapDatesToBangladeshTime(item)) as T;
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = mapDatesToBangladeshTime(nestedValue);
    }

    return output as T;
  }

  return value;
};
