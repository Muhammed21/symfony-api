<?php

namespace App\Controller;

use App\Dto\RegistrationInput;
use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class AccountController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    #[Route('/register', name: 'account_register', methods: ['POST'])]
    public function register(#[MapRequestPayload] RegistrationInput $input): JsonResponse
    {
        if ($this->users->emailIsTaken($input->email)) {
            throw new ConflictHttpException('Un compte existe déjà avec cet e-mail.');
        }

        $user = new User($input->email);
        $user->changePassword($this->passwordHasher->hashPassword($user, $input->password));
        $this->users->save($user);

        return $this->json($user, Response::HTTP_CREATED, context: ['groups' => ['user:read']]);
    }

    #[Route('/api/login', name: 'account_login', methods: ['POST'])]
    public function login(): never
    {
        throw new \LogicException('Cette route est interceptée par le pare-feu json_login.');
    }

    #[Route('/me', name: 'account_me', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED')]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json($user, context: ['groups' => ['user:read']]);
    }
}
