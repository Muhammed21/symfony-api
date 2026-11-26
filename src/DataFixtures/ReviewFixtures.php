<?php

namespace App\DataFixtures;

use App\Dto\ReviewInput;
use App\Entity\Movie;
use App\Entity\Review;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;

final class ReviewFixtures extends Fixture implements DependentFixtureInterface
{
    public const COUNT = 80;
    private const SEED = 2027;

    public function getDependencies(): array
    {
        return [UserFixtures::class, MovieFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $faker->seed(self::SEED);

        $drafts = array_map(
            static fn (array $authorAndMovie): array => [
                'author' => $authorAndMovie[0],
                'movie' => $authorAndMovie[1],
                'input' => new ReviewInput(
                    rating: $faker->numberBetween(ReviewInput::MIN_RATING, ReviewInput::MAX_RATING),
                    comment: $faker->optional(0.8)->realText($faker->numberBetween(40, 300)),
                ),
            ],
            $faker->randomElements(self::allAuthorAndMoviePairs(), self::COUNT),
        );

        foreach ($drafts as $draft) {
            $manager->persist(new Review(
                $this->getReference($draft['author'], User::class),
                $this->getReference(MovieFixtures::reference($draft['movie']), Movie::class),
                $draft['input'],
            ));
        }

        $manager->flush();
    }

    /**
     * @return list<array{string, int}>
     */
    private static function allAuthorAndMoviePairs(): array
    {
        return array_merge(...array_map(
            static fn (string $author): array => array_map(static fn (int $movie): array => [$author, $movie], range(1, MovieFixtures::COUNT)),
            UserFixtures::allUsers(),
        ));
    }
}
