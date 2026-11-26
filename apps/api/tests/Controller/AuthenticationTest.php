<?php

namespace App\Tests\Controller;

use App\Tests\Support\ApiTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class AuthenticationTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->actAsAnonymous();
    }

    public function testRegistersUserWithoutExposingPassword(): void
    {
        $user = $this->requestJson('POST', '/register', ['email' => 'alice@prime.local', 'password' => 'motdepasse']);

        self::assertResponseStatusCodeSame(201);
        self::assertIsInt($user['id']);
        self::assertSame(['id' => $user['id'], 'email' => 'alice@prime.local', 'roles' => ['ROLE_USER']], $user);
    }

    public function testRegistrationIgnoresRequestedRoles(): void
    {
        $user = $this->requestJson('POST', '/register', ['email' => 'alice@prime.local', 'password' => 'motdepasse', 'roles' => ['ROLE_ADMIN']]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['ROLE_USER'], $user['roles']);
    }

    public function testRegistrationWithEmailAlreadyTakenIgnoringCaseReturns409(): void
    {
        $this->requestJson('POST', '/register', ['email' => 'alice@prime.local', 'password' => 'motdepasse']);

        $this->requestJson('POST', '/register', ['email' => 'ALICE@prime.local', 'password' => 'motdepasse']);

        self::assertResponseStatusCodeSame(409);
    }

    /**
     * @return iterable<string, array{array<string, string>, string}>
     */
    public static function invalidRegistrationProvider(): iterable
    {
        yield 'invalid email' => [['email' => 'pas-un-email', 'password' => 'motdepasse'], 'email'];
        yield 'blank email' => [['email' => '', 'password' => 'motdepasse'], 'email'];
        yield 'password of seven characters' => [['email' => 'alice@prime.local', 'password' => '1234567'], 'password'];
    }

    /**
     * @param array<string, string> $payload
     */
    #[DataProvider('invalidRegistrationProvider')]
    public function testRejectsInvalidRegistration(array $payload, string $field): void
    {
        $error = $this->requestJson('POST', '/register', $payload);

        self::assertResponseStatusCodeSame(422);
        self::assertContains($field, self::violatedPaths($error));
    }

    public function testAcceptsPasswordOfEightCharacters(): void
    {
        $this->requestJson('POST', '/register', ['email' => 'alice@prime.local', 'password' => '12345678']);

        self::assertResponseStatusCodeSame(201);
    }

    public function testRegisteredUserCanLogInAndSeeTheirAccount(): void
    {
        $registered = $this->requestJson('POST', '/register', ['email' => 'alice@prime.local', 'password' => 'motdepasse']);

        $login = $this->requestJson('POST', '/api/login', ['email' => 'alice@prime.local', 'password' => 'motdepasse']);
        self::assertResponseIsSuccessful();
        self::assertIsString($login['token']);

        $this->useToken($login['token']);
        $me = $this->requestJson('GET', '/me');

        self::assertResponseIsSuccessful();
        self::assertSame($registered, $me);
    }

    /**
     * @return iterable<string, array{array<string, string>}>
     */
    public static function wrongCredentialsProvider(): iterable
    {
        yield 'wrong password' => [['email' => 'admin@prime.local', 'password' => 'mauvais-mot-de-passe']];
        yield 'unknown email' => [['email' => 'inconnu@prime.local', 'password' => self::PASSWORD]];
    }

    /**
     * @param array<string, string> $credentials
     */
    #[DataProvider('wrongCredentialsProvider')]
    public function testLoginWithWrongCredentialsReturns401(array $credentials): void
    {
        $response = $this->requestJson('POST', '/api/login', $credentials);

        self::assertResponseStatusCodeSame(401);
        self::assertArrayNotHasKey('token', $response ?? []);
    }

    public function testAccountRequiresAuthentication(): void
    {
        $this->requestJson('GET', '/me');

        self::assertResponseStatusCodeSame(401);
    }

    public function testInvalidTokenIsRejected(): void
    {
        $this->useToken('jeton-invalide');

        $this->requestJson('GET', '/me');

        self::assertResponseStatusCodeSame(401);
    }
}
