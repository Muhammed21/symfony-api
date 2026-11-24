<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;

final class MovieRatingTest extends ApiTestCase
{
    /**
     * @param list<int> $ratings
     */
    private function reviewByDifferentUsers(int $movieId, array $ratings): void
    {
        foreach ($ratings as $index => $rating) {
            $this->actAs($this->createUser(sprintf('user%d@prime.local', $index)));
            $this->requestJson('POST', sprintf('/movies/%d/reviews', $movieId), ['rating' => $rating]);
            self::assertResponseStatusCodeSame(201);
        }
        $this->actAsAnonymous();
    }

    public function testMovieDetailShowsAverageRatingAndReviewCount(): void
    {
        $movie = $this->createMovie();
        $this->reviewByDifferentUsers($movie['id'], [4, 5]);

        $detail = $this->requestJson('GET', '/movies/'.$movie['id']);

        self::assertSame(4.5, $detail['averageRating']);
        self::assertSame(2, $detail['reviewCount']);
    }

    public function testAverageRatingIsRoundedToOneDecimal(): void
    {
        $movie = $this->createMovie();
        $this->reviewByDifferentUsers($movie['id'], [4, 4, 5]);

        $detail = $this->requestJson('GET', '/movies/'.$movie['id']);

        self::assertSame(4.3, $detail['averageRating']);
        self::assertSame(3, $detail['reviewCount']);
    }

    public function testMovieWithoutReviewsHasNoAverageRating(): void
    {
        $movie = $this->createMovie();

        $detail = $this->requestJson('GET', '/movies/'.$movie['id']);

        self::assertArrayHasKey('averageRating', $detail);
        self::assertNull($detail['averageRating']);
        self::assertSame(0, $detail['reviewCount']);
    }

    public function testAverageOnlyCountsReviewsOfThatMovie(): void
    {
        $movie = $this->createMovie();
        $otherMovie = $this->createMovie(['title' => 'Heat']);
        $this->reviewByDifferentUsers($movie['id'], [2]);
        $this->actAs($this->admin);
        $this->requestJson('POST', sprintf('/movies/%d/reviews', $otherMovie['id']), ['rating' => 5]);

        $detail = $this->requestJson('GET', '/movies/'.$movie['id']);

        self::assertEquals(2, $detail['averageRating']);
        self::assertSame(1, $detail['reviewCount']);
    }

    public function testMovieListDoesNotShowRatings(): void
    {
        $this->createMovie();

        $body = $this->requestJson('GET', '/movies');

        self::assertArrayNotHasKey('averageRating', $body['items'][0]);
        self::assertArrayNotHasKey('reviewCount', $body['items'][0]);
    }
}
