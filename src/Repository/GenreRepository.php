<?php

namespace App\Repository;

use App\Entity\Genre;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Genre>
 */
class GenreRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Genre::class);
    }

    public function createSortedQuery(): QueryBuilder
    {
        return $this->createQueryBuilder('genre')
            ->orderBy('genre.name', 'ASC')
            ->addOrderBy('genre.id', 'ASC');
    }

    public function findOneByNameIgnoringCase(string $name): ?Genre
    {
        return $this->createQueryBuilder('genre')
            ->andWhere('LOWER(genre.name) = :name')
            ->setParameter('name', mb_strtolower($name))
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @param list<int> $ids
     *
     * @return list<Genre>
     */
    public function findByIds(array $ids): array
    {
        return $this->findBy(['id' => array_values(array_unique($ids))]);
    }

    public function save(Genre $genre): void
    {
        $this->getEntityManager()->persist($genre);
        $this->getEntityManager()->flush();
    }

    public function remove(Genre $genre): void
    {
        $this->getEntityManager()->remove($genre);
        $this->getEntityManager()->flush();
    }
}
