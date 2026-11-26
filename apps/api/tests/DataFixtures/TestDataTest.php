<?php

namespace App\Tests\DataFixtures;

use App\Entity\Review;
use App\Entity\User;
use App\Tests\Support\ApiTestCase;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;

final class TestDataTest extends ApiTestCase
{
    private function loadTestData(): void
    {
        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);

        (new ORMExecutor($entityManager, new ORMPurger($entityManager)))
            ->execute($container->get('doctrine.fixtures.loader')->getFixtures());
        $entityManager->clear();
        $this->actAsAnonymous();
    }

    private function logIn(string $email): void
    {
        $this->actAsAnonymous();
        $login = $this->requestJson('POST', '/login', ['email' => $email, 'password' => 'password']);
        self::assertResponseIsSuccessful();
        $this->useToken($login['token']);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function allMovies(): array
    {
        return $this->requestJson('GET', '/movies?limit=100')['items'];
    }

    public function testLoadsExpectedVolumes(): void
    {
        $this->loadTestData();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        self::assertSame(40, $this->requestJson('GET', '/movies')['total']);
        self::assertSame(10, $this->requestJson('GET', '/genres')['total']);
        self::assertSame(6, $entityManager->getRepository(User::class)->count());
        self::assertSame(80, $entityManager->getRepository(Review::class)->count());
    }

    public function testGivesEachMovieAPosterAndABackdropFromTheSamePhoto(): void
    {
        $this->loadTestData();

        foreach ($this->allMovies() as $movie) {
            self::assertMatchesRegularExpression('#^https://picsum\.photos/seed/prime-video-(\d+)/448/250$#', $movie['posterUrl']);
            self::assertSame(
                str_replace('/448/250', '/1280/720', $movie['posterUrl']),
                $movie['backdropUrl'],
            );
        }
        self::assertCount(40, array_unique(array_column($this->allMovies(), 'posterUrl')));
    }

    public function testLoadsTheTenRealGenres(): void
    {
        $this->loadTestData();

        $names = array_column($this->requestJson('GET', '/genres?limit=100')['items'], 'name');

        self::assertSame(['Action', 'Animation', 'Aventure', 'Comédie', 'Documentaire', 'Drame', 'Horreur', 'Romance', 'Science-fiction', 'Thriller'], $names);
    }

    public function testAdministratorCanLogInAndManageTheCatalogue(): void
    {
        $this->loadTestData();
        $this->logIn('admin@prime.local');

        $this->requestJson('POST', '/movies', self::aMovie());

        self::assertResponseStatusCodeSame(201);
    }

    public function testRegularUsersCanLogInButNotManageTheCatalogue(): void
    {
        $this->loadTestData();

        foreach (range(1, 5) as $number) {
            $this->logIn(sprintf('user%d@prime.local', $number));
            $this->requestJson('POST', '/movies', self::aMovie());
            self::assertResponseStatusCodeSame(403);
        }
    }

    public function testEveryMovieRespectsTheValidationRules(): void
    {
        $this->loadTestData();
        $latestYear = (int) date('Y') + 5;

        foreach ($this->allMovies() as $movie) {
            self::assertNotSame('', $movie['title']);
            self::assertLessThanOrEqual(255, mb_strlen($movie['title']));
            self::assertGreaterThanOrEqual(1888, $movie['releaseYear']);
            self::assertLessThanOrEqual($latestYear, $movie['releaseYear']);
            self::assertGreaterThan(0, $movie['duration']);
            self::assertContains($movie['ageRating'], ['ALL', '7+', '13+', '16+', '18+']);
            self::assertGreaterThanOrEqual(1, count($movie['genres']));
            self::assertLessThanOrEqual(3, count($movie['genres']));
        }
    }

    public function testNoUserReviewsTheSameMovieTwiceAndRatingsAreValid(): void
    {
        $this->loadTestData();

        $reviews = static::getContainer()->get(EntityManagerInterface::class)->getRepository(Review::class)->findAll();
        $pairs = array_map(static fn (Review $review): string => $review->getAuthor()->getId().'-'.$review->getMovie()->getId(), $reviews);

        self::assertSame(count($pairs), count(array_unique($pairs)));
        foreach ($reviews as $review) {
            self::assertGreaterThanOrEqual(1, $review->getRating());
            self::assertLessThanOrEqual(5, $review->getRating());
            self::assertLessThanOrEqual(1000, mb_strlen((string) $review->getComment()));
        }
    }

    public function testSimilarTitlesAreSymmetricAndNeverSelfReferencing(): void
    {
        $this->loadTestData();

        $links = [];
        foreach ($this->allMovies() as $movie) {
            foreach ($this->requestJson('GET', '/movies/'.$movie['id'])['similarMovies'] as $similar) {
                self::assertNotSame($movie['id'], $similar['id']);
                $links[] = [$movie['id'], $similar['id']];
            }
        }

        self::assertCount(40, $links);
        foreach ($links as [$movieId, $similarId]) {
            self::assertContains([$similarId, $movieId], $links);
        }
    }

    public function testLoadingTwiceProducesTheSameMovies(): void
    {
        $this->loadTestData();
        $first = array_column($this->allMovies(), 'title');

        $this->loadTestData();
        $second = array_column($this->allMovies(), 'title');

        self::assertCount(40, $first);
        self::assertSame($first, $second);
    }
}
