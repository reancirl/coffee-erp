<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SalesMonitoringController;
use App\Http\Controllers\FeedbackResponseController;
use App\Http\Controllers\KitchenQueueController;
use App\Http\Controllers\EventBookingController;
use App\Http\Controllers\EventPackageController;
use App\Http\Controllers\EventUnavailableDateController;
use App\Http\Controllers\PublicMenuController;
use App\Http\Controllers\CashRemittanceController;

Route::get('/', [EventBookingController::class, 'landing'])->name('home');
Route::get('/menu', [PublicMenuController::class, 'index'])->name('menu');
Route::get('/rewards', fn () => \Inertia\Inertia::render('rewards'))->name('rewards');
Route::post('/event-bookings/public', [EventBookingController::class, 'storePublic'])->name('event-bookings.public-store');
Route::get('/event-bookings/availability', [EventBookingController::class, 'availability'])->name('event-bookings.availability');

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
    
    // Inventory routes
    Route::middleware(['module.access:products'])->group(function () {
        Route::get('inventory', function () {
            return \Inertia\Inertia::render('inventory/index');
        })->name('inventory.index');
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
        Route::post('sales-monitoring/{salesMonitoring}/remittances', [CashRemittanceController::class, 'store'])->name('sales-monitoring.remittances.store');
        Route::patch('cash-remittances/{cashRemittance}/confirm', [CashRemittanceController::class, 'confirm'])->name('cash-remittances.confirm');
    });
    
    // Kitchen Queue routes
    Route::middleware(['module.access:pos'])->group(function () {
        Route::get('kitchen-queue', [KitchenQueueController::class, 'index'])->name('kitchen-queue.index');
        Route::get('kitchen-queue/data', [KitchenQueueController::class, 'getQueueData'])->name('kitchen-queue.data');
        Route::patch('kitchen-queue/{order}/complete', [KitchenQueueController::class, 'completeOrder'])->name('kitchen-queue.complete');
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

    // Event booking module
    Route::middleware(['module.access:event-booking'])->group(function () {
        Route::resource('event-packages', EventPackageController::class)->except(['show']);
        Route::resource('event-unavailable-dates', EventUnavailableDateController::class)->only(['index', 'store', 'destroy']);
        Route::resource('event-bookings', EventBookingController::class)->only(['index', 'create', 'store', 'edit', 'update']);
    });
    
    // Employee Management routes (Admin only)
    Route::middleware(['module.access:sales-monitoring'])->group(function () {
        Route::get('employees', function () {
            return \Inertia\Inertia::render('employees/index');
        })->name('employees.index');
        
        // Shift Management
        Route::get('/shifts', function () {
            return Inertia::render('shifts/index');
        })->name('shifts.index');

        // Supplier Performance
        Route::get('/supplier-performance', function () {
            return Inertia::render('supplier-performance/index');
        })->name('supplier-performance.index');
    });

    // Product Management routes (includes supplier/PO management)
    Route::middleware(['module.access:products'])->group(function () {
        // Supplier Management
        Route::get('/suppliers', function () {
            return Inertia::render('suppliers/index');
        })->name('suppliers.index');

        // Purchase Orders
        Route::get('/purchase-orders', function () {
            return Inertia::render('purchase-orders/index');
        })->name('purchase-orders.index');

        // Receiving Orders
        Route::get('/receiving', function () {
            return Inertia::render('receiving/index');
        })->name('receiving.index');
    });
    
    // Time Clock routes (All employees)
    Route::middleware(['module.access:dashboard'])->group(function () {
        Route::get('time-clock', function () {
            return \Inertia\Inertia::render('time-clock/index');
        })->name('time-clock.index');
    });
});

// Public Feedback Survey Routes (no authentication required)
Route::get('/feedback/cafe-survey-x9k2m8p4q7w1n5z3/{token}', [FeedbackResponseController::class, 'show'])->name('feedback.survey');
Route::post('/feedback/submit', [FeedbackResponseController::class, 'store'])->name('feedback.submit');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
