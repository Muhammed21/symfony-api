<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class MovieListTest extends ApiTestCase
{
    private function createTwelveMovies(): void
    {
        foreach (range(1, 12) as $number) {
            $this->createMovie(['title' => sprintf('Film %02d', $number)]);
        }
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return list<string>
     */
    private static function titles(array $body): array
    {
        return array_column($body['items'], 'title');
    }

    public function testReturnsFirstFiveMoviesSortedByTitleByDefault(): void
    {
        $this->createTwelveMovies();

        $body = $this->requestJson('GET', '/movies');

        self::assertResponseIsSuccessful();
        self::assertSame(['Film 01', 'Film 02', 'Film 03', 'Film 04', 'Film 05'], self::titles($body));
        self::assertSame(12, $body['total']);
        self::assertSame(3, $body['lastPage']);
    }

    public function testReturnsRequestedPageWithRequestedLimit(): void
    {
        $this->createTwelveMovies();

        $body = $this->requestJson('GET', '/movies?page=2&limit=3');

        self::assertSame(['Film 04', 'Film 05', 'Film 06'], self::titles($body));
        self::assertSame(12, $body['total']);
        self::assertSame(4, $body['lastPage']);
    }

    public function testUsesDefaultLimitWhenOnlyPageIsGiven(): void
    {
        $this->createTwelveMovies();

        $body = $this->requestJson('GET', '/movies?page=2');

        self::assertSame(['Film 06', 'Film 07', 'Film 08', 'Film 09', 'Film 10'], self::titles($body));
    }

    public function testPageBeyondLastReturnsNoMovies(): void
    {
        $this->createTwelveMovies();

        $body = $this->requestJson('GET', '/movies?page=10');

        self::assertResponseIsSuccessful();
        self::assertSame([], $body['items']);
        self::assertSame(12, $body['total']);
    }

    public function testListDoesNotExposeSynopsis(): void
    {
        $this->createMovie();

        $body = $this->requestJson('GET', '/movies');

        self::assertSame(['id', 'title', 'releaseYear', 'duration', 'ageRating', 'genres'], array_keys($body['items'][0]));
    }

    public function testFiltersByPartOfTitleIgnoringCase(): void
    {
        $this->createMovie(['title' => 'Le Parrain']);
        $this->createMovie(['title' => 'Le Parrain 2']);
        $this->createMovie(['title' => 'Inception']);

        $body = $this->requestJson('GET', '/movies?title=PARR');

        self::assertSame(['Le Parrain', 'Le Parrain 2'], self::titles($body));
        self::assertSame(2, $body['total']);
    }

    public function testFiltersByExactYear(): void
    {
        $this->createMovie(['title' => 'Le Parrain', 'releaseYear' => 1972]);
        $this->createMovie(['title' => 'Le Parrain 2', 'releaseYear' => 1974]);

        $body = $this->requestJson('GET', '/movies?year=1974');

        self::assertSame(['Le Parrain 2'], self::titles($body));
    }

    public function testCombinesFilters(): void
    {
        $this->createMovie(['title' => 'Le Parrain', 'releaseYear' => 1972]);
        $this->createMovie(['title' => 'Le Parrain 2', 'releaseYear' => 1974]);
        $this->createMovie(['title' => 'Chinatown', 'releaseYear' => 1974]);

        $body = $this->requestJson('GET', '/movies?title=parrain&year=1974');

        self::assertSame(['Le Parrain 2'], self::titles($body));
    }

    public function testIgnoresEmptyFilters(): void
    {
        $this->createMovie(['title' => 'Le Parrain']);
        $this->createMovie(['title' => 'Inception']);

        $body = $this->requestJson('GET', '/movies?title=&year=');

        self::assertResponseIsSuccessful();
        self::assertSame(['Inception', 'Le Parrain'], self::titles($body));
    }

    public function testFilterMatchingNothingReturnsEmptyList(): void
    {
        $this->createMovie();

        $body = $this->requestJson('GET', '/movies?title=inexistant');

        self::assertResponseIsSuccessful();
        self::assertSame([], $body['items']);
        self::assertSame(0, $body['total']);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidQueryProvider(): iterable
    {
        yield 'page zero' => ['/movies?page=0'];
        yield 'limit zero' => ['/movies?limit=0'];
        yield 'limit above maximum' => ['/movies?limit=101'];
        yield 'year not a number' => ['/movies?year=abc'];
    }

    #[DataProvider('invalidQueryProvider')]
    public function testRejectsInvalidQuery(string $uri): void
    {
        $this->requestJson('GET', $uri);

        self::assertResponseStatusCodeSame(422);
    }
}
