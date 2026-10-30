// PostgreSQL JSON objects may return keys in a different order after saving.
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .filter(key => value[key] !== undefined)
        .map(key => [key, canonical(value[key])])
    );
  }
  return value;
};

export const surveyFingerprint = (title, description, settings, questions) => JSON.stringify(canonical({
  title, description, settings,
  questions: questions.map(q => ({
    text: q.text,
    type: q.type,
    req: q.req,
    opts: q.opts,
    image_url: q.image_url || null,
    validation: q.validation || {},
    config: { ...q.config, key: undefined },
  })),
}));
