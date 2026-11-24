<?php

namespace App\Repository;

use App\Dto\MovieFilters;
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

    public function createFilteredQuery(MovieFilters $filters): QueryBuilder
    {
        $query = $this->createQueryBuilder('movie')
            ->orderBy('movie.title', 'ASC')
            ->addOrderBy('movie.id', 'ASC');

        if (null !== $filters->title) {
            $query->andWhere('LOWER(movie.title) LIKE :title')
                ->setParameter('title', '%'.mb_strtolower($filters->title).'%');
        }

        if (null !== $filters->year) {
            $query->andWhere('movie.releaseYear = :year')
                ->setParameter('year', $filters->year);
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
}
