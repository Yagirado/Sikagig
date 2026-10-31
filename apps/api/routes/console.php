<?php

use App\Models\PendingRegistration;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('registrations:prune', function () {
    $count = PendingRegistration::where('expires_at', '<=', now())->delete();
    $this->info("Deleted {$count} expired registration drafts.");
})->purpose('Delete expired registration forms and their OTPs');

Schedule::command('registrations:prune')->everyTenMinutes()->withoutOverlapping();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
