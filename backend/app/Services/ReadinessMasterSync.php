<?php

namespace App\Services;

/**
 * Menerapkan perubahan data master Readiness Assessment ke draf sebuah form.
 *
 * Aturan:
 * - Item master baru ditambahkan ke form (mengikuti urutan master).
 * - Item master yang diubah ikut diperbarui di form, selama item tersebut belum
 *   diubah secara khusus di dalam form.
 * - Item master yang dihapus ikut dihapus dari form, selama item tersebut belum
 *   diubah secara khusus di dalam form.
 * - Item yang dibuat sendiri di form (bukan dari master) tidak pernah disentuh.
 */
class ReadinessMasterSync
{
    /** Urutan proses: dokumen & klausul lebih dulu karena dirujuk oleh butir penilaian. */
    private const ORDER = ['documents', 'clauses', 'questions', 'identity', 'glossary'];

    private const LIMITS = ['documents' => 100, 'clauses' => 100, 'questions' => 500, 'identity' => 50, 'glossary' => 100];

    public static function apply(array $old, array $new, array $draft): array
    {
        foreach (self::ORDER as $key) {
            $draft[$key] = self::syncList($key, $old[$key] ?? [], $new[$key] ?? [], $draft[$key] ?? [], $draft);
        }

        return self::cleanup($draft);
    }

    private static function syncList(string $key, array $old, array $new, array $items, array $draft): array
    {
        $oldMap = self::keyed($old);
        $newMap = self::keyed($new);
        $result = [];

        foreach ($items as $item) {
            $id = (string) $item['id'];

            if (! isset($oldMap[$id])) {
                $result[] = $item;

                continue;
            }

            $untouched = self::same($item, $oldMap[$id]);

            if (! isset($newMap[$id])) {
                if (! $untouched) {
                    $result[] = $item;
                }

                continue;
            }

            $result[] = $untouched ? $newMap[$id] : $item;
        }

        $present = array_map('strval', array_column($result, 'id'));

        foreach ($new as $index => $masterItem) {
            $id = (string) $masterItem['id'];

            if (isset($oldMap[$id]) || in_array($id, $present, true)) {
                continue;
            }

            if (! self::canAdd($key, $masterItem, $result, $draft)) {
                continue;
            }

            $result = self::insertOrdered($result, $new, $index, $masterItem);
            $present[] = $id;
        }

        return $result;
    }

    private static function canAdd(string $key, array $item, array $list, array $draft): bool
    {
        if (count($list) >= self::LIMITS[$key]) {
            return false;
        }

        if (in_array($key, ['clauses', 'documents'], true)) {
            $codes = array_map('mb_strtolower', array_column($list, 'code'));

            return ! in_array(mb_strtolower($item['code']), $codes, true);
        }

        if ($key === 'questions') {
            return in_array((string) $item['clauseId'], array_map('strval', array_column($draft['clauses'], 'id')), true);
        }

        return true;
    }

    private static function insertOrdered(array $list, array $master, int $index, array $item): array
    {
        $ids = array_map('strval', array_column($list, 'id'));

        for ($j = $index - 1; $j >= 0; $j--) {
            $pos = array_search((string) $master[$j]['id'], $ids, true);
            if ($pos !== false) {
                array_splice($list, $pos + 1, 0, [$item]);

                return $list;
            }
        }

        for ($j = $index + 1; $j < count($master); $j++) {
            $pos = array_search((string) $master[$j]['id'], $ids, true);
            if ($pos !== false) {
                array_splice($list, $pos, 0, [$item]);

                return $list;
            }
        }

        $list[] = $item;

        return $list;
    }

    private static function cleanup(array $draft): array
    {
        $clauseIds = array_map('strval', array_column($draft['clauses'], 'id'));
        $documentIds = array_map('strval', array_column($draft['documents'], 'id'));

        $draft['questions'] = array_values(array_map(function ($question) use ($documentIds) {
            if ($question['documentId'] !== null && ! in_array((string) $question['documentId'], $documentIds, true)) {
                $question['documentId'] = null;
                $question['evidence'] = null;
            }

            return $question;
        }, array_filter($draft['questions'], fn ($question) => in_array((string) $question['clauseId'], $clauseIds, true))));

        return $draft;
    }

    private static function keyed(array $items): array
    {
        $map = [];
        foreach ($items as $item) {
            $map[(string) $item['id']] = $item;
        }

        return $map;
    }

    private static function same(array $a, array $b): bool
    {
        ksort($a);
        ksort($b);

        return $a == $b;
    }
}
