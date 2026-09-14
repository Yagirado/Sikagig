<?php

namespace App\Services;

use App\Exceptions\GoogleAuthException;
use App\Models\GoogleAccount;
use App\Models\User;

class GoogleAccounts
{
    public function resolve(array $identity): array
    {
        $linked = GoogleAccount::where('google_sub', $identity['sub'])->first();
        if ($linked) {
            return ['user' => $linked->user, 'target_user_id' => null];
        }
        $user = User::where('email', $identity['email'])->lockForUpdate()->first();
        if (! $user) {
            return ['user' => null, 'target_user_id' => null];
        }
        if (strtolower($user->email) !== $identity['email']) {
            throw new GoogleAuthException('google_conflict');
        }
        $this->assertAvailable($user, $identity['sub']);
        if (! $identity['email_proven']) {
            return ['user' => null, 'target_user_id' => $user->id];
        }

        return ['user' => $this->link($user, $identity['sub']), 'target_user_id' => null];
    }

    public function link(User $user, string $sub): User
    {
        $this->assertAvailable($user, $sub);
        $link = GoogleAccount::firstOrCreate(['user_id' => $user->id], ['google_sub' => $sub]);
        if ($link->google_sub !== $sub) {
            throw new GoogleAuthException('google_conflict');
        }
        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $user;
    }

    private function assertAvailable(User $user, string $sub): void
    {
        $byUser = GoogleAccount::where('user_id', $user->id)->first();
        $bySub = GoogleAccount::where('google_sub', $sub)->first();
        if (($byUser && $byUser->google_sub !== $sub) || ($bySub && $bySub->user_id !== $user->id)) {
            throw new GoogleAuthException('google_conflict');
        }
    }
}
