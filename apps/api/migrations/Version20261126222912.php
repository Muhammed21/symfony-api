<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261126222912 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Identifiants TMDB des films et des genres (spec 13)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE genre ADD COLUMN tmdb_id INTEGER DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_835033F855BCC5E5 ON genre (tmdb_id)');
        $this->addSql('ALTER TABLE movie ADD COLUMN tmdb_id INTEGER DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D5EF26F55BCC5E5 ON movie (tmdb_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_1D5EF26F55BCC5E5');
        $this->addSql('ALTER TABLE movie DROP COLUMN tmdb_id');
        $this->addSql('DROP INDEX UNIQ_835033F855BCC5E5');
        $this->addSql('ALTER TABLE genre DROP COLUMN tmdb_id');
    }
}
