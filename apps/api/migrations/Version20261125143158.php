<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261125143158 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE movie_similar (movie_id INTEGER NOT NULL, similar_movie_id INTEGER NOT NULL, PRIMARY KEY (movie_id, similar_movie_id), CONSTRAINT FK_EB2D7AB38F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_EB2D7AB395FCEB10 FOREIGN KEY (similar_movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_EB2D7AB38F93B6FC ON movie_similar (movie_id)');
        $this->addSql('CREATE INDEX IDX_EB2D7AB395FCEB10 ON movie_similar (similar_movie_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE movie_similar');
    }
}
