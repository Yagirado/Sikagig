<?php

namespace App\Exceptions;

use RuntimeException;

class GoogleAuthException extends RuntimeException
{
    public function __construct(public readonly string $reason = 'google_invalid')
    {
        parent::__construct($reason);
    }
}
