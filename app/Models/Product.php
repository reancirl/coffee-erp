<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name',
        'price',
        'category',
        'prices',
        'is_add_on',
        'customizations'
    ];
    
    protected $casts = [
        'prices' => 'json',
        'customizations' => 'json',
        'is_add_on' => 'boolean'
    ];
}
