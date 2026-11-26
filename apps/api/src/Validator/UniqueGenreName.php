<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

final class UniqueGenreName extends Constraint
{
    public string $message = 'Le genre « {{ name }} » existe déjà.';

    public function __construct(
        public readonly ?int $exceptGenreId = null,
        ?array $groups = null,
        mixed $payload = null,
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
