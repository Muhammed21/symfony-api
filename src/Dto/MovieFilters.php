<?php

namespace App\Dto;

final readonly class MovieFilters
{
    public function __construct(
        public ?string $title = null,
        public ?int $year = null,
    ) {
    }
}
