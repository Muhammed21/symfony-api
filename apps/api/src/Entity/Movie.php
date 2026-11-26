<?php

namespace App\Entity;

use App\Dto\MovieInput;
use App\Enum\AgeRating;
use App\Repository\MovieRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MovieRepository::class)]
class Movie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movie:list', 'movie:read', 'review:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['movie:list', 'movie:read'])]
    private string $title;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['movie:read'])]
    private ?string $synopsis;

    #[ORM\Column]
    #[Groups(['movie:list', 'movie:read'])]
    private int $releaseYear;

    #[ORM\Column]
    #[Groups(['movie:list', 'movie:read'])]
    private int $duration;

    #[ORM\Column(length: 3, enumType: AgeRating::class)]
    #[Groups(['movie:list', 'movie:read'])]
    private AgeRating $ageRating;

    /**
     * @var Collection<int, Genre>
     */
    #[ORM\ManyToMany(targetEntity: Genre::class, inversedBy: 'movies')]
    private Collection $genres;

    /**
     * @var Collection<int, Movie>
     */
    #[ORM\ManyToMany(targetEntity: Movie::class)]
    #[ORM\JoinTable(name: 'movie_similar')]
    #[ORM\InverseJoinColumn(name: 'similar_movie_id', onDelete: 'CASCADE')]
    private Collection $similarMovies;

    /**
     * @var Collection<int, Review>
     */
    #[ORM\OneToMany(targetEntity: Review::class, mappedBy: 'movie', cascade: ['remove'])]
    private Collection $reviews;

    /**
     * @param list<Genre> $genres
     */
    public function __construct(MovieInput $input, array $genres)
    {
        $this->genres = new ArrayCollection();
        $this->reviews = new ArrayCollection();
        $this->similarMovies = new ArrayCollection();
        $this->replaceWith($input, $genres);
    }

    /**
     * @param list<Genre> $genres
     */
    public function replaceWith(MovieInput $input, array $genres): void
    {
        $this->title = $input->title;
        $this->synopsis = $input->synopsis;
        $this->releaseYear = $input->releaseYear;
        $this->duration = $input->duration;
        $this->ageRating = $input->ageRating;
        $this->genres->clear();
        array_walk($genres, fn (Genre $genre) => $this->genres->add($genre));
    }

    /**
     * @return list<Genre>
     */
    #[Groups(['movie:list', 'movie:read'])]
    public function getGenres(): array
    {
        $genres = $this->genres->getValues();
        usort($genres, static fn (Genre $a, Genre $b): int => strcmp($a->getName(), $b->getName()));

        return $genres;
    }

    public function addSimilarMovie(Movie $other): void
    {
        if ($other === $this) {
            throw new \DomainException('Un film ne peut pas être similaire à lui-même.');
        }

        if ($this->similarMovies->contains($other)) {
            return;
        }

        $this->similarMovies->add($other);
        $other->addSimilarMovie($this);
    }

    public function removeSimilarMovie(Movie $other): void
    {
        if (!$this->similarMovies->removeElement($other)) {
            return;
        }

        $other->removeSimilarMovie($this);
    }

    /**
     * @return list<array{id: ?int, title: string}>
     */
    #[Groups(['movie:read'])]
    public function getSimilarMovies(): array
    {
        $movies = $this->similarMovies->getValues();
        usort($movies, static fn (Movie $a, Movie $b): int => strcmp($a->getTitle(), $b->getTitle()));

        return array_map(static fn (Movie $movie): array => ['id' => $movie->getId(), 'title' => $movie->getTitle()], $movies);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getSynopsis(): ?string
    {
        return $this->synopsis;
    }

    public function getReleaseYear(): int
    {
        return $this->releaseYear;
    }

    public function getDuration(): int
    {
        return $this->duration;
    }

    public function getAgeRating(): AgeRating
    {
        return $this->ageRating;
    }
}
