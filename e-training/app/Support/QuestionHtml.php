<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class QuestionHtml
{
    public static function clean(string $html): string
    {
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        try {
            $document->loadHTML('<?xml encoding="utf-8" ?><div>'.$html.'</div>', LIBXML_NONET | LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            self::sanitize($document->documentElement);

            return implode('', array_map(fn ($node) => $document->saveHTML($node), iterator_to_array($document->documentElement->childNodes)));
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    private static function sanitize(DOMNode $parent): void
    {
        foreach (iterator_to_array($parent->childNodes) as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }
            if (in_array(strtolower($node->tagName), ['script', 'style', 'iframe', 'object', 'svg', 'math', 'form'], true)) {
                $parent->removeChild($node);

                continue;
            }
            self::sanitize($node);
            if (! in_array(strtolower($node->tagName), ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'sub', 'sup', 'h2', 'h3'], true)) {
                while ($node->firstChild) {
                    $parent->insertBefore($node->firstChild, $node);
                }
                $parent->removeChild($node);

                continue;
            }
            foreach (iterator_to_array($node->attributes) as $attribute) {
                $node->removeAttributeNode($attribute);
            }
        }
    }
}
