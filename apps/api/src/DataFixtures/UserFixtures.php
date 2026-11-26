<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserFixtures extends Fixture implements FixtureGroupInterface
{
    public const PASSWORD = 'password';
    public const ADMIN = 'user-admin';
    public const REGULAR_USER_COUNT = 5;

    public function __construct(private readonly UserPasswordHasherInterface $passwordHasher)
    {
    }

    public static function getGroups(): array
    {
        return ['comptes'];
    }

    public static function regularUser(int $number): string
    {
        return 'user-'.$number;
    }

    /**
     * @return list<string>
     */
    public static function allUsers(): array
    {
        return [self::ADMIN, ...array_map(self::regularUser(...), range(1, self::REGULAR_USER_COUNT))];
    }

    public function load(ObjectManager $manager): void
    {
        $this->createUser($manager, self::ADMIN, 'admin@prime.local', [User::ROLE_ADMIN]);

        foreach (range(1, self::REGULAR_USER_COUNT) as $number) {
            $this->createUser($manager, self::regularUser($number), sprintf('user%d@prime.local', $number));
        }

        $manager->flush();
    }

    /**
     * @param list<string> $roles
     */
    private function createUser(ObjectManager $manager, string $reference, string $email, array $roles = []): void
    {
        $user = new User($email, $roles);
        $user->changePassword($this->passwordHasher->hashPassword($user, self::PASSWORD));

        $manager->persist($user);
        $this->addReference($reference, $user);
    }
}
