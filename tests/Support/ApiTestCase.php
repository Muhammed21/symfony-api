<?php

namespace App\Tests\Support;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApiTestCase extends WebTestCase
{
    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
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
            server: ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json'],
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
