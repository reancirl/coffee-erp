<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // POS Routes
    Route::get('pos', [OrderController::class, 'pos'])->name('pos');
    Route::get('pos/products', [\App\Http\Controllers\ProductController::class, 'getProductsForPOS'])->name('pos.products');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');

    // Customer routes
    Route::resource('customers', CustomerController::class);
    
    // Orders routes - only for viewing (no create/edit)
    Route::resource('orders', OrderController::class)->except(['create', 'edit']);
    Route::patch('orders/{order}/void', [OrderController::class, 'voidOrder'])->name('orders.void');
    
    // Reports routes
    Route::get('reports/z-report', [\App\Http\Controllers\ReportController::class, 'showZReportForm'])->name('reports.z-report');
    Route::get('reports/z-report/generate', [\App\Http\Controllers\ReportController::class, 'generateZReport'])->name('reports.z-report.generate');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
