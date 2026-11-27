<?php

namespace App\Tmdb;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpClient\Retry\GenericRetryStrategy;
use Symfony\Component\HttpClient\RetryableHttpClient;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class TmdbCatalogue
{
    private const BASE_URL = 'https://api.themoviedb.org/3';

    private const TOO_MANY_REQUESTS = 429;

    private const MAX_RETRIES = 3;

    private const MINIMUM_VOTES = 100;

    private readonly HttpClientInterface $client;

    public function __construct(
        HttpClientInterface $client,
        #[Autowire(env: 'TMDB_API_KEY')]
        private readonly string $apiKey,
    ) {
        $this->client = new RetryableHttpClient($client, new GenericRetryStrategy([self::TOO_MANY_REQUESTS]), self::MAX_RETRIES);
    }

    public function isConfigured(): bool
    {
        return '' !== $this->apiKey;
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    public function genres(): array
    {
        return $this->get('/genre/movie/list')['genres'];
    }

    /**
     * @return list<int>
     */
    public function popularMovieIds(int $page): array
    {
        $results = $this->get('/discover/movie', [
            'sort_by' => 'popularity.desc',
            'vote_count.gte' => self::MINIMUM_VOTES,
            'page' => $page,
        ])['results'];

        return array_map(static fn (array $movie): int => $movie['id'], $results);
    }

    /**
     * @return array<string, mixed>
     */
    public function movie(int $id): array
    {
        return $this->get("/movie/{$id}", [
            'append_to_response' => 'release_dates,recommendations,videos',
            'include_video_language' => 'fr,en',
        ]);
    }

    /**
     * @param array<string, int|string> $query
     *
     * @return array<string, mixed>
     */
    private function get(string $path, array $query = []): array
    {
        try {
            return $this->client->request('GET', self::BASE_URL.$path, [
                'query' => ['api_key' => $this->apiKey, 'language' => 'fr-FR', ...$query],
            ])->toArray();
        } catch (ExceptionInterface $exception) {
            throw new TmdbUnavailable($exception->getMessage(), previous: $exception);
        }
    }
}
