<?php

// Run explicitly: php tests/Database/agreements.php
// Uses the configured MySQL server, but creates/drops only a uniquely named test database.
require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$connection = Illuminate\Support\Facades\DB::connection();
if ($connection->getDriverName() !== 'mysql') {
    throw new RuntimeException('This schema test requires MySQL 8.0.16+ with CHECK enabled.');
}
$pdo = $connection->getPdo();
$original = $connection->getDatabaseName();
$scratch = 'sikagig_agreement_test_'.bin2hex(random_bytes(8));
$created = false;
$failure = null;

function check(bool $condition, string $message): void
{
    if (! $condition) {
        throw new RuntimeException($message);
    }
}

function executeSql(PDO $pdo, string $file): void
{
    check(is_file($file), 'Missing SQL: '.$file);
    // These fixtures use one statement per semicolon/newline and no stored routines.
    $sql = preg_replace('/^\s*--.*$/m', '', file_get_contents($file));
    foreach (preg_split('/;[ \t]*(?:\r?\n|$)/', $sql) as $sqlStatement) {
        if (trim($sqlStatement) !== '') {
            $pdo->query($sqlStatement)->closeCursor();
        }
    }
}

function rejected(PDO $pdo, string $sql, int $expectedCode): void
{
    try {
        $pdo->exec($sql);
    } catch (PDOException $e) {
        check((int) $e->errorInfo[1] === $expectedCode, 'Unexpected database error: '.$e->getMessage());
        return;
    }
    throw new RuntimeException('Expected database to reject: '.$sql);
}

function verifyBooleans(PDO $pdo): void
{
    $pdo->exec("INSERT INTO users (email) VALUES ('default@example.test')");
    $values = $pdo->query("SELECT legal_agreement, privacy_agreement FROM users WHERE email = 'default@example.test'")->fetch(PDO::FETCH_NUM);
    check($values === [0, 0], 'Agreements must default to integer 0, got '.json_encode($values));
    foreach (['legal_agreement', 'privacy_agreement'] as $column) {
        rejected($pdo, "UPDATE users SET $column = NULL WHERE email = 'default@example.test'", 1048);
        foreach ([-1, 2] as $invalid) {
            rejected($pdo, "UPDATE users SET $column = $invalid WHERE email = 'default@example.test'", 3819);
        }
    }
    $pdo->exec("INSERT INTO users (email, NIM, fullName, phone, gender, tanggal_lahir)
        VALUES ('complete@example.test', '0123456789012', 'Test User', '08123456789', 'man', '2000-01-01')");
    foreach (['0, 0', '1, 0', '0, 1'] as $pair) {
        [$legal, $privacy] = explode(', ', $pair);
        rejected($pdo, "UPDATE users SET legal_agreement = $legal, privacy_agreement = $privacy,
            profile_completed_at = CURRENT_TIMESTAMP WHERE email = 'complete@example.test'", 3819);
    }
    $pdo->exec("UPDATE users SET legal_agreement = 1, privacy_agreement = 1,
        profile_completed_at = CURRENT_TIMESTAMP WHERE email = 'complete@example.test'");
    rejected($pdo, "UPDATE users SET fullName = ' ' WHERE email = 'complete@example.test'", 3819);
    rejected($pdo, "UPDATE users SET gender = 'other' WHERE email = 'complete@example.test'", 3819);
}

try {
    $pdo->exec("CREATE DATABASE `$scratch` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $created = true;
    $pdo->exec("USE `$scratch`");
    executeSql($pdo, dirname(__DIR__, 2).'/database/sikagig.sql');
    verifyBooleans($pdo);
    $fresh = $pdo->query('SHOW CREATE TABLE users')->fetch(PDO::FETCH_NUM)[1];
    echo "PASS fresh SQL: defaults, NOT NULL, 0/1 checks and complete-profile rules\n";

    foreach (['sessions', 'email_otps', 'google_accounts', 'users'] as $table) {
        $pdo->exec("DROP TABLE `$table`");
    }
    executeSql($pdo, __DIR__.'/fixtures/agreements-varchar.sql');
    $pdo->exec("INSERT INTO users (email, legal_agreement, privacy_agreement) VALUES
        ('neither@example.test', NULL, NULL),
        ('legal@example.test', 'accepted', NULL),
        ('privacy@example.test', NULL, 'accepted'),
        ('both@example.test', 'accepted', 'accepted')");
    $pdo->exec("UPDATE users SET NIM = '9999999999999', fullName = 'Existing User',
        phone = '08123456789', gender = 'woman', tanggal_lahir = '2000-01-01',
        profile_completed_at = '2026-01-01 00:00:00' WHERE id = 4");
    $pdo->exec("INSERT INTO google_accounts (user_id, google_sub) VALUES (4, 'test-sub')");
    $before = $pdo->query('SELECT id, email, fullName, profile_completed_at FROM users ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    executeSql($pdo, dirname(__DIR__, 2).'/database/upgrades/2026-09-09-agreements-boolean.sql');
    $after = $pdo->query('SELECT id, email, fullName, profile_completed_at FROM users ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    check($before === $after, 'Upgrade changed unrelated user data');
    $values = $pdo->query('SELECT legal_agreement, privacy_agreement FROM users ORDER BY id')->fetchAll(PDO::FETCH_NUM);
    check($values === [[0, 0], [1, 0], [0, 1], [1, 1]], 'Upgrade must preserve every consent combination');
    check((int) $pdo->query('SELECT user_id FROM google_accounts')->fetchColumn() === 4, 'Upgrade lost a linked account');
    verifyBooleans($pdo);
    $upgraded = $pdo->query('SHOW CREATE TABLE users')->fetch(PDO::FETCH_NUM)[1];
    // MySQL reserializes the existing ascii gender literals after ALTER TABLE.
    $normalize = static fn (string $ddl): string => str_replace(
        "_ascii'man',_ascii'woman'", "_utf8mb4'man',_utf8mb4'woman'",
        preg_replace('/ AUTO_INCREMENT=\d+/', '', $ddl),
    );
    check($normalize($fresh) === $normalize($upgraded), "Fresh and upgraded users schemas differ:\n".$normalize($fresh)."\n--- UPGRADED ---\n".$normalize($upgraded));
    echo "PASS upgrade SQL: existing consent/data/relations preserved; schema matches fresh import\n";
} catch (Throwable $e) {
    $failure = $e;
} finally {
    if ($created && preg_match('/^sikagig_agreement_test_[a-f0-9]{16}$/D', $scratch) && $scratch !== $original) {
        $pdo->exec('USE `'.str_replace('`', '``', $original).'`');
        $pdo->exec("DROP DATABASE `$scratch`");
    }
}
if ($failure !== null) {
    fwrite(STDERR, 'FAIL: '.$failure->getMessage().PHP_EOL);
    exit(1);
}
