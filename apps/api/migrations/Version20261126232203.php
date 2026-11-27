<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261126232203 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Bande-annonce YouTube des films (spec 14)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE movie ADD COLUMN trailer_key VARCHAR(20) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE movie DROP COLUMN trailer_key');
    }
}
