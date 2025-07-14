<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // POS Routes
    Route::get('pos', [OrderController::class, 'index'])->name('pos');
    Route::get('pos/products', [\App\Http\Controllers\ProductController::class, 'getProductsForPOS'])->name('pos.products');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');

    // Customer routes
    Route::resource('customers', CustomerController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
