<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'description',
        'allowance_eligible'
    ];

    protected $casts = [
        'allowance_eligible' => 'boolean'
    ];

    /**
     * Mirrors the column default so a category built in memory answers the
     * same way as one read back from the database.
     */
    protected $attributes = [
        'allowance_eligible' => true
    ];
    
    /**
     * Get the products for the category.
     */
    public function products()
    {
        return $this->hasMany(Product::class, 'category');
    }
}
