<?php

namespace App\Model;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class PaginationDTO
{
    public const DEFAULT_LIMIT = 5;
    public const MAX_LIMIT = 100;

    public function __construct(
        #[Assert\Positive(message: 'La page doit être supérieure à 0.')]
        public int $page = 1,

        #[Assert\Range(
            notInRangeMessage: 'La limite doit être comprise entre {{ min }} et {{ max }}.',
            min: 1,
            max: self::MAX_LIMIT,
        )]
        public int $limit = self::DEFAULT_LIMIT,
    ) {
    }
}
