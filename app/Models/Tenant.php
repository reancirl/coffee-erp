<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }
}
