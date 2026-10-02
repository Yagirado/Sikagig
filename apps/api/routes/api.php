<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\DuitkuController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\GigController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\JasaController;
use App\Http\Controllers\JasaOrderController;
use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EscrowController;

Route::prefix('auth')->middleware('web')->group(function () {
    Route::get('/google/redirect', [GoogleAuthController::class, 'redirect'])->block(60, 20);
    Route::get('/google/register/redirect', [GoogleAuthController::class, 'registerRedirect'])->block(60, 20);
    Route::get('/google/callback', [GoogleAuthController::class, 'callback'])->block(60, 20);
    Route::get('/google/profile/redirect', [GoogleAuthController::class, 'profileRedirect'])->block(60, 20);
    Route::get('/google/profile/callback', [GoogleAuthController::class, 'callback'])->block(60, 20);
    Route::get('/google/draft', [GoogleAuthController::class, 'draft']);
    Route::post('/google/register', [GoogleAuthController::class, 'register'])->block(60, 20);
    Route::post('/google/email/request-otp', [GoogleAuthController::class, 'sendEmailOtp'])
        ->middleware('throttle:10,1,otp-send')->block(60, 20);
    Route::post('/google/email/verify-otp', [GoogleAuthController::class, 'verifyEmailOtp'])
        ->middleware('throttle:30,1,otp-verify')->block(60, 20);
    Route::get('/csrf-token', [OtpAuthController::class, 'csrfToken']);
    Route::post('/register/request-otp', [RegistrationController::class, 'send'])
        ->middleware('throttle:10,1,otp-send');
    Route::post('/register/verify-otp', [RegistrationController::class, 'verify'])
        ->middleware('throttle:30,1,otp-verify');
    Route::post('/request-otp', [OtpAuthController::class, 'send'])
        ->middleware('throttle:10,1,otp-send');
    Route::post('/verify-otp', [OtpAuthController::class, 'verify'])
        ->middleware('throttle:30,1,otp-verify');
    Route::get('/me', [OtpAuthController::class, 'me'])->middleware('auth:web');
    Route::post('/logout', [OtpAuthController::class, 'logout'])->middleware('auth:web');
});

Route::post('/payments/duitku/callback', [DuitkuController::class, 'callback']);

// RUTE GIG DAN JASA
Route::middleware(['web', 'auth:web'])->group(function () {
    Route::get('/payments/duitku/methods', [DuitkuController::class, 'paymentMethods']);
    Route::post('/payments/duitku/topups', [DuitkuController::class, 'createTopup']);
    Route::get('/payments/duitku/topups', [DuitkuController::class, 'topupHistory']);
    Route::get(
        '/payments/duitku/topups/{merchantOrderId}',
        [DuitkuController::class, 'topupStatus']
    );
    Route::get('/wallet', function (Request $request) {
        return response()->json([
            'balance' => $request->user()->wallet?->balance ?? 0,
        ]);
    });
    Route::get('/escrows', [EscrowController::class, 'myEscrows']);
    Route::get('/escrows/{escrow}', [EscrowController::class, 'show']);
    Route::post(
        '/escrows/{escrow}/pay/wallet',
        [EscrowController::class, 'payWithWallet']
    );
    Route::post(
        '/escrows/{escrow}/release',
        [EscrowController::class, 'release']
    );
    Route::get('/gigs', [GigController::class, 'index']);
    Route::post('/gigs', [GigController::class, 'store']);
    Route::get('/gigs/{id}', [GigController::class, 'show']);
    Route::get('/my-gigs', [GigController::class, 'myGigs']);
    Route::put('/gigs/{id}', [GigController::class, 'update']);
    Route::patch('/gigs/{id}/toggle-status', [GigController::class, 'toggleStatus']);
    Route::delete('/gigs/{id}', [GigController::class, 'destroy']);

    Route::get('/jasas', [JasaController::class, 'index']);
    Route::post('/jasas', [JasaController::class, 'store']);
    Route::get('/jasas/{id}', [JasaController::class, 'show']);
    Route::get('/my-jasas', [JasaController::class, 'myJasas']);
    Route::put('/jasas/{id}', [JasaController::class, 'update']);
    Route::patch('/jasas/{id}/toggle-status', [JasaController::class, 'toggleStatus']);
    Route::delete('/jasas/{id}', [JasaController::class, 'destroy']);

    // RUTE PROPOSAL GIG
    Route::post('/gigs/{id}/proposals', [ProposalController::class, 'store']);
    Route::get('/my-proposals', [ProposalController::class, 'myProposals']);
    Route::get('/gigs/{id}/proposals', [ProposalController::class, 'gigProposals']);
    Route::put('/proposals/{id}', [ProposalController::class, 'update']);
    Route::delete('/proposals/{id}/withdraw', [ProposalController::class, 'withdraw']);
    Route::patch('/proposals/{id}/accept', [ProposalController::class, 'accept']);
    Route::patch('/proposals/{id}/reject', [ProposalController::class, 'reject']);
    Route::patch('/proposals/{id}/progress', [ProposalController::class, 'updateProgress']);
    Route::post('/proposals/{id}/submit-proof', [ProposalController::class, 'submitProof']);
    Route::patch('/proposals/{id}/approve', [ProposalController::class, 'approveSubmission']);

    // RUTE ORDER JASA
    Route::post('/jasas/{id}/orders', [JasaOrderController::class, 'store']);
    Route::get('/my-orders', [JasaOrderController::class, 'myOrders']);
    Route::get('/my-received-orders', [JasaOrderController::class, 'receivedOrders']);
    Route::get('/jasas/{id}/orders', [JasaOrderController::class, 'jasaOrders']);
    Route::put('/orders/{id}/brief', [JasaOrderController::class, 'updateBrief']);
    Route::delete('/orders/{id}/cancel', [JasaOrderController::class, 'cancelOrder']);
    Route::patch('/orders/{id}/progress', [JasaOrderController::class, 'updateProgress']);
    Route::post('/orders/{id}/submit-proof', [JasaOrderController::class, 'submitProof']);
    Route::patch('/orders/{id}/approve', [JasaOrderController::class, 'approveSubmission']);

    // RUTE FAVORIT
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::get('/favorites/status', [FavoriteController::class, 'status']);
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);
    Route::get('/notifications', function (Request $request) {
        return response()->json([
            'success' => true,
            'notifications' => $request->user()
                ->notifications()
                ->latest()
                ->limit(30)
                ->get(),
            'unread_count' => $request->user()
                ->unreadNotifications()
                ->count(),
        ]);
    });

    Route::patch('/notifications/{notification}/read', function (
        Request $request,
        DatabaseNotification $notification
    ) {
        abort_unless($notification->notifiable_id === $request->user()->id, 403);
        $notification->markAsRead();

        return response()->json(['success' => true]);
    });

    Route::get('/conversations', [ChatController::class, 'index']);
    Route::get('/conversations/{conversation}/messages',[ChatController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages',[ChatController::class, 'store'])
        ->middleware('throttle:60,1');
    Route::patch('/orders/{order}/accept',[JasaOrderController::class, 'accept']);

});
