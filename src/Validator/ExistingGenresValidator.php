<?php

namespace App\Validator;

use App\Entity\Genre;
use App\Repository\GenreRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

final class ExistingGenresValidator extends ConstraintValidator
{
    public function __construct(private readonly GenreRepository $genres)
    {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ExistingGenres) {
            throw new UnexpectedTypeException($constraint, ExistingGenres::class);
        }

        if (!is_array($value) || [] === $value) {
            return;
        }

        $foundIds = array_map(static fn (Genre $genre): ?int => $genre->getId(), $this->genres->findByIds($value));
        $missingIds = array_values(array_diff(array_unique($value), $foundIds));

        if ([] === $missingIds) {
            return;
        }

        $this->context->buildViolation($constraint->message)
            ->setParameter('{{ ids }}', implode(', ', $missingIds))
            ->addViolation();
    }
}
