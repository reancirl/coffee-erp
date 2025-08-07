<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SalesMonitoringController;
use App\Http\Controllers\FeedbackResponseController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard - accessible to all authenticated users
    Route::middleware(['module.access:dashboard'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });

    // POS Routes
    Route::middleware(['module.access:pos'])->group(function () {
        Route::get('pos', [OrderController::class, 'pos'])->name('pos');
        Route::get('pos/products', [\App\Http\Controllers\ProductController::class, 'getProductsForPOS'])->name('pos.products');
        Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    });

    // Customer routes
    Route::middleware(['module.access:customers'])->group(function () {
        Route::resource('customers', CustomerController::class);
    });
    
    // Category routes
    Route::middleware(['module.access:categories'])->group(function () {
        Route::resource('categories', \App\Http\Controllers\CategoryController::class);
    });
    
    // Product routes
    Route::middleware(['module.access:products'])->group(function () {
        Route::resource('products', \App\Http\Controllers\ProductController::class);
    });
    
    // Orders routes - only for viewing (no create/edit)
    Route::middleware(['module.access:orders'])->group(function () {
        Route::resource('orders', OrderController::class)->except(['create', 'edit']);
        Route::patch('orders/{order}/void', [OrderController::class, 'voidOrder'])->name('orders.void');
        Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    });
    
    // Reports routes
    Route::middleware(['module.access:reports'])->group(function () {
        Route::get('reports/z-report', [\App\Http\Controllers\ReportController::class, 'showZReportForm'])->name('reports.z-report');
        Route::get('reports/z-report/generate', [\App\Http\Controllers\ReportController::class, 'generateZReport'])->name('reports.z-report.generate');
    });
    
    // Cash Monitoring routes
    Route::middleware(['module.access:sales-monitoring'])->group(function () {
        Route::get('sales-monitoring', [SalesMonitoringController::class, 'index'])->name('sales-monitoring.index');
        Route::post('sales-monitoring', [SalesMonitoringController::class, 'store'])->name('sales-monitoring.store');
        Route::patch('sales-monitoring/{salesMonitoring}/cash-flow', [SalesMonitoringController::class, 'updateCashFlow'])->name('sales-monitoring.cash-flow');
        Route::patch('sales-monitoring/{salesMonitoring}/close', [SalesMonitoringController::class, 'close'])->name('sales-monitoring.close');
    });
    
    // Role Management routes (Admin only)
    Route::middleware(['module.access:dashboard'])->group(function () {
        Route::resource('roles', \App\Http\Controllers\RoleController::class);
        
        // User Role Assignment routes
        Route::get('user-roles', [\App\Http\Controllers\UserRoleController::class, 'index'])->name('user-roles.index');
        Route::get('user-roles/{user}/edit', [\App\Http\Controllers\UserRoleController::class, 'edit'])->name('user-roles.edit');
        Route::patch('user-roles/{user}', [\App\Http\Controllers\UserRoleController::class, 'update'])->name('user-roles.update');
        Route::post('user-roles/{user}/assign-role', [\App\Http\Controllers\UserRoleController::class, 'assignRole'])->name('user-roles.assign-role');
        Route::delete('user-roles/{user}/remove-role', [\App\Http\Controllers\UserRoleController::class, 'removeRole'])->name('user-roles.remove-role');
    });
});

// Public Feedback Survey Routes (no authentication required)
Route::get('/feedback/cafe-survey-x9k2m8p4q7w1n5z3/{token}', [FeedbackResponseController::class, 'show'])->name('feedback.survey');
Route::post('/feedback/submit', [FeedbackResponseController::class, 'store'])->name('feedback.submit');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
