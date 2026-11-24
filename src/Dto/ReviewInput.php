<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ReviewInput
{
    public const MIN_RATING = 1;
    public const MAX_RATING = 5;

    public function __construct(
        #[Assert\Range(
            notInRangeMessage: 'La note doit être comprise entre {{ min }} et {{ max }}.',
            min: self::MIN_RATING,
            max: self::MAX_RATING,
        )]
        public int $rating,

        #[Assert\Length(max: 1000, maxMessage: 'Le commentaire ne peut pas dépasser {{ limit }} caractères.')]
        public ?string $comment = null,
    ) {
    }
}
