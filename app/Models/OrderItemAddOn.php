<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemAddOn extends Model
{
    protected $fillable = [
        'order_item_id',
        'product_id',
        'product_name',
        'quantity',
        'price',
        'variant',
        'customizations'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'customizations' => 'array',
    ];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
