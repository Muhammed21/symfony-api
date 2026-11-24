<?php

namespace App\Entity;

use App\Dto\MovieInput;
use App\Enum\AgeRating;
use App\Repository\MovieRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MovieRepository::class)]
class Movie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movie:list', 'movie:read'])]
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

    public function __construct(MovieInput $input)
    {
        $this->replaceWith($input);
    }

    public function replaceWith(MovieInput $input): void
    {
        $this->title = $input->title;
        $this->synopsis = $input->synopsis;
        $this->releaseYear = $input->releaseYear;
        $this->duration = $input->duration;
        $this->ageRating = $input->ageRating;
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
