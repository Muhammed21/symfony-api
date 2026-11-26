<?php

namespace App\Entity;

use App\Dto\ReviewInput;
use App\Repository\ReviewRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ReviewRepository::class)]
#[ORM\UniqueConstraint(name: 'one_review_per_author_and_movie', columns: ['author_id', 'movie_id'])]
class Review
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['review:read'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Groups(['review:read'])]
    private int $rating;

    #[ORM\Column(length: 1000, nullable: true)]
    #[Groups(['review:read'])]
    private ?string $comment;

    #[ORM\Column]
    #[Groups(['review:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['review:read'])]
    private User $author;

    #[ORM\ManyToOne(inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['review:read'])]
    private Movie $movie;

    public function __construct(User $author, Movie $movie, ReviewInput $input)
    {
        $this->author = $author;
        $this->movie = $movie;
        $this->createdAt = new \DateTimeImmutable();
        $this->replaceWith($input);
    }

    public function replaceWith(ReviewInput $input): void
    {
        $this->rating = $input->rating;
        $this->comment = $input->comment;
    }

    public function isWrittenBy(User $user): bool
    {
        return $this->author === $user;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRating(): int
    {
        return $this->rating;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getAuthor(): User
    {
        return $this->author;
    }

    public function getMovie(): Movie
    {
        return $this->movie;
    }
}
