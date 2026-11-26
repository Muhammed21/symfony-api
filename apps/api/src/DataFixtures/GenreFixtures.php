<?php

namespace App\DataFixtures;

use App\Entity\Genre;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

final class GenreFixtures extends Fixture
{
    public const NAMES = [
        'Action',
        'Animation',
        'Aventure',
        'Comédie',
        'Documentaire',
        'Drame',
        'Horreur',
        'Romance',
        'Science-fiction',
        'Thriller',
    ];

    public static function reference(string $name): string
    {
        return 'genre-'.$name;
    }

    public function load(ObjectManager $manager): void
    {
        foreach (self::NAMES as $name) {
            $genre = new Genre($name);
            $manager->persist($genre);
            $this->addReference(self::reference($name), $genre);
        }

        $manager->flush();
    }
}
