<?php

namespace App\Entity;

use App\Repository\GenreRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: GenreRepository::class)]
class Genre
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['genre:read', 'movie:list', 'movie:read'])]
    private ?int $id = null;

    #[ORM\Column(nullable: true, unique: true)]
    private ?int $tmdbId = null;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['genre:read', 'movie:list', 'movie:read'])]
    private string $name;

    /**
     * @var Collection<int, Movie>
     */
    #[ORM\ManyToMany(targetEntity: Movie::class, mappedBy: 'genres')]
    private Collection $movies;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->movies = new ArrayCollection();
    }

    public function rename(string $name): void
    {
        $this->name = $name;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function linkToTmdb(int $tmdbId): void
    {
        $this->tmdbId = $tmdbId;
    }

    public function getTmdbId(): ?int
    {
        return $this->tmdbId;
    }

    public function getName(): string
    {
        return $this->name;
    }
}
