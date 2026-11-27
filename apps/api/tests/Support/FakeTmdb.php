<?php

namespace App\Tests\Support;

use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

final class FakeTmdb
{
    /** @var list<array{path: string, query: array<string, string>}> */
    public array $requests = [];

    /** @var array<string, list<MockResponse>> */
    private array $failures = [];

    /**
     * @param list<array{id: int, name: string}>     $genres
     * @param array<int, list<int>>                  $pages
     * @param array<int, array<string, mixed>>       $movies
     */
    public function __construct(
        private readonly array $genres = [],
        private readonly array $pages = [],
        private array $movies = [],
    ) {
    }

    /**
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    public static function movie(int $id, array $overrides = []): array
    {
        return [
            'id' => $id,
            'title' => "Film {$id}",
            'overview' => "Résumé du film {$id}.",
            'release_date' => '1999-10-15',
            'runtime' => 139,
            'genres' => [['id' => 18, 'name' => 'Drame']],
            'poster_path' => "/affiche-{$id}.jpg",
            'backdrop_path' => "/banniere-{$id}.jpg",
            'release_dates' => ['results' => []],
            'recommendations' => ['results' => []],
            'videos' => ['results' => []],
            ...$overrides,
        ];
    }

    /**
     * @return array{results: list<array{iso_3166_1: string, release_dates: list<array{certification: string, type: int}>}>}
     */
    public static function frenchCertifications(string ...$certificationsByType): array
    {
        return ['results' => [[
            'iso_3166_1' => 'FR',
            'release_dates' => array_map(
                static fn (string $entry): array => [
                    'certification' => explode(':', $entry)[1],
                    'type' => (int) explode(':', $entry)[0],
                ],
                array_values($certificationsByType),
            ),
        ]]];
    }

    /**
     * @return array{iso_639_1: string, site: string, type: string, official: bool, key: string}
     */
    public static function video(string $key, string $language = 'fr', string $type = 'Trailer', bool $official = true, string $site = 'YouTube'): array
    {
        return ['iso_639_1' => $language, 'site' => $site, 'type' => $type, 'official' => $official, 'key' => $key];
    }

    /**
     * @param array<string, mixed> $movie
     */
    public function replaceMovie(int $id, array $movie): void
    {
        $this->movies[$id] = $movie;
    }

    public function failOnce(string $path, int $status, array $headers = []): void
    {
        $this->failures[$path][] = new MockResponse('{"status_code":0}', ['http_code' => $status, 'response_headers' => $headers]);
    }

    public function client(): MockHttpClient
    {
        return new MockHttpClient(fn (string $method, string $url): MockResponse => $this->respond($url));
    }

    /**
     * @return list<string>
     */
    public function paths(): array
    {
        return array_map(static fn (array $request): string => $request['path'], $this->requests);
    }

    private function respond(string $url): MockResponse
    {
        $parts = parse_url($url);
        $path = substr($parts['path'] ?? '', strlen('/3'));
        parse_str($parts['query'] ?? '', $query);
        $this->requests[] = ['path' => $path, 'query' => $query];

        if (($this->failures[$path] ?? []) !== []) {
            return array_shift($this->failures[$path]);
        }

        return match (true) {
            $path === '/genre/movie/list' => self::json(['genres' => $this->genres]),
            $path === '/discover/movie' => self::json([
                'page' => (int) $query['page'],
                'results' => array_map(static fn (int $id): array => ['id' => $id], $this->pages[(int) $query['page']] ?? []),
            ]),
            1 === preg_match('#^/movie/(\d+)$#', $path, $match) && isset($this->movies[(int) $match[1]]) => self::json($this->movies[(int) $match[1]]),
            default => new MockResponse('{"status_code":34}', ['http_code' => 404]),
        };
    }

    /**
     * @param array<string, mixed> $body
     */
    private static function json(array $body): MockResponse
    {
        return new MockResponse(json_encode($body, JSON_THROW_ON_ERROR), ['response_headers' => ['content-type' => 'application/json']]);
    }
}
