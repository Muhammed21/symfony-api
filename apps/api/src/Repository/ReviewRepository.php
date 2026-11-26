<?php

namespace App\Repository;

use App\Entity\Movie;
use App\Entity\Review;
use App\Entity\User;
use App\Model\RatingSummary;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Review>
 */
class ReviewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Review::class);
    }

    public function createNewestFirstQuery(Movie $movie): QueryBuilder
    {
        return $this->createQueryBuilder('review')
            ->andWhere('review.movie = :movie')
            ->setParameter('movie', $movie)
            ->orderBy('review.createdAt', 'DESC')
            ->addOrderBy('review.id', 'DESC');
    }

    public function hasReviewed(User $author, Movie $movie): bool
    {
        return null !== $this->findOneBy(['author' => $author, 'movie' => $movie]);
    }

    public function summarizeRatings(Movie $movie): RatingSummary
    {
        /** @var array{average: string|float|null, count: int|string} $row */
        $row = $this->createQueryBuilder('review')
            ->select('AVG(review.rating) AS average', 'COUNT(review.id) AS count')
            ->andWhere('review.movie = :movie')
            ->setParameter('movie', $movie)
            ->getQuery()
            ->getSingleResult();

        return RatingSummary::fromAggregate($row['average'], (int) $row['count']);
    }

    public function save(Review $review): void
    {
        $this->getEntityManager()->persist($review);
        $this->getEntityManager()->flush();
    }

    public function remove(Review $review): void
    {
        $this->getEntityManager()->remove($review);
        $this->getEntityManager()->flush();
    }
}
