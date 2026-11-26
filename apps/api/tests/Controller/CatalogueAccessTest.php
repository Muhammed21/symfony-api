<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class CatalogueAccessTest extends ApiTestCase
{
    /**
     * @return array{movie: int, genre: int}
     */
    private function createCatalogue(): array
    {
        $genre = $this->createGenre('Action');
        $movie = $this->createMovie(['genres' => [$genre['id']]]);

        return ['movie' => $movie['id'], 'genre' => $genre['id']];
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function readRouteProvider(): iterable
    {
        yield 'movie list' => ['GET', '/movies'];
        yield 'movie detail' => ['GET', '/movies/{movie}'];
        yield 'genre list' => ['GET', '/genres'];
        yield 'genre detail' => ['GET', '/genres/{genre}'];
    }

    #[DataProvider('readRouteProvider')]
    public function testAnyoneCanReadTheCatalogue(string $method, string $uri): void
    {
        $ids = $this->createCatalogue();
        $this->actAsAnonymous();

        $this->requestJson($method, self::resolve($uri, $ids));

        self::assertResponseIsSuccessful();
    }

    /**
     * @return iterable<string, array{string, string, array<string, mixed>|null}>
     */
    public static function writeRouteProvider(): iterable
    {
        $movie = ['title' => 'Heat', 'releaseYear' => 1995, 'duration' => 170, 'ageRating' => '16+'];

        yield 'create movie' => ['POST', '/movies', $movie];
        yield 'replace movie' => ['PUT', '/movies/{movie}', $movie];
        yield 'delete movie' => ['DELETE', '/movies/{movie}', null];
        yield 'create genre' => ['POST', '/genres', ['name' => 'Drame']];
        yield 'rename genre' => ['PUT', '/genres/{genre}', ['name' => 'Drame']];
        yield 'delete genre' => ['DELETE', '/genres/{genre}', null];
    }

    /**
     * @param array<string, mixed>|null $payload
     */
    #[DataProvider('writeRouteProvider')]
    public function testWritingTheCatalogueRequiresAuthentication(string $method, string $uri, ?array $payload): void
    {
        $ids = $this->createCatalogue();
        $this->actAsAnonymous();

        $this->requestJson($method, self::resolve($uri, $ids), $payload);

        self::assertResponseStatusCodeSame(401);
    }

    /**
     * @param array<string, mixed>|null $payload
     */
    #[DataProvider('writeRouteProvider')]
    public function testRegularUserCannotWriteTheCatalogue(string $method, string $uri, ?array $payload): void
    {
        $ids = $this->createCatalogue();
        $this->actAsRegularUser();

        $this->requestJson($method, self::resolve($uri, $ids), $payload);

        self::assertResponseStatusCodeSame(403);
    }

    /**
     * @param array<string, mixed>|null $payload
     */
    #[DataProvider('writeRouteProvider')]
    public function testAdministratorCanWriteTheCatalogue(string $method, string $uri, ?array $payload): void
    {
        $ids = $this->createCatalogue();

        $this->requestJson($method, self::resolve($uri, $ids), $payload);

        self::assertResponseIsSuccessful();
    }

    /**
     * @param array{movie: int, genre: int} $ids
     */
    private static function resolve(string $uri, array $ids): string
    {
        return strtr($uri, ['{movie}' => (string) $ids['movie'], '{genre}' => (string) $ids['genre']]);
    }
}
