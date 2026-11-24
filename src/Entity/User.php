<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const ROLE_USER = 'ROLE_USER';
    public const ROLE_ADMIN = 'ROLE_ADMIN';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user:read'])]
    private string $email;

    /**
     * @var list<string>
     */
    #[ORM\Column]
    private array $roles;

    #[ORM\Column]
    private string $password = '';

    /**
     * @param list<string> $roles
     */
    public function __construct(string $email, array $roles = [])
    {
        $this->email = mb_strtolower($email);
        $this->roles = $roles;
    }

    public function changePassword(string $hashedPassword): void
    {
        $this->password = $hashedPassword;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    /**
     * @return list<string>
     */
    #[Groups(['user:read'])]
    public function getRoles(): array
    {
        return array_values(array_unique([self::ROLE_USER, ...$this->roles]));
    }

    public function getPassword(): string
    {
        return $this->password;
    }
}
