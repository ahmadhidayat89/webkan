<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveReadinessAssessment extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $draft = $this->input('draft');
        if (! is_array($draft)) {
            return;
        }

        $draft['messages'] = is_array($draft['messages'] ?? null) ? $draft['messages'] : null;

        if (is_array($draft['questions'] ?? null)) {
            $draft['questions'] = array_map(
                fn ($question) => $this->withNullDefaults($question, ['optHint']),
                $draft['questions']
            );
        }

        if (is_array($draft['identity'] ?? null)) {
            $draft['identity'] = array_map(
                fn ($identity) => $this->withNullDefaults($identity, ['placeholder', 'hint']),
                $draft['identity']
            );
        }

        $this->merge(['draft' => $draft]);
    }

    /**
     * Pastikan key tertentu selalu ada (default null) pada item berbentuk array.
     */
    private function withNullDefaults(mixed $item, array $keys): mixed
    {
        if (! is_array($item)) {
            return $item;
        }

        foreach ($keys as $key) {
            if (! array_key_exists($key, $item)) {
                $item[$key] = null;
            }
        }

        return $item;
    }

    public function rules(): array
    {
        return [
            'draft' => 'required|array:title,standard,subtitle,intro,messages,clauses,questions,identity,documents,glossary',
            'draft.title' => 'required|string|max:200',
            'draft.standard' => 'required|string|max:120',
            'draft.subtitle' => 'present|nullable|string|max:250',
            'draft.intro' => 'present|nullable|string|max:3000',
            'draft.messages' => 'nullable|array:limitation,guideYes,guidePartial,guideNo,guideOptional,descSiap,descCukup,descKurang,descBelum,completeMessage,nextStepMessage',
            'draft.messages.limitation' => 'nullable|string|max:2000',
            'draft.messages.guideYes' => 'nullable|string|max:2000',
            'draft.messages.guidePartial' => 'nullable|string|max:2000',
            'draft.messages.guideNo' => 'nullable|string|max:2000',
            'draft.messages.guideOptional' => 'nullable|string|max:2000',
            'draft.messages.descSiap' => 'nullable|string|max:2000',
            'draft.messages.descCukup' => 'nullable|string|max:2000',
            'draft.messages.descKurang' => 'nullable|string|max:2000',
            'draft.messages.descBelum' => 'nullable|string|max:2000',
            'draft.messages.completeMessage' => 'nullable|string|max:2000',
            'draft.messages.nextStepMessage' => 'nullable|string|max:2000',
            'draft.clauses' => 'present|array|list|max:100',
            'draft.clauses.*' => 'required|array:id,code,title,description,always',
            'draft.clauses.*.id' => 'required|string|alpha_dash:ascii|max:64|distinct',
            'draft.clauses.*.code' => 'required|string|max:40|distinct:ignore_case',
            'draft.clauses.*.title' => 'required|string|max:200',
            'draft.clauses.*.description' => 'present|nullable|string|max:600',
            'draft.clauses.*.always' => 'required|boolean:strict',
            'draft.questions' => 'present|array|list|max:500',
            'draft.questions.*' => 'required|array:id,clauseId,reference,text,allowNA,optHint,documentId,evidence',
            'draft.questions.*.id' => 'required|string|alpha_dash:ascii|max:64|distinct',
            'draft.questions.*.clauseId' => 'required|string',
            'draft.questions.*.reference' => 'present|nullable|string|max:120',
            'draft.questions.*.text' => 'required|string|max:4000',
            'draft.questions.*.allowNA' => 'required|boolean:strict',
            'draft.questions.*.optHint' => 'nullable|string|max:1000',
            'draft.questions.*.documentId' => 'present|nullable|string',
            'draft.questions.*.evidence' => 'present|nullable|in:Wajib,Jika ada',
            'draft.identity' => 'present|array|list|max:50',
            'draft.identity.*' => 'required|array:id,label,placeholder,hint',
            'draft.identity.*.id' => 'required|string|alpha_dash:ascii|max:64|distinct',
            'draft.identity.*.label' => 'required|string|max:250',
            'draft.identity.*.placeholder' => 'nullable|string|max:250',
            'draft.identity.*.hint' => 'nullable|string|max:600',
            'draft.documents' => 'present|array|list|max:100',
            'draft.documents.*' => 'required|array:id,code,title,sample',
            'draft.documents.*.id' => 'required|string|alpha_dash:ascii|max:64|distinct',
            'draft.documents.*.code' => 'required|string|max:40|distinct:ignore_case',
            'draft.documents.*.title' => 'required|string|max:350',
            'draft.documents.*.sample' => 'present|nullable|string|max:250',
            'draft.glossary' => 'present|array|list|max:100',
            'draft.glossary.*' => 'required|array:id,term,definition,note',
            'draft.glossary.*.id' => 'required|string|alpha_dash:ascii|max:64|distinct',
            'draft.glossary.*.term' => 'required|string|max:250',
            'draft.glossary.*.definition' => 'required|string|max:3000',
            'draft.glossary.*.note' => 'present|nullable|string|max:3000',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $draft = $validator->validated()['draft'];
            $clauses = array_column($draft['clauses'], 'id');
            $documents = array_column($draft['documents'], 'id');

            foreach ($draft['questions'] as $index => $question) {
                if (! in_array($question['clauseId'], $clauses, true)) {
                    $validator->errors()->add("draft.questions.$index.clauseId", 'Klausul pada butir tidak ditemukan.');
                }

                if ($question['documentId'] !== null && ! in_array($question['documentId'], $documents, true)) {
                    $validator->errors()->add("draft.questions.$index.documentId", 'Dokumen acuan pada butir tidak ditemukan.');
                }

                if (($question['documentId'] === null) !== ($question['evidence'] === null)) {
                    $validator->errors()->add("draft.questions.$index.evidence", 'Atur status bukti hanya untuk butir yang memiliki dokumen acuan.');
                }
            }
        }];
    }
}
