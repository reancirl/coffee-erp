<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Align stored type names with the ledger vocabulary: REDEEM / REVERSAL /
     * ADJUSTMENT. Renaming the label does not alter any amount, so balances
     * are unchanged.
     */
    public function up(): void
    {
        DB::table('allowance_transactions')->where('type', 'redemption')->update(['type' => 'redeem']);
        DB::table('allowance_transactions')->where('type', 'refund')->update(['type' => 'reversal']);
    }

    public function down(): void
    {
        DB::table('allowance_transactions')->where('type', 'redeem')->update(['type' => 'redemption']);
        DB::table('allowance_transactions')->where('type', 'reversal')->update(['type' => 'refund']);
    }
};
