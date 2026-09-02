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
        'customizations',
        'allowance_eligible'
    ];
    
    protected $casts = [
        'prices' => 'json',
        'customizations' => 'json',
        'is_add_on' => 'boolean',
        'allowance_eligible' => 'boolean'
    ];
    
    /**
     * Get the category that owns the product.
     */
    public function categoryRelation()
    {
        return $this->belongsTo(Category::class, 'category');
    }

    /**
     * Whether this product may be paid for with the coffee allowance.
     *
     * The product's own column is an override; NULL means defer to the
     * category. A product with no category at all stays eligible, so
     * adding this never silently blocks anything that used to work.
     */
    public function allowanceEligible(): bool
    {
        if ($this->allowance_eligible !== null) {
            return $this->allowance_eligible;
        }

        return $this->categoryRelation?->allowance_eligible ?? true;
    }

    /**
     * The products among $ids that cannot be bought with the allowance.
     *
     * Unknown ids are ignored: they are not products, so there is nothing
     * to rule on, and the order's own validation deals with them.
     *
     * @param  array<int, mixed>  $ids
     * @return \Illuminate\Support\Collection<int, static>
     */
    public static function ineligibleForAllowance(array $ids): \Illuminate\Support\Collection
    {
        $ids = array_values(array_unique(array_filter($ids, 'is_numeric')));

        if ($ids === []) {
            return collect();
        }

        return static::with('categoryRelation')
            ->whereIn('id', $ids)
            ->get()
            ->reject(fn (self $product) => $product->allowanceEligible())
            ->values();
    }
}
