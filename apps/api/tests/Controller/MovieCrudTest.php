<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class MovieCrudTest extends ApiTestCase
{
    public function testCreatesMovie(): void
    {
        $movie = $this->requestJson('POST', '/movies', self::aMovie());

        self::assertResponseStatusCodeSame(201);
        self::assertIsInt($movie['id']);
        self::assertSame('Le Parrain', $movie['title']);
        self::assertSame(1972, $movie['releaseYear']);
        self::assertSame(175, $movie['duration']);
        self::assertSame('16+', $movie['ageRating']);
    }

    public function testCreatesMovieWithoutSynopsis(): void
    {
        $payload = self::aMovie();
        unset($payload['synopsis']);

        $movie = $this->requestJson('POST', '/movies', $payload);

        self::assertResponseStatusCodeSame(201);
        self::assertNull($movie['synopsis']);
    }

    /**
     * @return iterable<string, array{array<string, mixed>, string}>
     */
    public static function invalidMovieProvider(): iterable
    {
        yield 'blank title' => [['title' => ''], 'title'];
        yield 'title too long' => [['title' => str_repeat('a', 256)], 'title'];
        yield 'synopsis too long' => [['synopsis' => str_repeat('a', 2001)], 'synopsis'];
        yield 'year before cinema' => [['releaseYear' => 1887], 'releaseYear'];
        yield 'year too far in future' => [['releaseYear' => (int) date('Y') + 6], 'releaseYear'];
        yield 'zero duration' => [['duration' => 0], 'duration'];
        yield 'unknown age rating' => [['ageRating' => '12+'], 'ageRating'];
    }

    /**
     * @param array<string, mixed> $overrides
     */
    #[DataProvider('invalidMovieProvider')]
    public function testRejectsInvalidMovie(array $overrides, string $field): void
    {
        $error = $this->requestJson('POST', '/movies', self::aMovie($overrides));

        self::assertResponseStatusCodeSame(422);
        self::assertContains($field, array_column($error['violations'], 'propertyPath'));
    }

    public function testRejectsMovieWithoutTitle(): void
    {
        $payload = self::aMovie();
        unset($payload['title']);

        $this->requestJson('POST', '/movies', $payload);

        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return iterable<string, array{array<string, mixed>, string, string}>
     */
    public static function wrongTypeProvider(): iterable
    {
        yield 'missing title' => [['title' => null], 'title', 'Cette valeur doit être de type string.'];
        yield 'unknown age rating' => [['ageRating' => '12+'], 'ageRating', "Cette valeur n'a pas le type attendu."];
    }

    /**
     * @param array<string, mixed> $overrides
     */
    #[DataProvider('wrongTypeProvider')]
    public function testExplainsTypeErrorsInFrench(array $overrides, string $field, string $message): void
    {
        $error = $this->requestJson('POST', '/movies', self::aMovie($overrides));

        $violation = array_values(array_filter($error['violations'], static fn (array $v): bool => $v['propertyPath'] === $field))[0];
        self::assertSame($message, $violation['title']);
    }

    public function testAcceptsBoundaryValues(): void
    {
        $this->requestJson('POST', '/movies', self::aMovie(['releaseYear' => 1888, 'duration' => 1, 'ageRating' => 'ALL']));
        self::assertResponseStatusCodeSame(201);

        $this->requestJson('POST', '/movies', self::aMovie(['releaseYear' => (int) date('Y') + 5]));
        self::assertResponseStatusCodeSame(201);
    }

    public function testShowsMovieWithSynopsis(): void
    {
        $created = $this->createMovie();

        $movie = $this->requestJson('GET', '/movies/'.$created['id']);

        self::assertResponseIsSuccessful();
        self::assertSame($created['id'], $movie['id']);
        self::assertSame(self::aMovie()['synopsis'], $movie['synopsis']);
    }

    public function testShowingUnknownMovieReturns404(): void
    {
        $this->requestJson('GET', '/movies/999999');

        self::assertResponseStatusCodeSame(404);
    }

    public function testReplacesMovie(): void
    {
        $created = $this->createMovie();
        $replacement = self::aMovie(['title' => 'Le Parrain 2', 'releaseYear' => 1974, 'duration' => 202, 'ageRating' => '18+', 'synopsis' => null]);

        $movie = $this->requestJson('PUT', '/movies/'.$created['id'], $replacement);

        self::assertResponseIsSuccessful();
        self::assertSame(['id' => $created['id'], ...$replacement, 'similarMovies' => [], 'averageRating' => null, 'reviewCount' => 0], $movie);
        self::assertSame($movie, $this->requestJson('GET', '/movies/'.$created['id']));
    }

    public function testReplacingWithMissingRequiredFieldReturns422(): void
    {
        $created = $this->createMovie();
        $payload = self::aMovie();
        unset($payload['duration']);

        $this->requestJson('PUT', '/movies/'.$created['id'], $payload);

        self::assertResponseStatusCodeSame(422);
    }

    public function testReplacingUnknownMovieReturns404(): void
    {
        $this->requestJson('PUT', '/movies/999999', self::aMovie());

        self::assertResponseStatusCodeSame(404);
    }

    public function testDeletesMovie(): void
    {
        $created = $this->createMovie();

        $this->requestJson('DELETE', '/movies/'.$created['id']);
        self::assertResponseStatusCodeSame(204);

        $this->requestJson('GET', '/movies/'.$created['id']);
        self::assertResponseStatusCodeSame(404);
    }

    public function testDeletingUnknownMovieReturns404(): void
    {
        $this->requestJson('DELETE', '/movies/999999');

        self::assertResponseStatusCodeSame(404);
    }
}
