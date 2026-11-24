<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class MovieFilters
{
    public function __construct(
        public ?string $title = null,
        public ?int $year = null,

        #[Assert\Positive(message: "L'identifiant du genre doit être supérieur à 0.")]
        public ?int $genre = null,
    ) {
    }
}
