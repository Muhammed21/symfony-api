<?php

namespace App\Tests\Command;

use App\Tmdb\TmdbCatalogue;
use App\Tests\Support\ApiTestCase;
use App\Tests\Support\FakeTmdb;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;

final class TmdbImportTest extends ApiTestCase
{
    private const GENRES = [['id' => 18, 'name' => 'Drame'], ['id' => 878, 'name' => 'Science-Fiction']];

    private function import(FakeTmdb $tmdb, array $options = [], string $apiKey = 'cle-de-test'): CommandTester
    {
        if (!static::getContainer()->initialized(TmdbCatalogue::class)) {
            static::getContainer()->set(TmdbCatalogue::class, new TmdbCatalogue($tmdb->client(), $apiKey));
        }
        $tester = new CommandTester((new Application(self::$kernel))->find('app:tmdb:import'));
        $tester->execute($options);

        return $tester;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function moviesByTitle(): array
    {
        $movies = $this->requestJson('GET', '/movies?limit=100')['items'];

        return array_column($movies, null, 'title');
    }

    /**
     * @return array<string, mixed>
     */
    private function movieTitled(string $title): array
    {
        return $this->requestJson('GET', '/movies/'.$this->moviesByTitle()[$title]['id']);
    }

    public function testImporteLesFilmsDeLaPremierePageEnFrancais(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550, [
            'title' => 'Fight Club',
            'overview' => 'Le narrateur, sans identité précise, vit seul.',
            'release_date' => '1999-10-15',
            'runtime' => 139,
            'genres' => [['id' => 18, 'name' => 'Drame'], ['id' => 878, 'name' => 'Science-Fiction']],
            'poster_path' => '/t1i10ptOivG4hV7erkX3tmKpiqm.jpg',
            'backdrop_path' => '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        ])]);

        $tester = $this->import($tmdb);

        self::assertSame(0, $tester->getStatusCode());
        self::assertSame([
            'title' => 'Fight Club',
            'synopsis' => 'Le narrateur, sans identité précise, vit seul.',
            'releaseYear' => 1999,
            'duration' => 139,
            'ageRating' => 'ALL',
            'posterUrl' => 'https://image.tmdb.org/t/p/w500/t1i10ptOivG4hV7erkX3tmKpiqm.jpg',
            'backdropUrl' => 'https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
            'genres' => ['Drame', 'Science-Fiction'],
        ], array_intersect_key(
            [...$this->movieTitled('Fight Club'), 'genres' => array_column($this->movieTitled('Fight Club')['genres'], 'name')],
            array_flip(['title', 'synopsis', 'releaseYear', 'duration', 'ageRating', 'posterUrl', 'backdropUrl', 'genres']),
        ));
        self::assertStringContainsString('1 film créé, 0 mis à jour, 0 ignoré.', $tester->getDisplay());
    }

    public function testDemandeLesFilmsPopulairesConnusEnFrancaisAvecLaCle(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550)]);

        $this->import($tmdb);

        self::assertSame(['/genre/movie/list', '/discover/movie', '/movie/550'], $tmdb->paths());
        self::assertSame(
            ['api_key' => 'cle-de-test', 'language' => 'fr-FR'],
            array_intersect_key($tmdb->requests[0]['query'], array_flip(['api_key', 'language'])),
        );
        self::assertSame(
            ['api_key' => 'cle-de-test', 'language' => 'fr-FR', 'sort_by' => 'popularity.desc', 'vote_count_gte' => '100', 'page' => '1'],
            $tmdb->requests[1]['query'],
        );
        self::assertSame(
            ['api_key' => 'cle-de-test', 'language' => 'fr-FR', 'append_to_response' => 'release_dates,recommendations'],
            $tmdb->requests[2]['query'],
        );
    }

    public function testImporteLeNombreDePagesDemande(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [1, 2], 2 => [3, 4]], [
            1 => FakeTmdb::movie(1),
            2 => FakeTmdb::movie(2),
            3 => FakeTmdb::movie(3),
            4 => FakeTmdb::movie(4, ['runtime' => null]),
        ]);

        $tester = $this->import($tmdb, ['--pages' => '2']);

        self::assertSame(['Film 1', 'Film 2', 'Film 3'], array_keys($this->moviesByTitle()));
        self::assertStringContainsString('3 films créés, 0 mis à jour, 1 ignoré.', $tester->getDisplay());
    }

    public function testNImporteQuUneFoisUnFilmPresentSurDeuxPages(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [1], 2 => [1]], [1 => FakeTmdb::movie(1)]);

        $tester = $this->import($tmdb, ['--pages' => '2']);

        self::assertSame(['Film 1'], array_keys($this->moviesByTitle()));
        self::assertSame(1, count(array_keys($tmdb->paths(), '/movie/1', true)));
        self::assertStringContainsString('1 film créé, 0 mis à jour, 0 ignoré.', $tester->getDisplay());
    }

    public function testUnSecondImportMetAJourSansDoublon(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550, ['title' => 'Fight Club'])]);
        $this->import($tmdb);
        $tmdb->replaceMovie(550, FakeTmdb::movie(550, ['title' => 'Fight Club (version restaurée)', 'runtime' => 140]));

        $tester = $this->import($tmdb);

        self::assertSame(['Fight Club (version restaurée)'], array_keys($this->moviesByTitle()));
        self::assertSame(140, $this->movieTitled('Fight Club (version restaurée)')['duration']);
        self::assertStringContainsString('0 film créé, 1 mis à jour, 0 ignoré.', $tester->getDisplay());
        self::assertSame(
            ['Drame', 'Science-Fiction'],
            array_column($this->requestJson('GET', '/genres?limit=100')['items'], 'name'),
        );
    }

    public function testRedonneSonNomTmdbAUnGenreRenommeEntreDeuxImports(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550)]);
        $this->import($tmdb);
        $drama = array_column($this->requestJson('GET', '/genres?limit=100')['items'], null, 'name')['Drame'];
        $this->requestJson('PUT', '/genres/'.$drama['id'], ['name' => 'Drames']);

        $this->import($tmdb);

        self::assertSame(['Drame', 'Science-Fiction'], array_column($this->requestJson('GET', '/genres?limit=100')['items'], 'name'));
    }

    public function testReprendUnGenreDejaPresentDuMemeNomQuelleQueSoitLaCasse(): void
    {
        $this->requestJson('POST', '/genres', ['name' => 'Drame']);
        $this->requestJson('POST', '/genres', ['name' => 'science-fiction']);

        $this->import(new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550)]));

        self::assertSame(['Drame', 'Science-Fiction'], array_column($this->requestJson('GET', '/genres?limit=100')['items'], 'name'));
    }

    public function testIgnoreUnFilmSansDateOuSansDureeEtDitPourquoi(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [1, 2, 3]], [
            1 => FakeTmdb::movie(1, ['title' => 'Sans date', 'release_date' => '']),
            2 => FakeTmdb::movie(2, ['title' => 'Sans durée', 'runtime' => 0]),
            3 => FakeTmdb::movie(3, ['title' => 'Complet']),
        ]);

        $tester = $this->import($tmdb);

        self::assertSame(['Complet'], array_keys($this->moviesByTitle()));
        self::assertStringContainsString('1 film créé, 0 mis à jour, 2 ignorés.', $tester->getDisplay());
        self::assertStringContainsString('Sans date : pas de date de sortie', $tester->getDisplay());
        self::assertStringContainsString('Sans durée : pas de durée', $tester->getDisplay());
    }

    public function testGardeUnSynopsisAbsentCommeVideEtUneImageAbsenteCommeAbsente(): void
    {
        $this->import(new FakeTmdb(self::GENRES, [1 => [7]], [7 => FakeTmdb::movie(7, [
            'title' => 'Inconnu',
            'overview' => '',
            'poster_path' => null,
            'backdrop_path' => null,
        ])]));

        $movie = $this->movieTitled('Inconnu');
        self::assertNull($movie['synopsis']);
        self::assertNull($movie['posterUrl']);
        self::assertNull($movie['backdropUrl']);
    }

    /**
     * @return iterable<string, array{list<string>, string}>
     */
    public static function certifications(): iterable
    {
        yield 'tous publics' => [['3:U'], 'ALL'];
        yield 'moins de 10 ans' => [['3:10'], '7+'];
        yield 'moins de 12 ans' => [['3:12'], '13+'];
        yield 'moins de 16 ans' => [['3:16'], '16+'];
        yield 'moins de 18 ans' => [['3:18'], '18+'];
        yield 'la sortie en salle prime' => [['4:18', '3:12'], '13+'];
        yield 'sinon la première certification connue' => [['2:', '4:16'], '16+'];
        yield 'sans certification française' => [[], 'ALL'];
    }

    /**
     * @param list<string> $certifications
     */
    #[DataProvider('certifications')]
    public function testDeduitLaLimiteDAgeDeLaCertificationFrancaise(array $certifications, string $ageRating): void
    {
        $this->import(new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550, [
            'release_dates' => [] === $certifications ? ['results' => [['iso_3166_1' => 'DE', 'release_dates' => [['certification' => '16', 'type' => 3]]]]] : FakeTmdb::frenchCertifications(...$certifications),
        ])]));

        self::assertSame($ageRating, $this->movieTitled('Film 550')['ageRating']);
    }

    public function testRelieLesFilmsRecommandesDejaImportes(): void
    {
        $recommending = static fn (int ...$ids): array => ['results' => array_map(static fn (int $id): array => ['id' => $id], $ids)];
        $this->import(new FakeTmdb(self::GENRES, [1 => [1, 2, 3]], [
            1 => FakeTmdb::movie(1, ['recommendations' => $recommending(2, 999)]),
            2 => FakeTmdb::movie(2),
            3 => FakeTmdb::movie(3),
        ]));

        self::assertSame(['Film 2'], array_column($this->movieTitled('Film 1')['similarMovies'], 'title'));
        self::assertSame(['Film 1'], array_column($this->movieTitled('Film 2')['similarMovies'], 'title'));
        self::assertSame([], $this->movieTitled('Film 3')['similarMovies']);
    }

    public function testNeRendPasUnFilmSimilaireALuiMeme(): void
    {
        $this->import(new FakeTmdb(self::GENRES, [1 => [1]], [
            1 => FakeTmdb::movie(1, ['recommendations' => ['results' => [['id' => 1]]]]),
        ]));

        self::assertSame([], $this->movieTitled('Film 1')['similarMovies']);
    }

    public function testSansCleSArreteAvantToutAppel(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550)]);

        $tester = $this->import($tmdb, [], '');

        self::assertSame(1, $tester->getStatusCode());
        self::assertStringContainsString('TMDB_API_KEY est vide', $tester->getDisplay());
        self::assertSame([], $tmdb->requests);
    }

    public function testReessaieQuandTmdbDemandeDePatienter(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [550]], [550 => FakeTmdb::movie(550, ['title' => 'Fight Club'])]);
        $tmdb->failOnce('/movie/550', 429, ['retry-after' => '0']);

        $tester = $this->import($tmdb);

        self::assertSame(0, $tester->getStatusCode());
        self::assertSame(['Fight Club'], array_keys($this->moviesByTitle()));
    }

    public function testUnePanneDeTmdbNeLaisseAucunFilmAMoitieImporte(): void
    {
        $tmdb = new FakeTmdb(self::GENRES, [1 => [1, 2]], [1 => FakeTmdb::movie(1), 2 => FakeTmdb::movie(2)]);
        $tmdb->failOnce('/movie/2', 500);

        $tester = $this->import($tmdb);

        self::assertSame(1, $tester->getStatusCode());
        self::assertStringContainsString('TMDB ne répond pas', $tester->getDisplay());
        self::assertSame([], $this->moviesByTitle());
        self::assertSame([], $this->requestJson('GET', '/genres?limit=100')['items']);
    }
}
