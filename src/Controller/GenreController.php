<?php

namespace App\Controller;

use App\Dto\GenreInput;
use App\Entity\Genre;
use App\Entity\User;
use App\Model\PaginationDTO;
use App\Model\Paginator;
use App\Repository\GenreRepository;
use App\Validator\UniqueGenreName;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/genres')]
final class GenreController extends AbstractController
{
    public function __construct(
        private readonly GenreRepository $genres,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'genre_list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_UNPROCESSABLE_ENTITY)]
        PaginationDTO $pagination = new PaginationDTO(),
    ): JsonResponse {
        $page = (new Paginator())->paginate($this->genres->createSortedQuery(), $pagination);

        return $this->json($page, context: ['groups' => ['paginate', 'genre:read']]);
    }

    #[Route('/{id}', name: 'genre_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(Genre $genre): JsonResponse
    {
        return $this->json($genre, context: ['groups' => ['genre:read']]);
    }

    #[Route('', name: 'genre_create', methods: ['POST'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function create(#[MapRequestPayload] GenreInput $input): JsonResponse
    {
        $this->assertNameIsAvailable($input);

        $genre = new Genre($input->name);
        $this->genres->save($genre);

        return $this->json($genre, Response::HTTP_CREATED, context: ['groups' => ['genre:read']]);
    }

    #[Route('/{id}', name: 'genre_rename', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function rename(Genre $genre, #[MapRequestPayload] GenreInput $input): JsonResponse
    {
        $this->assertNameIsAvailable($input, $genre);

        $genre->rename($input->name);
        $this->genres->save($genre);

        return $this->json($genre, context: ['groups' => ['genre:read']]);
    }

    #[Route('/{id}', name: 'genre_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function delete(Genre $genre): Response
    {
        $this->genres->remove($genre);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    private function assertNameIsAvailable(GenreInput $input, ?Genre $renamed = null): void
    {
        $violations = $this->validator->validate($input->name, new UniqueGenreName(exceptGenreId: $renamed?->getId()));

        if (0 === count($violations)) {
            return;
        }

        throw new UnprocessableEntityHttpException((string) $violations->get(0)->getMessage(), new ValidationFailedException($input, $violations));
    }
}
