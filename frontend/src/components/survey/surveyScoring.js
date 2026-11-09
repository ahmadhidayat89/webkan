const compareValues = (a, b) => String(a).localeCompare(String(b));

export const supportsWeightedScoring = type => ['choice', 'drop', 'scale', 'rating', 'linear'].includes(type);

export function scoringChoices(question) {
  const config = question.config || {};
  if (['choice', 'drop'].includes(question.type)) {
    return (question.opts || question.options || []).map(value => ({ value, label: value }));
  }
  const min = question.type === 'linear' ? Number(config.min ?? 1) : 1;
  const max = question.type === 'scale' ? 5 : Number(config.max ?? 5);
  return Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => {
    const value = String(min + index);
    const label = question.type === 'scale' ? (question.opts || question.options || [])[Number(value) - 1] : '';
    return { value, label: label ? `${value} · ${label}` : value };
  });
}

export function answerScores(question) {
  return scoringChoices(question).map(({ value }) => ({
    value,
    points: (question.config?.answer_scores || []).find(entry => entry.value === value)?.points
      ?? (['scale', 'rating', 'linear'].includes(question.type) ? Number(value) : 0),
  }));
}

export function scoringConfig(question) {
  const config = { ...question.config };
  if (config.score_mode === 'weighted' && supportsWeightedScoring(question.type)) {
    config.answer_scores = answerScores(question);
    config.points = Math.max(0, ...config.answer_scores.map(entry => entry.points));
    delete config.correct_answers;
  } else {
    delete config.answer_scores;
  }
  return config;
}

export function gradeSurvey(questions, answers) {
  return questions.reduce((total, question) => {
    if (['section', 'heading', 'image', 'video'].includes(question.type)) return total;
    const config = scoringConfig(question);
    const answer = answers[question.id];
    if (config.score_mode === 'weighted' && supportsWeightedScoring(question.type)) {
      total.max += config.points;
      if (answer != null && typeof answer !== 'object') {
        total.score += Number(config.answer_scores.find(entry => entry.value === String(answer))?.points ?? 0);
      }
    } else {
      const keys = config.correct_answers || [];
      const points = config.points ?? (keys.length ? 1 : 0);
      total.max += Number(points);
      const given = Array.isArray(answer) ? [...answer] : [String(answer ?? '')];
      given.sort(compareValues);
      const sortedKeys = [...keys];
      sortedKeys.sort(compareValues);
      if (keys.length && JSON.stringify(given) === JSON.stringify(sortedKeys)) total.score += Number(points);
    }
    return total;
  }, { score: 0, max: 0 });
}
