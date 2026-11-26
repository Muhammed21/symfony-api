<?php

namespace App\Security;

use App\Entity\Review;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\AccessDecisionManagerInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<self::EDIT|self::DELETE, Review>
 */
final class ReviewVoter extends Voter
{
    public const EDIT = 'REVIEW_EDIT';
    public const DELETE = 'REVIEW_DELETE';

    public function __construct(private readonly AccessDecisionManagerInterface $accessDecisionManager)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::EDIT, self::DELETE], true) && $subject instanceof Review;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        if ($subject->isWrittenBy($user)) {
            return true;
        }

        return self::DELETE === $attribute && $this->accessDecisionManager->decide($token, [User::ROLE_ADMIN]);
    }
}
