<?php

namespace App\Tests\Controller;

use App\Entity\User;
use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class ReviewTest extends ApiTestCase
{
    private int $movieId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->movieId = $this->createMovie()['id'];
    }

    private function actAsNew(string $email): User
    {
        $user = $this->createUser($email);
        $this->actAs($user);

        return $user;
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    private function postReview(array $payload = ['rating' => 4, 'comment' => 'Culte.'], ?int $movieId = null): array
    {
        return $this->requestJson('POST', sprintf('/movies/%d/reviews', $movieId ?? $this->movieId), $payload) ?? [];
    }

    public function testUserReviewsMovie(): void
    {
        $bob = $this->actAsNew('bob@prime.local');

        $review = $this->postReview();

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['id', 'rating', 'comment', 'createdAt', 'author', 'movie'], array_keys($review));
        self::assertIsInt($review['id']);
        self::assertSame(4, $review['rating']);
        self::assertSame('Culte.', $review['comment']);
        self::assertNotFalse(\DateTimeImmutable::createFromFormat(\DATE_ATOM, $review['createdAt']));
        self::assertSame(['id' => $bob->getId()], $review['author']);
        self::assertSame(['id' => $this->movieId], $review['movie']);
    }

    public function testCommentIsOptional(): void
    {
        $this->actAsNew('bob@prime.local');

        $review = $this->postReview(['rating' => 3]);

        self::assertResponseStatusCodeSame(201);
        self::assertNull($review['comment']);
    }

    public function testAuthorAndMovieSentInBodyAreIgnored(): void
    {
        $otherMovie = $this->createMovie(['title' => 'Heat']);
        $bob = $this->actAsNew('bob@prime.local');

        $review = $this->postReview(['rating' => 4, 'author' => ['id' => $this->admin->getId()], 'movie' => ['id' => $otherMovie['id']]]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['id' => $bob->getId()], $review['author']);
        self::assertSame(['id' => $this->movieId], $review['movie']);
    }

    public function testSecondReviewOfSameMovieBySameUserReturns409(): void
    {
        $this->actAsNew('bob@prime.local');
        $this->postReview();

        $this->postReview(['rating' => 2]);

        self::assertResponseStatusCodeSame(409);
    }

    public function testDifferentUsersCanReviewSameMovie(): void
    {
        $this->actAsNew('bob@prime.local');
        $this->postReview();
        $this->actAsNew('carol@prime.local');

        $this->postReview();

        self::assertResponseStatusCodeSame(201);
    }

    /**
     * @return iterable<string, array{array<string, mixed>, string}>
     */
    public static function invalidReviewProvider(): iterable
    {
        yield 'rating zero' => [['rating' => 0], 'rating'];
        yield 'rating six' => [['rating' => 6], 'rating'];
        yield 'missing rating' => [['comment' => 'Sans note'], 'rating'];
        yield 'comment too long' => [['rating' => 4, 'comment' => str_repeat('a', 1001)], 'comment'];
    }

    /**
     * @param array<string, mixed> $payload
     */
    #[DataProvider('invalidReviewProvider')]
    public function testRejectsInvalidReview(array $payload, string $field): void
    {
        $this->actAsNew('bob@prime.local');

        $error = $this->postReview($payload);

        self::assertResponseStatusCodeSame(422);
        self::assertContains($field, self::violatedPaths($error));
    }

    public function testAcceptsRatingAndCommentBoundaries(): void
    {
        $this->actAsNew('bob@prime.local');
        $this->postReview(['rating' => 1, 'comment' => str_repeat('a', 1000)]);
        self::assertResponseStatusCodeSame(201);

        $this->actAsNew('carol@prime.local');
        $this->postReview(['rating' => 5]);
        self::assertResponseStatusCodeSame(201);
    }

    public function testReviewingRequiresAuthentication(): void
    {
        $this->actAsAnonymous();

        $this->postReview();

        self::assertResponseStatusCodeSame(401);
    }

    public function testReviewingUnknownMovieReturns404(): void
    {
        $this->actAsNew('bob@prime.local');

        $this->postReview(movieId: 999999);

        self::assertResponseStatusCodeSame(404);
    }

    public function testAnyoneCanListReviewsOfMovieNewestFirstAndPaginated(): void
    {
        $ids = array_map(function (int $number): int {
            $this->actAsNew(sprintf('user%d@prime.local', $number));

            return $this->postReview(['rating' => 1 + $number % 5])['id'];
        }, range(1, 6));
        $this->actAsAnonymous();

        $body = $this->requestJson('GET', sprintf('/movies/%d/reviews', $this->movieId));

        self::assertResponseIsSuccessful();
        self::assertSame(array_slice(array_reverse($ids), 0, 5), array_column($body['items'], 'id'));
        self::assertSame(6, $body['total']);
        self::assertSame(2, $body['lastPage']);
    }

    public function testListOnlyContainsReviewsOfThatMovie(): void
    {
        $otherMovie = $this->createMovie(['title' => 'Heat']);
        $this->actAsNew('bob@prime.local');
        $review = $this->postReview();
        $this->postReview(movieId: $otherMovie['id']);

        $body = $this->requestJson('GET', sprintf('/movies/%d/reviews', $this->movieId));

        self::assertSame([$review['id']], array_column($body['items'], 'id'));
    }

    public function testListingReviewsOfUnknownMovieReturns404(): void
    {
        $this->requestJson('GET', '/movies/999999/reviews');

        self::assertResponseStatusCodeSame(404);
    }

    public function testListingReviewsRejectsInvalidPagination(): void
    {
        $this->requestJson('GET', sprintf('/movies/%d/reviews?page=0', $this->movieId));

        self::assertResponseStatusCodeSame(422);
    }

    public function testAuthorEditsTheirReview(): void
    {
        $bob = $this->actAsNew('bob@prime.local');
        $created = $this->postReview();

        $review = $this->requestJson('PUT', '/reviews/'.$created['id'], ['rating' => 2, 'comment' => 'Finalement bof.']);

        self::assertResponseIsSuccessful();
        self::assertSame(2, $review['rating']);
        self::assertSame('Finalement bof.', $review['comment']);
        self::assertSame(['id' => $bob->getId()], $review['author']);
        self::assertSame($created['createdAt'], $review['createdAt']);
    }

    public function testEditingWithInvalidRatingReturns422(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();

        $this->requestJson('PUT', '/reviews/'.$created['id'], ['rating' => 6]);

        self::assertResponseStatusCodeSame(422);
    }

    public function testOtherUserCannotEditReview(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAsNew('carol@prime.local');

        $this->requestJson('PUT', '/reviews/'.$created['id'], ['rating' => 1]);

        self::assertResponseStatusCodeSame(403);
    }

    public function testAdministratorCannotEditSomeoneElsesReview(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAs($this->admin);

        $this->requestJson('PUT', '/reviews/'.$created['id'], ['rating' => 1]);

        self::assertResponseStatusCodeSame(403);
    }

    public function testEditingRequiresAuthentication(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAsAnonymous();

        $this->requestJson('PUT', '/reviews/'.$created['id'], ['rating' => 1]);

        self::assertResponseStatusCodeSame(401);
    }

    public function testEditingUnknownReviewReturns404(): void
    {
        $this->requestJson('PUT', '/reviews/999999', ['rating' => 1]);

        self::assertResponseStatusCodeSame(404);
    }

    public function testAuthorDeletesTheirReview(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();

        $this->requestJson('DELETE', '/reviews/'.$created['id']);
        self::assertResponseStatusCodeSame(204);

        $body = $this->requestJson('GET', sprintf('/movies/%d/reviews', $this->movieId));
        self::assertSame([], $body['items']);
    }

    public function testAdministratorDeletesAnyReview(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAs($this->admin);

        $this->requestJson('DELETE', '/reviews/'.$created['id']);

        self::assertResponseStatusCodeSame(204);
    }

    public function testOtherUserCannotDeleteReview(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAsNew('carol@prime.local');

        $this->requestJson('DELETE', '/reviews/'.$created['id']);

        self::assertResponseStatusCodeSame(403);
    }

    public function testDeletingRequiresAuthentication(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAsAnonymous();

        $this->requestJson('DELETE', '/reviews/'.$created['id']);

        self::assertResponseStatusCodeSame(401);
    }

    public function testDeletingUnknownReviewReturns404(): void
    {
        $this->requestJson('DELETE', '/reviews/999999');

        self::assertResponseStatusCodeSame(404);
    }

    public function testDeletingMovieDeletesItsReviews(): void
    {
        $this->actAsNew('bob@prime.local');
        $created = $this->postReview();
        $this->actAs($this->admin);

        $this->requestJson('DELETE', '/movies/'.$this->movieId);
        self::assertResponseStatusCodeSame(204);

        $this->requestJson('DELETE', '/reviews/'.$created['id']);
        self::assertResponseStatusCodeSame(404);
    }
}
