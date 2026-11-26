<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class GenreInput
{
    public function __construct(
        #[Assert\NotBlank(message: 'Le nom du genre est obligatoire.')]
        #[Assert\Length(
            min: 2,
            max: 50,
            minMessage: 'Le nom du genre doit contenir au moins {{ limit }} caractères.',
            maxMessage: 'Le nom du genre ne peut pas dépasser {{ limit }} caractères.',
        )]
        public string $name,
    ) {
    }
}
