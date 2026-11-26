<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class MovieSorting
{
    public const BY_TITLE = 'title';
    public const MOST_RECENT = 'recent';

    public function __construct(
        #[Assert\Choice(
            choices: [self::BY_TITLE, self::MOST_RECENT],
            message: 'Le tri doit valoir « title » ou « recent ».',
        )]
        public string $sort = self::BY_TITLE,
    ) {
    }
}
