export const QUESTION_TYPES = {
    multiple_choice: 'Pilihan Ganda', true_false: 'Benar / Salah',
    essay: 'Esai', short_answer: 'Jawaban Singkat',
};
export function defaultOptions(type) {
    return ['multiple_choice', 'true_false'].includes(type)
        ? [{ option_text: type === 'true_false' ? 'Benar' : '', is_correct: true }, { option_text: type === 'true_false' ? 'Salah' : '', is_correct: false }]
        : [];
}
export function categoryLabel(category, categories) {
    const names = [category.name];
    const seen = new Set([category.id]);
    let parent = categories.find(item => item.id === category.parent_id);
    while (parent && !seen.has(parent.id)) {
        seen.add(parent.id); names.unshift(parent.name);
        parent = categories.find(item => item.id === parent.parent_id);
    }
    return names.join(' / ');
}
