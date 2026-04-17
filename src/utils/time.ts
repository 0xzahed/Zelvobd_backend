const BANGLADESH_TIMEZONE_OFFSET_HOURS = 6;
const BANGLADESH_TIMEZONE_OFFSET_SUFFIX = '+06:00';
const HAS_TIMEZONE_SUFFIX_REGEX = /(z|[+-]\d{2}:?\d{2})$/i;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_WITH_SPACE_REGEX = /^\d{4}-\d{2}-\d{2} /;

const asValidDate = (value: Date | string | number): Date | null => {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

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

  return shiftedDate.toISOString().replace('Z', BANGLADESH_TIMEZONE_OFFSET_SUFFIX);
};

export const parseDateInBangladeshTimezone = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    return asValidDate(value);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  if (DATE_ONLY_REGEX.test(trimmedValue)) {
    return asValidDate(`${trimmedValue}T00:00:00${BANGLADESH_TIMEZONE_OFFSET_SUFFIX}`);
  }

  const normalizedDateTime = DATETIME_WITH_SPACE_REGEX.test(trimmedValue)
    ? trimmedValue.replace(' ', 'T')
    : trimmedValue;

  if (HAS_TIMEZONE_SUFFIX_REGEX.test(normalizedDateTime)) {
    return asValidDate(normalizedDateTime);
  }

  return asValidDate(`${normalizedDateTime}${BANGLADESH_TIMEZONE_OFFSET_SUFFIX}`);
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
