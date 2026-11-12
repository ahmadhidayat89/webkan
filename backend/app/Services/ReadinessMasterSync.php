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
            $kept = self::resolveItem($item, $oldMap, $newMap);

            if ($kept !== null) {
                $result[] = $kept;
            }
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

    /**
     * Menentukan nasib satu item form terhadap perubahan master.
     * Mengembalikan item yang dipakai, atau null bila item harus dibuang.
     */
    private static function resolveItem(array $item, array $oldMap, array $newMap): ?array
    {
        $id = (string) $item['id'];

        // Item buatan sendiri di form (bukan dari master): tidak disentuh.
        if (! isset($oldMap[$id])) {
            return $item;
        }

        $untouched = self::same($item, $oldMap[$id]);

        // Item dihapus dari master: ikut dihapus, kecuali sudah diubah khusus di form.
        if (! isset($newMap[$id])) {
            return $untouched ? null : $item;
        }

        // Item master diubah: ikut diperbarui, kecuali sudah diubah khusus di form.
        return $untouched ? $newMap[$id] : $item;
    }

    private static function canAdd(string $key, array $item, array $list, array $draft): bool
    {
        if (count($list) >= self::LIMITS[$key]) {
            return false;
        }

        return match ($key) {
            'clauses', 'documents' => ! self::hasCode($list, $item['code']),
            'questions' => self::clauseExists($draft, $item['clauseId']),
            default => true,
        };
    }

    private static function hasCode(array $list, mixed $code): bool
    {
        $codes = array_map('mb_strtolower', array_column($list, 'code'));

        return in_array(mb_strtolower((string) $code), $codes, true);
    }

    private static function clauseExists(array $draft, mixed $clauseId): bool
    {
        $clauseIds = array_map('strval', array_column($draft['clauses'], 'id'));

        return in_array((string) $clauseId, $clauseIds, true);
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
        }, array_filter($draft['questions'], fn($question) => in_array((string) $question['clauseId'], $clauseIds, true))));

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
