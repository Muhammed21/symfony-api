<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class GenreCrudTest extends ApiTestCase
{
    public function testCreatesGenre(): void
    {
        $genre = $this->requestJson('POST', '/genres', ['name' => 'Action']);

        self::assertResponseStatusCodeSame(201);
        self::assertIsInt($genre['id']);
        self::assertSame(['id' => $genre['id'], 'name' => 'Action'], $genre);
    }

    public function testRejectsNameAlreadyTakenIgnoringCase(): void
    {
        $this->createGenre('Action');

        $error = $this->requestJson('POST', '/genres', ['name' => 'action']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['name'], self::violatedPaths($error));
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidNameProvider(): iterable
    {
        yield 'blank' => [''];
        yield 'one character' => ['A'];
        yield 'over fifty characters' => [str_repeat('a', 51)];
    }

    #[DataProvider('invalidNameProvider')]
    public function testRejectsInvalidName(string $name): void
    {
        $error = $this->requestJson('POST', '/genres', ['name' => $name]);

        self::assertResponseStatusCodeSame(422);
        self::assertContains('name', self::violatedPaths($error));
    }

    public function testAcceptsNameLengthBoundaries(): void
    {
        $this->createGenre('SF');
        $this->createGenre(str_repeat('a', 50));
    }

    public function testListsGenresSortedByNameAndPaginated(): void
    {
        foreach (['Thriller', 'Action', 'Drame', 'Comédie', 'Horreur', 'Animation'] as $name) {
            $this->createGenre($name);
        }

        $body = $this->requestJson('GET', '/genres');

        self::assertResponseIsSuccessful();
        self::assertSame(['Action', 'Animation', 'Comédie', 'Drame', 'Horreur'], array_column($body['items'], 'name'));
        self::assertSame(6, $body['total']);
        self::assertSame(2, $body['lastPage']);
    }

    public function testListingRejectsInvalidPagination(): void
    {
        $this->requestJson('GET', '/genres?limit=0');

        self::assertResponseStatusCodeSame(422);
    }

    public function testShowsGenre(): void
    {
        $created = $this->createGenre('Action');

        self::assertSame($created, $this->requestJson('GET', '/genres/'.$created['id']));
    }

    public function testShowingUnknownGenreReturns404(): void
    {
        $this->requestJson('GET', '/genres/999999');

        self::assertResponseStatusCodeSame(404);
    }

    public function testRenamesGenre(): void
    {
        $created = $this->createGenre('Actoin');

        $genre = $this->requestJson('PUT', '/genres/'.$created['id'], ['name' => 'Action']);

        self::assertResponseIsSuccessful();
        self::assertSame(['id' => $created['id'], 'name' => 'Action'], $genre);
    }

    public function testRenamingToAnotherGenreNameReturns422(): void
    {
        $this->createGenre('Action');
        $drama = $this->createGenre('Drame');

        $error = $this->requestJson('PUT', '/genres/'.$drama['id'], ['name' => 'ACTION']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(['name'], self::violatedPaths($error));
    }

    public function testRenamingGenreByChangingOnlyItsCaseIsAllowed(): void
    {
        $created = $this->createGenre('science-fiction');

        $genre = $this->requestJson('PUT', '/genres/'.$created['id'], ['name' => 'Science-fiction']);

        self::assertResponseIsSuccessful();
        self::assertSame('Science-fiction', $genre['name']);
    }

    public function testRenamingUnknownGenreReturns404(): void
    {
        $this->requestJson('PUT', '/genres/999999', ['name' => 'Action']);

        self::assertResponseStatusCodeSame(404);
    }

    public function testDeletesGenre(): void
    {
        $created = $this->createGenre('Action');

        $this->requestJson('DELETE', '/genres/'.$created['id']);
        self::assertResponseStatusCodeSame(204);

        $this->requestJson('GET', '/genres/'.$created['id']);
        self::assertResponseStatusCodeSame(404);
    }

    public function testDeletingUnknownGenreReturns404(): void
    {
        $this->requestJson('DELETE', '/genres/999999');

        self::assertResponseStatusCodeSame(404);
    }

    public function testDeletingGenreUsedByMoviesKeepsTheMoviesWithoutIt(): void
    {
        $action = $this->createGenre('Action');
        $drama = $this->createGenre('Drame');
        $movie = $this->createMovie(['genres' => [$action['id'], $drama['id']]]);

        $this->requestJson('DELETE', '/genres/'.$action['id']);
        self::assertResponseStatusCodeSame(204);

        $reloaded = $this->requestJson('GET', '/movies/'.$movie['id']);
        self::assertResponseIsSuccessful();
        self::assertSame([$drama], $reloaded['genres']);
    }
}
