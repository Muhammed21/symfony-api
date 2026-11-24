<?php

namespace App\Validator;

use App\Repository\GenreRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

final class UniqueGenreNameValidator extends ConstraintValidator
{
    public function __construct(private readonly GenreRepository $genres)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof UniqueGenreName) {
            throw new UnexpectedTypeException($constraint, UniqueGenreName::class);
        }

        $existing = $this->genres->findOneByNameIgnoringCase((string) $value);

        if (null === $existing || $existing->getId() === $constraint->exceptGenreId) {
            return;
        }

        $this->context->buildViolation($constraint->message)
            ->setParameter('{{ name }}', $existing->getName())
            ->atPath('name')
            ->addViolation();
    }
}
