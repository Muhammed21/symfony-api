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
use App\Repository\ReviewRepository;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[Route('/movies')]
final class MovieController extends AbstractController
{
    public function __construct(
        private readonly MovieRepository $movies,
        private readonly GenreRepository $genres,
        private readonly ReviewRepository $reviews,
        private readonly NormalizerInterface $normalizer,
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
        return $this->detail($movie);
    }

    #[Route('', name: 'movie_create', methods: ['POST'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function create(#[MapRequestPayload] MovieInput $input): JsonResponse
    {
        $movie = new Movie($input, $this->genres->findByIds($input->genres));
        $this->movies->save($movie);

        return $this->detail($movie, Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'movie_replace', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function replace(Movie $movie, #[MapRequestPayload] MovieInput $input): JsonResponse
    {
        $movie->replaceWith($input, $this->genres->findByIds($input->genres));
        $this->movies->save($movie);

        return $this->detail($movie);
    }

    #[Route('/{id}', name: 'movie_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function delete(Movie $movie): Response
    {
        $this->movies->remove($movie);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/similar/{otherId}', name: 'movie_link_similar', requirements: ['id' => '\d+', 'otherId' => '\d+'], methods: ['PUT'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function linkSimilar(Movie $movie, #[MapEntity(id: 'otherId')] Movie $other): Response
    {
        try {
            $movie->addSimilarMovie($other);
        } catch (\DomainException $exception) {
            throw new UnprocessableEntityHttpException($exception->getMessage(), $exception);
        }

        $this->movies->save($movie);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/similar/{otherId}', name: 'movie_unlink_similar', requirements: ['id' => '\d+', 'otherId' => '\d+'], methods: ['DELETE'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function unlinkSimilar(Movie $movie, #[MapEntity(id: 'otherId')] Movie $other): Response
    {
        $movie->removeSimilarMovie($other);
        $this->movies->save($movie);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    private function detail(Movie $movie, int $status = Response::HTTP_OK): JsonResponse
    {
        $ratings = $this->reviews->summarizeRatings($movie);

        return $this->json([
            ...$this->normalizer->normalize($movie, 'json', ['groups' => ['movie:read']]),
            'averageRating' => $ratings->averageRating,
            'reviewCount' => $ratings->reviewCount,
        ], $status);
    }
}
