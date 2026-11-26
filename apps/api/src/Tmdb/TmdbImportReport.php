<?php

namespace App\Tmdb;

final readonly class TmdbImportReport
{
    /**
     * @param list<string> $ignored
     */
    public function __construct(
        public int $created,
        public int $updated,
        public array $ignored,
    ) {
    }
}
