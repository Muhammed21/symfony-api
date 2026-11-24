<?php

namespace App\Enum;

enum AgeRating: string
{
    case All = 'ALL';
    case SevenPlus = '7+';
    case ThirteenPlus = '13+';
    case SixteenPlus = '16+';
    case EighteenPlus = '18+';
}
