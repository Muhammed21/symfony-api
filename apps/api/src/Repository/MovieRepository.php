<?php

namespace App\Repository;

use App\Dto\MovieFilters;
use App\Dto\MovieSorting;
use App\Entity\Movie;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Movie>
 */
class MovieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Movie::class);
    }

    public function createFilteredQuery(MovieFilters $filters, MovieSorting $sorting = new MovieSorting()): QueryBuilder
    {
        $query = $this->createQueryBuilder('movie')
            ->leftJoin('movie.genres', 'genre')
            ->addSelect('genre');

        if (MovieSorting::MOST_RECENT === $sorting->sort) {
            $query->addOrderBy('movie.releaseYear', 'DESC');
        }

        $query->addOrderBy('movie.title', 'ASC')
            ->addOrderBy('movie.id', 'ASC');

        if (null !== $filters->title) {
            $query->andWhere('LOWER(movie.title) LIKE :title')
                ->setParameter('title', '%'.mb_strtolower($filters->title).'%');
        }

        if (null !== $filters->year) {
            $query->andWhere('movie.releaseYear = :year')
                ->setParameter('year', $filters->year);
        }

        if (null !== $filters->genre) {
            $query->andWhere(':genre MEMBER OF movie.genres')
                ->setParameter('genre', $filters->genre);
        }

        return $query;
    }

    public function save(Movie $movie): void
    {
        $this->getEntityManager()->persist($movie);
        $this->getEntityManager()->flush();
    }

    public function remove(Movie $movie): void
    {
        $this->getEntityManager()->remove($movie);
        $this->getEntityManager()->flush();
    }

    /**
     * @return array<int, Movie>
     */
    public function findAllLinkedToTmdb(): array
    {
        $movies = $this->createQueryBuilder('movie')->andWhere('movie.tmdbId IS NOT NULL')->getQuery()->getResult();

        return array_combine(array_map(static fn (Movie $movie): int => (int) $movie->getTmdbId(), $movies), $movies);
    }
}
