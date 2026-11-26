<?php

namespace App\Tmdb;

use App\Dto\MovieInput;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Enum\AgeRating;
use App\Repository\GenreRepository;
use App\Repository\MovieRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class TmdbImporter
{
    private const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

    private const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

    private const THEATRICAL_RELEASE = 3;

    private const AGE_RATINGS = [
        'U' => AgeRating::All,
        '10' => AgeRating::SevenPlus,
        '12' => AgeRating::ThirteenPlus,
        '16' => AgeRating::SixteenPlus,
        '18' => AgeRating::EighteenPlus,
    ];

    public function __construct(
        private TmdbCatalogue $catalogue,
        private EntityManagerInterface $entityManager,
        private GenreRepository $genres,
        private MovieRepository $movies,
    ) {
    }

    public function import(int $pages): TmdbImportReport
    {
        $tmdbGenres = $this->catalogue->genres();
        $ids = array_merge(...array_map($this->catalogue->popularMovieIds(...), range(1, $pages)));
        $details = array_map($this->catalogue->movie(...), array_values(array_unique($ids)));

        $genresByTmdbId = $this->saveGenres($tmdbGenres);
        $moviesByTmdbId = $this->movies->findAllLinkedToTmdb();
        $created = 0;
        $updated = 0;
        $ignored = [];
        $imported = [];

        foreach ($details as $detail) {
            $reason = self::ignoreReason($detail);
            if (null !== $reason) {
                $ignored[] = "{$detail['title']} : {$reason}";
                continue;
            }

            $input = self::inputOf($detail);
            $genres = array_values(array_filter(array_map(
                static fn (array $genre): ?Genre => $genresByTmdbId[$genre['id']] ?? null,
                $detail['genres'],
            )));
            $movie = $moviesByTmdbId[$detail['id']] ?? null;

            if (null === $movie) {
                $movie = new Movie($input, $genres);
                $movie->linkToTmdb($detail['id']);
                $this->entityManager->persist($movie);
                $moviesByTmdbId[$detail['id']] = $movie;
                ++$created;
            } else {
                $movie->replaceWith($input, $genres);
                ++$updated;
            }

            $imported[] = [$movie, $detail['recommendations']['results']];
        }

        foreach ($imported as [$movie, $recommendations]) {
            foreach ($recommendations as $recommendation) {
                $similar = $moviesByTmdbId[$recommendation['id']] ?? null;
                if (null !== $similar && $similar !== $movie) {
                    $movie->addSimilarMovie($similar);
                }
            }
        }

        $this->entityManager->flush();

        return new TmdbImportReport($created, $updated, $ignored);
    }

    /**
     * @param list<array{id: int, name: string}> $tmdbGenres
     *
     * @return array<int, Genre>
     */
    private function saveGenres(array $tmdbGenres): array
    {
        $saved = [];
        foreach ($tmdbGenres as $tmdbGenre) {
            $genre = $this->genres->findOneBy(['tmdbId' => $tmdbGenre['id']])
                ?? $this->genres->findOneByNameIgnoringCase($tmdbGenre['name'])
                ?? new Genre($tmdbGenre['name']);
            $genre->rename($tmdbGenre['name']);
            $genre->linkToTmdb($tmdbGenre['id']);
            $this->entityManager->persist($genre);
            $saved[$tmdbGenre['id']] = $genre;
        }

        return $saved;
    }

    /**
     * @param array<string, mixed> $detail
     */
    private static function ignoreReason(array $detail): ?string
    {
        if ('' === ($detail['release_date'] ?? '')) {
            return 'pas de date de sortie';
        }

        return 0 < ($detail['runtime'] ?? 0) ? null : 'pas de durée';
    }

    /**
     * @param array<string, mixed> $detail
     */
    private static function inputOf(array $detail): MovieInput
    {
        return new MovieInput(
            title: $detail['title'],
            releaseYear: (int) substr($detail['release_date'], 0, 4),
            duration: $detail['runtime'],
            ageRating: self::ageRatingOf($detail['release_dates']['results']),
            synopsis: '' === $detail['overview'] ? null : $detail['overview'],
            posterUrl: null === $detail['poster_path'] ? null : self::POSTER_BASE_URL.$detail['poster_path'],
            backdropUrl: null === $detail['backdrop_path'] ? null : self::BACKDROP_BASE_URL.$detail['backdrop_path'],
        );
    }

    /**
     * @param list<array{iso_3166_1: string, release_dates: list<array{certification: string, type: int}>}> $countries
     */
    private static function ageRatingOf(array $countries): AgeRating
    {
        $french = array_merge(...array_map(
            static fn (array $country): array => 'FR' === $country['iso_3166_1'] ? $country['release_dates'] : [],
            $countries,
        ));
        $certified = array_values(array_filter($french, static fn (array $release): bool => isset(self::AGE_RATINGS[$release['certification']])));
        $theatrical = array_values(array_filter($certified, static fn (array $release): bool => self::THEATRICAL_RELEASE === $release['type']));
        $chosen = $theatrical[0] ?? $certified[0] ?? null;

        return null === $chosen ? AgeRating::All : self::AGE_RATINGS[$chosen['certification']];
    }
}
