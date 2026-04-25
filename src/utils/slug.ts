const normalizeSpaces = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

export const createSlugBaseFromTitle = (title: string, fallback: string): string => {
  const normalizedTitle = normalizeSpaces(title).toLocaleLowerCase().normalize('NFKC');

  const slug = normalizedTitle
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
};

export const createUniqueSlug = async (
  title: string,
  fallback: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> => {
  const baseSlug = createSlugBaseFromTitle(title, fallback);

  if (!(await exists(baseSlug))) {
    return baseSlug;
  }

  let counter = 2;

  while (true) {
    const nextSlug = `${baseSlug}-${counter}`;

    if (!(await exists(nextSlug))) {
      return nextSlug;
    }

    counter += 1;
  }
};
