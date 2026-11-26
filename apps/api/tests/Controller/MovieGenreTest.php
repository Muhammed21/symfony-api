<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class MovieGenreTest extends ApiTestCase
{
    public function testCreatesMovieWithGenresSortedByName(): void
    {
        $thriller = $this->createGenre('Thriller');
        $drama = $this->createGenre('Drame');

        $movie = $this->requestJson('POST', '/movies', self::aMovie(['genres' => [$thriller['id'], $drama['id']]]));

        self::assertResponseStatusCodeSame(201);
        self::assertSame([$drama, $thriller], $movie['genres']);
        self::assertSame([$drama, $thriller], $this->requestJson('GET', '/movies/'.$movie['id'])['genres']);
    }

    public function testMovieWithoutGenresHasEmptyList(): void
    {
        $payload = self::aMovie();
        unset($payload['genres']);

        $movie = $this->requestJson('POST', '/movies', $payload);

        self::assertResponseStatusCodeSame(201);
        self::assertSame([], $movie['genres']);
    }

    public function testReplacingMovieReplacesItsGenres(): void
    {
        $action = $this->createGenre('Action');
        $drama = $this->createGenre('Drame');
        $thriller = $this->createGenre('Thriller');
        $created = $this->createMovie(['genres' => [$action['id'], $drama['id']]]);

        $movie = $this->requestJson('PUT', '/movies/'.$created['id'], self::aMovie(['genres' => [$thriller['id']]]));

        self::assertResponseIsSuccessful();
        self::assertSame([$thriller], $movie['genres']);
        self::assertSame([$thriller], $this->requestJson('GET', '/movies/'.$created['id'])['genres']);
    }

    public function testRejectsUnknownGenreAndNamesIt(): void
    {
        $action = $this->createGenre('Action');

        $error = $this->requestJson('POST', '/movies', self::aMovie(['genres' => [$action['id'], 999999]]));

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['genres'], self::violatedPaths($error));
        self::assertStringContainsString('999999', $error['violations'][0]['title']);
    }

    public function testIgnoresDuplicateGenres(): void
    {
        $action = $this->createGenre('Action');

        $movie = $this->requestJson('POST', '/movies', self::aMovie(['genres' => [$action['id'], $action['id']]]));

        self::assertResponseStatusCodeSame(201);
        self::assertSame([$action], $movie['genres']);
    }

    public function testListShowsGenresOfEachMovie(): void
    {
        $action = $this->createGenre('Action');
        $this->createMovie(['genres' => [$action['id']]]);

        $body = $this->requestJson('GET', '/movies');

        self::assertSame([$action], $body['items'][0]['genres']);
    }

    public function testFiltersMoviesByGenre(): void
    {
        $action = $this->createGenre('Action');
        $drama = $this->createGenre('Drame');
        $this->createMovie(['title' => 'Heat', 'genres' => [$action['id'], $drama['id']]]);
        $this->createMovie(['title' => 'Die Hard', 'genres' => [$action['id']]]);
        $this->createMovie(['title' => 'Le Parrain', 'genres' => [$drama['id']]]);

        $body = $this->requestJson('GET', '/movies?genre='.$action['id']);

        self::assertSame(['Die Hard', 'Heat'], array_column($body['items'], 'title'));
        self::assertSame(2, $body['total']);
    }

    public function testFilteringByGenreKeepsAllGenresOfMatchingMovies(): void
    {
        $action = $this->createGenre('Action');
        $drama = $this->createGenre('Drame');
        $this->createMovie(['title' => 'Heat', 'genres' => [$action['id'], $drama['id']]]);

        $body = $this->requestJson('GET', '/movies?genre='.$action['id']);

        self::assertSame([$action, $drama], $body['items'][0]['genres']);
    }

    public function testCombinesGenreAndYearFilters(): void
    {
        $action = $this->createGenre('Action');
        $this->createMovie(['title' => 'Heat', 'releaseYear' => 1995, 'genres' => [$action['id']]]);
        $this->createMovie(['title' => 'Die Hard', 'releaseYear' => 1988, 'genres' => [$action['id']]]);

        $body = $this->requestJson('GET', '/movies?genre='.$action['id'].'&year=1995');

        self::assertSame(['Heat'], array_column($body['items'], 'title'));
    }

    public function testFilteringByUnknownGenreReturnsEmptyList(): void
    {
        $this->createMovie();

        $body = $this->requestJson('GET', '/movies?genre=999999');

        self::assertResponseIsSuccessful();
        self::assertSame([], $body['items']);
        self::assertSame(0, $body['total']);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidGenreFilterProvider(): iterable
    {
        yield 'zero' => ['0'];
        yield 'not a number' => ['abc'];
    }

    #[DataProvider('invalidGenreFilterProvider')]
    public function testRejectsInvalidGenreFilter(string $genre): void
    {
        $this->requestJson('GET', '/movies?genre='.$genre);

        self::assertResponseStatusCodeSame(422);
    }

    public function testPaginationCountsMoviesNotGenreLinks(): void
    {
        $genreIds = array_map(fn (string $name): int => $this->createGenre($name)['id'], ['Action', 'Drame', 'Thriller']);
        foreach (range(1, 6) as $number) {
            $this->createMovie(['title' => sprintf('Film %02d', $number), 'genres' => $genreIds]);
        }

        $body = $this->requestJson('GET', '/movies');

        self::assertCount(5, $body['items']);
        self::assertSame(6, $body['total']);
        self::assertSame(2, $body['lastPage']);
        self::assertCount(3, $body['items'][0]['genres']);
    }
}
