<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY)]
final class ExistingGenres extends Constraint
{
    public string $message = "Ces genres n'existent pas : {{ ids }}.";
}
