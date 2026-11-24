<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RegistrationInput
{
    public const MIN_PASSWORD_LENGTH = 8;

    public function __construct(
        #[Assert\NotBlank(message: "L'e-mail est obligatoire.")]
        #[Assert\Email(message: "L'e-mail « {{ value }} » n'est pas valide.")]
        #[Assert\Length(max: 180, maxMessage: "L'e-mail ne peut pas dépasser {{ limit }} caractères.")]
        public string $email,

        #[Assert\Length(
            min: self::MIN_PASSWORD_LENGTH,
            minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.',
        )]
        public string $password,
    ) {
    }
}
