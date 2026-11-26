<?php

namespace App\Command;

use App\Tmdb\TmdbCatalogue;
use App\Tmdb\TmdbImporter;
use App\Tmdb\TmdbUnavailable;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:tmdb:import', description: 'Importe les films populaires de TMDB, en français')]
final readonly class TmdbImportCommand
{
    public function __construct(
        private TmdbCatalogue $catalogue,
        private TmdbImporter $importer,
    ) {
    }

    public function __invoke(SymfonyStyle $io, #[Option('Nombre de pages de 20 films à importer')] int $pages = 1): int
    {
        if (!$this->catalogue->isConfigured()) {
            $io->error('TMDB_API_KEY est vide : ajoutez la clé d\'API TMDB dans apps/api/.env.local.');

            return Command::FAILURE;
        }

        try {
            $report = $this->importer->import($pages);
        } catch (TmdbUnavailable $exception) {
            $io->error('TMDB ne répond pas, aucun film importé : '.$exception->getMessage());

            return Command::FAILURE;
        }

        $io->listing($report->ignored);
        $io->success(sprintf(
            '%d %s, %d mis à jour, %d %s.',
            $report->created,
            $report->created > 1 ? 'films créés' : 'film créé',
            $report->updated,
            count($report->ignored),
            count($report->ignored) > 1 ? 'ignorés' : 'ignoré',
        ));

        return Command::SUCCESS;
    }
}
