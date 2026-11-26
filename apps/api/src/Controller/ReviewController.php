<?php

namespace App\Controller;

use App\Dto\ReviewInput;
use App\Entity\Movie;
use App\Entity\Review;
use App\Entity\User;
use App\Model\PaginationDTO;
use App\Model\Paginator;
use App\Repository\ReviewRepository;
use App\Security\ReviewVoter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class ReviewController extends AbstractController
{
    public function __construct(private readonly ReviewRepository $reviews)
    {
    }

    #[Route('/movies/{id}/reviews', name: 'review_list', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function list(
        Movie $movie,
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)]
        PaginationDTO $pagination = new PaginationDTO(),
    ): JsonResponse {
        $page = (new Paginator())->paginate($this->reviews->createNewestFirstQuery($movie), $pagination);

        return $this->json($page, context: ['groups' => ['paginate', 'review:read']]);
    }

    #[Route('/movies/{id}/reviews', name: 'review_create', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED')]
    public function create(Movie $movie, #[CurrentUser] User $author, #[MapRequestPayload] ReviewInput $input): JsonResponse
    {
        if ($this->reviews->hasReviewed($author, $movie)) {
            throw new ConflictHttpException('Vous avez déjà donné votre avis sur ce film : modifiez-le plutôt.');
        }

        $review = new Review($author, $movie, $input);
        $this->reviews->save($review);

        return $this->json($review, Response::HTTP_CREATED, context: ['groups' => ['review:read']]);
    }

    #[Route('/reviews/{id}', name: 'review_edit', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted(ReviewVoter::EDIT, subject: 'review')]
    public function edit(Review $review, #[MapRequestPayload] ReviewInput $input): JsonResponse
    {
        $review->replaceWith($input);
        $this->reviews->save($review);

        return $this->json($review, context: ['groups' => ['review:read']]);
    }

    #[Route('/reviews/{id}', name: 'review_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted(ReviewVoter::DELETE, subject: 'review')]
    public function delete(Review $review): Response
    {
        $this->reviews->remove($review);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
