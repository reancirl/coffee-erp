<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'payment_status',
        'status',
        'notes'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            // Generate a simple incremental order number if not set
            if (empty($order->order_number)) {
                $latestOrder = static::latest()->first();
                $orderNumber = $latestOrder ? ($latestOrder->id + 1) : 1;
                $order->order_number = 'ORD-' . str_pad($orderNumber, 5, '0', STR_PAD_LEFT);
            }
        });
    }
}
