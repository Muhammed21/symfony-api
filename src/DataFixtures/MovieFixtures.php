<?php

namespace App\DataFixtures;

use App\Dto\MovieInput;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Enum\AgeRating;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use Faker\Generator;

final class MovieFixtures extends Fixture implements DependentFixtureInterface
{
    public const COUNT = 40;
    public const SIMILAR_PAIR_COUNT = 20;
    private const SEED = 2026;

    public static function reference(int $number): string
    {
        return 'movie-'.$number;
    }

    public function getDependencies(): array
    {
        return [GenreFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $faker->seed(self::SEED);

        $drafts = array_map(fn (): array => $this->draftMovie($faker), range(1, self::COUNT));
        $similarPairs = $faker->randomElements(self::allMoviePairs(), self::SIMILAR_PAIR_COUNT);

        $movies = array_map(
            fn (array $draft, int $number): Movie => $this->createMovie($manager, $draft, $number),
            $drafts,
            range(1, self::COUNT),
        );
        foreach ($similarPairs as [$first, $second]) {
            $movies[$first]->addSimilarMovie($movies[$second]);
        }

        $manager->flush();
    }

    /**
     * @return array{input: MovieInput, genreNames: list<string>}
     */
    private function draftMovie(Generator $faker): array
    {
        return [
            'input' => new MovieInput(
                title: $faker->unique()->catchPhrase(),
                releaseYear: $faker->numberBetween(1930, (int) date('Y')),
                duration: $faker->numberBetween(75, 200),
                ageRating: $faker->randomElement(AgeRating::cases()),
                synopsis: $faker->realText($faker->numberBetween(150, 600)),
            ),
            'genreNames' => array_values($faker->randomElements(GenreFixtures::NAMES, $faker->numberBetween(1, 3))),
        ];
    }

    /**
     * @param array{input: MovieInput, genreNames: list<string>} $draft
     */
    private function createMovie(ObjectManager $manager, array $draft, int $number): Movie
    {
        $genres = array_map(
            fn (string $name): Genre => $this->getReference(GenreFixtures::reference($name), Genre::class),
            $draft['genreNames'],
        );

        $movie = new Movie($draft['input'], $genres);
        $manager->persist($movie);
        $this->addReference(self::reference($number), $movie);

        return $movie;
    }

    /**
     * @return list<array{int, int}>
     */
    private static function allMoviePairs(): array
    {
        $indexes = range(0, self::COUNT - 1);

        return array_merge(...array_map(
            static fn (int $first): array => array_map(static fn (int $second): array => [$first, $second], array_slice($indexes, $first + 1)),
            $indexes,
        ));
    }
}
