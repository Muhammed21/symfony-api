<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class MovieSimilarityTest extends ApiTestCase
{
    /**
     * @return list<array{id: int, title: string, posterUrl: ?string, backdropUrl: ?string}>
     */
    private function similarMoviesOf(int $movieId): array
    {
        return $this->requestJson('GET', '/movies/'.$movieId)['similarMovies'];
    }

    /**
     * @param array<string, mixed> $movie
     *
     * @return array{id: int, title: string, posterUrl: ?string, backdropUrl: ?string}
     */
    private static function reference(array $movie): array
    {
        return ['id' => $movie['id'], 'title' => $movie['title'], 'posterUrl' => $movie['posterUrl'], 'backdropUrl' => $movie['backdropUrl']];
    }

    public function testSimilarTitlesCarryTheirImages(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $goodfellas = $this->createMovie([
            'title' => 'Les Affranchis',
            'posterUrl' => 'https://images.exemple.fr/affiche.jpg',
            'backdropUrl' => 'https://images.exemple.fr/banniere.jpg',
        ]);

        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));

        self::assertSame([[
            'id' => $goodfellas['id'],
            'title' => 'Les Affranchis',
            'posterUrl' => 'https://images.exemple.fr/affiche.jpg',
            'backdropUrl' => 'https://images.exemple.fr/banniere.jpg',
        ]], $this->similarMoviesOf($godfather['id']));
    }

    public function testLinkingTwoMoviesMakesEachSimilarToTheOther(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $goodfellas = $this->createMovie(['title' => 'Les Affranchis']);

        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));

        self::assertResponseStatusCodeSame(204);
        self::assertSame([self::reference($goodfellas)], $this->similarMoviesOf($godfather['id']));
        self::assertSame([self::reference($godfather)], $this->similarMoviesOf($goodfellas['id']));
    }

    public function testLinkingAgainInEitherDirectionCreatesNoDuplicate(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $goodfellas = $this->createMovie(['title' => 'Les Affranchis']);
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));

        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));
        self::assertResponseStatusCodeSame(204);
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $goodfellas['id'], $godfather['id']));
        self::assertResponseStatusCodeSame(204);

        self::assertSame([self::reference($goodfellas)], $this->similarMoviesOf($godfather['id']));
        self::assertSame([self::reference($godfather)], $this->similarMoviesOf($goodfellas['id']));
    }

    public function testUnlinkingFromEitherSideUnlinksBothSides(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $goodfellas = $this->createMovie(['title' => 'Les Affranchis']);
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));

        $this->requestJson('DELETE', sprintf('/movies/%d/similar/%d', $goodfellas['id'], $godfather['id']));

        self::assertResponseStatusCodeSame(204);
        self::assertSame([], $this->similarMoviesOf($godfather['id']));
        self::assertSame([], $this->similarMoviesOf($goodfellas['id']));
    }

    public function testUnlinkingMoviesThatAreNotLinkedSucceeds(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $heat = $this->createMovie(['title' => 'Heat']);

        $this->requestJson('DELETE', sprintf('/movies/%d/similar/%d', $godfather['id'], $heat['id']));

        self::assertResponseStatusCodeSame(204);
    }

    public function testMovieCannotBeSimilarToItself(): void
    {
        $godfather = $this->createMovie();

        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $godfather['id']));

        self::assertResponseStatusCodeSame(422);
        self::assertSame([], $this->similarMoviesOf($godfather['id']));
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function unknownMovieProvider(): iterable
    {
        yield 'link to unknown movie' => ['PUT /movies/{movie}/similar/999999'];
        yield 'link from unknown movie' => ['PUT /movies/999999/similar/{movie}'];
        yield 'unlink unknown movie' => ['DELETE /movies/{movie}/similar/999999'];
    }

    #[DataProvider('unknownMovieProvider')]
    public function testUnknownMovieReturns404(string $request): void
    {
        $movie = $this->createMovie();
        [$method, $uri] = explode(' ', str_replace('{movie}', (string) $movie['id'], $request));

        $this->requestJson($method, $uri);

        self::assertResponseStatusCodeSame(404);
    }

    /**
     * @return iterable<string, array{string, string, int}>
     */
    public static function forbiddenProvider(): iterable
    {
        yield 'anonymous links' => ['PUT', 'anonymous', 401];
        yield 'anonymous unlinks' => ['DELETE', 'anonymous', 401];
        yield 'regular user links' => ['PUT', 'user', 403];
        yield 'regular user unlinks' => ['DELETE', 'user', 403];
    }

    #[DataProvider('forbiddenProvider')]
    public function testOnlyAdministratorsManageSimilarMovies(string $method, string $who, int $expectedStatus): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $goodfellas = $this->createMovie(['title' => 'Les Affranchis']);
        'anonymous' === $who ? $this->actAsAnonymous() : $this->actAsRegularUser();

        $this->requestJson($method, sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));

        self::assertResponseStatusCodeSame($expectedStatus);
    }

    public function testDeletingMovieRemovesItFromOtherMoviesSimilarTitles(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $goodfellas = $this->createMovie(['title' => 'Les Affranchis']);
        $heat = $this->createMovie(['title' => 'Heat']);
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $goodfellas['id']));
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $heat['id'], $goodfellas['id']));

        $this->requestJson('DELETE', '/movies/'.$goodfellas['id']);
        self::assertResponseStatusCodeSame(204);

        self::assertSame([], $this->similarMoviesOf($godfather['id']));
        self::assertSame([], $this->similarMoviesOf($heat['id']));
    }

    public function testSimilarMoviesAreSortedByTitle(): void
    {
        $godfather = $this->createMovie(['title' => 'Le Parrain']);
        $zodiac = $this->createMovie(['title' => 'Zodiac']);
        $heat = $this->createMovie(['title' => 'Heat']);
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $zodiac['id']));
        $this->requestJson('PUT', sprintf('/movies/%d/similar/%d', $godfather['id'], $heat['id']));

        self::assertSame([self::reference($heat), self::reference($zodiac)], $this->similarMoviesOf($godfather['id']));
    }

    public function testMovieWithoutSimilarTitlesHasEmptyList(): void
    {
        $movie = $this->createMovie();

        self::assertSame([], $this->similarMoviesOf($movie['id']));
    }

    public function testMovieListDoesNotShowSimilarTitles(): void
    {
        $this->createMovie();

        $body = $this->requestJson('GET', '/movies');

        self::assertArrayNotHasKey('similarMovies', $body['items'][0]);
    }
}
