<?php

namespace Tests\Feature\Allowance;

use App\Enums\PaymentMethod;
use App\Models\AllowanceTransaction;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Support\Allowance;
use App\Support\EmployeeQr;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Task 9.1 — the allowance buys drinks, not retail beans or merchandise.
 *
 * Eligibility lives on the category and can be overridden per product. The
 * rule is enforced by the order endpoint, because the POS is working from a
 * cached menu and cannot be the authority on it.
 */
class ProductEligibilityTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;

    private User $juan;

    private string $token;

    private Category $drinks;

    private Category $merch;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->cashier = User::factory()->create(['name' => 'Maria']);
        $this->juan = User::factory()->create(['name' => 'Juan Dela Cruz', 'allowance_eligible' => true]);
        $this->grantAllowanceRole($this->juan);
        $this->juan->assignEmployeeCode();
        $this->juan->refresh();
        $this->token = EmployeeQr::issueFor($this->juan)->token;

        $this->drinks = Category::create(['name' => 'Coffee']);
        $this->merch = Category::create(['name' => 'Merchandise', 'allowance_eligible' => false]);
    }

    private function product(string $name, Category $category, ?bool $override = null): Product
    {
        return Product::create([
            'name' => $name,
            'price' => 120,
            'category' => $category->id,
            'allowance_eligible' => $override,
        ]);
    }

    /** @param  array<int, Product>  $products */
    private function buyWithAllowance(array $products, array $addOns = [])
    {
        $items = [];

        foreach ($products as $product) {
            $item = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => 1,
                'price' => 120,
            ];

            foreach ($addOns as $addOn) {
                $item['add_ons'][] = [
                    'product_id' => $addOn->id,
                    'product_name' => $addOn->name,
                    'price' => 30,
                    'quantity' => 1,
                ];
            }

            $items[] = $item;
        }

        return $this->actingAs($this->cashier)->from('/pos')->post('/orders', [
            'payment_method' => PaymentMethod::EmployeeAllowance->value,
            'employee_qr_token' => $this->token,
            'order_type' => 'dine-in',
            'items' => $items,
        ]);
    }

    // ---------- the default ----------

    public function test_everything_is_eligible_until_someone_says_otherwise(): void
    {
        $this->buyWithAllowance([$this->product('Americano', $this->drinks)])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Order::count());
    }

    public function test_a_product_with_no_category_stays_eligible(): void
    {
        $orphan = Product::create(['name' => 'Mystery Item', 'price' => 120]);

        $this->buyWithAllowance([$orphan])->assertSessionHasNoErrors();
    }

    // ---------- the rule ----------

    public function test_a_category_can_be_taken_off_the_allowance(): void
    {
        $this->buyWithAllowance([$this->product('Tote Bag', $this->merch)])
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
        $this->assertSame(0, AllowanceTransaction::count());
    }

    public function test_the_refusal_names_what_is_wrong(): void
    {
        $this->buyWithAllowance([$this->product('Tote Bag', $this->merch)]);

        $this->assertStringContainsString(
            'Tote Bag',
            session('errors')->first('payment'),
        );
    }

    public function test_one_product_can_opt_back_in(): void
    {
        // House blend by the cup, sold under merchandise.
        $this->buyWithAllowance([$this->product('Cup of the Day', $this->merch, true)])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Order::count());
    }

    public function test_one_product_can_opt_out_of_an_eligible_category(): void
    {
        $this->buyWithAllowance([$this->product('Reserve Pour-Over', $this->drinks, false)])
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_an_ineligible_add_on_blocks_an_eligible_drink(): void
    {
        // An add-on is a product too, so it has to be checked as well.
        $latte = $this->product('Latte', $this->drinks);
        $bottledSyrup = $this->product('Bottled Syrup', $this->merch);

        $this->buyWithAllowance([$latte], [$bottledSyrup])
            ->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
    }

    public function test_a_mixed_order_is_refused_whole(): void
    {
        $this->buyWithAllowance([
            $this->product('Americano', $this->drinks),
            $this->product('Tote Bag', $this->merch),
        ])->assertSessionHasErrors('payment');

        $this->assertSame(0, Order::count());
        $this->assertEqualsWithDelta(
            1000,
            Allowance::balanceFor($this->juan)['remaining'],
            0.001,
        );
    }

    // ---------- everything else is untouched ----------

    public function test_the_rule_only_applies_to_allowance_payments(): void
    {
        $tote = $this->product('Tote Bag', $this->merch);

        $this->actingAs($this->cashier)->from('/pos')->post('/orders', [
            'payment_method' => PaymentMethod::Cash->value,
            'order_type' => 'dine-in',
            'items' => [[
                'product_id' => $tote->id,
                'product_name' => $tote->name,
                'quantity' => 1,
                'price' => 120,
            ]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, Order::count());
    }

    // ---------- what the POS is told ----------

    public function test_the_pos_menu_resolves_eligibility_for_each_product(): void
    {
        $this->product('Americano', $this->drinks);
        $this->product('Tote Bag', $this->merch);
        $this->product('Cup of the Day', $this->merch, true);

        $menu = $this->actingAs($this->cashier)
            ->getJson('/pos/products')
            ->assertOk()
            ->json('menuData');

        $this->assertTrue(collect($menu['Coffee'])->firstWhere('name', 'Americano')['allowance_eligible']);
        $this->assertFalse(collect($menu['Merchandise'])->firstWhere('name', 'Tote Bag')['allowance_eligible']);
        $this->assertTrue(collect($menu['Merchandise'])->firstWhere('name', 'Cup of the Day')['allowance_eligible']);
    }

    public function test_changing_a_category_does_not_leave_a_stale_menu_behind(): void
    {
        $this->product('Americano', $this->drinks);

        $this->actingAs($this->cashier)->getJson('/pos/products')->assertOk();

        $this->actingAs($this->cashier)->put('/categories/'.$this->drinks->id, [
            'name' => 'Coffee',
            'allowance_eligible' => false,
        ])->assertSessionHasNoErrors();

        $menu = $this->actingAs($this->cashier)->getJson('/pos/products')->json('menuData');

        $this->assertFalse(collect($menu['Coffee'])->firstWhere('name', 'Americano')['allowance_eligible']);
    }
}
