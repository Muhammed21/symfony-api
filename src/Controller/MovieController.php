<?php

namespace App\Controller;

use App\Dto\MovieFilters;
use App\Dto\MovieInput;
use App\Entity\Movie;
use App\Entity\User;
use App\Model\PaginationDTO;
use App\Model\Paginator;
use App\Repository\GenreRepository;
use App\Repository\MovieRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/movies')]
final class MovieController extends AbstractController
{
    public function __construct(
        private readonly MovieRepository $movies,
        private readonly GenreRepository $genres,
    ) {
    }

    #[Route('', name: 'movie_list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)]
        PaginationDTO $pagination = new PaginationDTO(),
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)]
        MovieFilters $filters = new MovieFilters(),
    ): JsonResponse {
        $page = (new Paginator())->paginate($this->movies->createFilteredQuery($filters), $pagination);

        return $this->json($page, context: ['groups' => ['paginate', 'movie:list']]);
    }

    #[Route('/{id}', name: 'movie_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(Movie $movie): JsonResponse
    {
        return $this->json($movie, context: ['groups' => ['movie:read']]);
    }

    #[Route('', name: 'movie_create', methods: ['POST'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function create(#[MapRequestPayload] MovieInput $input): JsonResponse
    {
        $movie = new Movie($input, $this->genres->findByIds($input->genres));
        $this->movies->save($movie);

        return $this->json($movie, Response::HTTP_CREATED, context: ['groups' => ['movie:read']]);
    }

    #[Route('/{id}', name: 'movie_replace', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function replace(Movie $movie, #[MapRequestPayload] MovieInput $input): JsonResponse
    {
        $movie->replaceWith($input, $this->genres->findByIds($input->genres));
        $this->movies->save($movie);

        return $this->json($movie, context: ['groups' => ['movie:read']]);
    }

    #[Route('/{id}', name: 'movie_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function delete(Movie $movie): Response
    {
        $this->movies->remove($movie);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
