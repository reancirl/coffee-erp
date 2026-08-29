<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'allowance_user_id',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'payment_status',
        'status',
        'notes',
        'order_type',
        'beeper_number',
        'split_cash_amount',
        'split_gcash_amount'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'split_cash_amount' => 'decimal:2',
        'split_gcash_amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * The cashier who processed this order. Null for orders created before
     * cashier attribution existed.
     */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The employee whose allowance paid for this order, if any.
     */
    public function allowanceEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'allowance_user_id');
    }

    /**
     * The order's payment method, or null if it is not one the app knows.
     */
    public function paymentMethod(): ?PaymentMethod
    {
        return PaymentMethod::tryFromLabel($this->payment_method);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            // Generate a simple incremental order number if not set.
            // Keyed off the highest id, not the newest created_at: orders
            // written within the same second tie on created_at and used to
            // hand out a duplicate number, violating the unique index.
            if (empty($order->order_number)) {
                $orderNumber = ((int) static::max('id')) + 1;
                $order->order_number = 'ORD-' . str_pad($orderNumber, 5, '0', STR_PAD_LEFT);
            }
        });
    }
}
