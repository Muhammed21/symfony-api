<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261126124237 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Affiche et bannière des films (spec 10)';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE movie ADD COLUMN poster_url VARCHAR(2048) DEFAULT NULL');
        $this->addSql('ALTER TABLE movie ADD COLUMN backdrop_url VARCHAR(2048) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__movie AS SELECT id, title, synopsis, release_year, duration, age_rating FROM movie');
        $this->addSql('DROP TABLE movie');
        $this->addSql('CREATE TABLE movie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, synopsis CLOB DEFAULT NULL, release_year INTEGER NOT NULL, duration INTEGER NOT NULL, age_rating VARCHAR(3) NOT NULL)');
        $this->addSql('INSERT INTO movie (id, title, synopsis, release_year, duration, age_rating) SELECT id, title, synopsis, release_year, duration, age_rating FROM __temp__movie');
        $this->addSql('DROP TABLE __temp__movie');
    }
}
