<?php

namespace App\Model;

final readonly class RatingSummary
{
    private function __construct(
        public ?float $averageRating,
        public int $reviewCount,
    ) {
    }

    public static function fromAggregate(string|float|null $average, int $count): self
    {
        return new self(
            null === $average ? null : round((float) $average, 1),
            $count,
        );
    }
}
