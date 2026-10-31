<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->string('submission_status')->default('not_submitted')->after('progress_notes');
            $table->string('proof_file')->nullable()->after('submission_status');
            $table->string('proof_link')->nullable()->after('proof_file');
            $table->text('proof_notes')->nullable()->after('proof_link');
            $table->string('student_name')->nullable()->after('proof_notes');
            $table->string('student_nim')->nullable()->after('student_name');
            $table->string('student_phone')->nullable()->after('student_nim');
            $table->timestamp('submitted_at')->nullable()->after('student_phone');
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn([
                'submission_status',
                'proof_file',
                'proof_link',
                'proof_notes',
                'student_name',
                'student_nim',
                'student_phone',
                'submitted_at',
            ]);
        });
    }
};
