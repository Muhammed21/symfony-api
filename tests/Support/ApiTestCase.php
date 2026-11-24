<?php

namespace App\Tests\Support;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApiTestCase extends WebTestCase
{
    protected const PASSWORD = 'password';

    protected KernelBrowser $client;

    private ?string $token = null;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->actAs($this->createUser('admin@prime.local', ['ROLE_ADMIN']));
    }

    /**
     * @param list<string> $roles
     */
    protected function createUser(string $email, array $roles = []): User
    {
        $container = static::getContainer();
        $user = new User($email, $roles);
        $user->changePassword($container->get(UserPasswordHasherInterface::class)->hashPassword($user, self::PASSWORD));

        $entityManager = $container->get(EntityManagerInterface::class);
        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }

    protected function actAs(User $user): void
    {
        $this->token = static::getContainer()->get(JWTTokenManagerInterface::class)->create($user);
    }

    protected function actAsRegularUser(): void
    {
        $this->actAs($this->createUser('user@prime.local'));
    }

    protected function actAsAnonymous(): void
    {
        $this->token = null;
    }

    protected function useToken(string $token): void
    {
        $this->token = $token;
    }

    /**
     * @param array<string, mixed>|null $payload
     *
     * @return array<string, mixed>|null
     */
    protected function requestJson(string $method, string $uri, ?array $payload = null): ?array
    {
        $this->client->request(
            $method,
            $uri,
            server: [
                'HTTP_ACCEPT' => 'application/json',
                'CONTENT_TYPE' => 'application/json',
                ...(null === $this->token ? [] : ['HTTP_AUTHORIZATION' => 'Bearer '.$this->token]),
            ],
            content: null === $payload ? null : json_encode($payload, JSON_THROW_ON_ERROR),
        );

        $content = (string) $this->client->getResponse()->getContent();

        return '' === $content ? null : json_decode($content, true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    protected static function aMovie(array $overrides = []): array
    {
        return [
            'title' => 'Le Parrain',
            'synopsis' => 'Le patriarche vieillissant d\'une dynastie mafieuse transmet le contrôle à son fils.',
            'releaseYear' => 1972,
            'duration' => 175,
            'ageRating' => '16+',
            'genres' => [],
            ...$overrides,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function createGenre(string $name): array
    {
        $genre = $this->requestJson('POST', '/genres', ['name' => $name]);
        self::assertResponseStatusCodeSame(201);

        return $genre ?? [];
    }

    /**
     * @param array<string, mixed> $error
     *
     * @return list<string>
     */
    protected static function violatedPaths(array $error): array
    {
        return array_column($error['violations'] ?? [], 'propertyPath');
    }

    /**
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    protected function createMovie(array $overrides = []): array
    {
        $movie = $this->requestJson('POST', '/movies', self::aMovie($overrides));
        self::assertResponseStatusCodeSame(201);

        return $movie ?? [];
    }
}
