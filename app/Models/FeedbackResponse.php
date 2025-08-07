<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackResponse extends Model
{
    protected $fillable = [
        'overall_experience',
        'enjoyed_most_least',
        'recommend_likelihood',
        'customer_name',
        'customer_email',
        'session_token',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'recommend_likelihood' => 'integer',
    ];
}
