<?php

namespace App\Dto;

use App\Enum\AgeRating;
use App\Validator\ExistingGenres;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

final readonly class MovieInput
{
    public const FIRST_FILM_YEAR = 1888;
    public const MAX_YEARS_AHEAD = 5;

    public function __construct(
        #[Assert\NotBlank(message: 'Le titre est obligatoire.')]
        #[Assert\Length(max: 255, maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères.')]
        public string $title,

        #[Assert\GreaterThanOrEqual(
            value: self::FIRST_FILM_YEAR,
            message: "L'année de sortie ne peut pas être antérieure à {{ compared_value }}.",
        )]
        public int $releaseYear,

        #[Assert\Positive(message: 'La durée doit être supérieure à 0 minute.')]
        public int $duration,

        public AgeRating $ageRating,

        #[Assert\Length(max: 2000, maxMessage: 'Le synopsis ne peut pas dépasser {{ limit }} caractères.')]
        public ?string $synopsis = null,

        /** @var list<int> */
        #[ExistingGenres]
        public array $genres = [],
    ) {
    }

    #[Assert\Callback]
    public function validateReleaseYearIsNotTooFarAhead(ExecutionContextInterface $context): void
    {
        $latestYear = (int) date('Y') + self::MAX_YEARS_AHEAD;

        if ($this->releaseYear <= $latestYear) {
            return;
        }

        $context->buildViolation("L'année de sortie ne peut pas dépasser {{ limit }}.")
            ->setParameter('{{ limit }}', (string) $latestYear)
            ->atPath('releaseYear')
            ->addViolation();
    }
}
