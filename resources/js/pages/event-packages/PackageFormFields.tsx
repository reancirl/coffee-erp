import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export type ProductOption = {
    id: number;
    name: string;
    price?: number | string;
};

export type PackageFormPayload = {
    name: string;
    cup_count: number;
    price: string;
    description: string;
    notes: string;
    is_active: boolean;
    product_ids: number[];
};

export type PackageForm = ReturnType<typeof useForm<PackageFormPayload>>;

export type PackageWithProducts = {
    id: number;
    name: string;
    products?: ProductOption[];
};

const currency = (value: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(Number(value || 0));

export function PackageFields({
    form,
    products,
    productsInModal = false,
    copyPackages = [],
}: {
    form: PackageForm;
    products: ProductOption[];
    productsInModal?: boolean;
    copyPackages?: PackageWithProducts[];
}) {
    const selectedProductIds = form.data.product_ids || [];
    const hasProducts = selectedProductIds.length > 0;
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [copySourceId, setCopySourceId] = useState<string | undefined>(undefined);

    const filteredProducts = useMemo(() => {
        const term = search.toLowerCase();
        if (!term) return products;
        return products.filter((product) => product.name.toLowerCase().includes(term));
    }, [products, search]);

    const toggleProduct = (productId: number) => {
        const next = selectedProductIds.includes(productId)
            ? selectedProductIds.filter((id) => id !== productId)
            : [...selectedProductIds, productId];

        form.setData('product_ids', next);

        if (next.length === 0 && form.data.is_active) {
            form.setData('is_active', false);
        }
    };

    const applyCopyFromPackage = () => {
        if (!copySourceId) return;
        const pkg = copyPackages.find((p) => String(p.id) === copySourceId);
        if (!pkg) return;
        const ids = pkg.products?.map((p) => p.id) ?? [];
        form.setData('product_ids', ids);
        if (ids.length === 0 && form.data.is_active) {
            form.setData('is_active', false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Package name
                <input
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="50 Cup Cart"
                    required
                />
                {form.errors.name && <span className="text-xs text-red-600">{form.errors.name}</span>}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Cup count
                <input
                    type="number"
                    min={1}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.cup_count}
                    onChange={(e) => form.setData('cup_count', Number(e.target.value))}
                />
                {form.errors.cup_count && <span className="text-xs text-red-600">{form.errors.cup_count}</span>}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Price
                <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.price}
                    onChange={(e) => form.setData('price', e.target.value)}
                    placeholder="0.00"
                    required
                />
                {form.errors.price && <span className="text-xs text-red-600">{form.errors.price}</span>}
            </label>

            <AvailabilityToggle
                checked={form.data.is_active}
                onChange={(value) => form.setData('is_active', value)}
                label="Available on public form"
                helpText="Toggle visibility on the customer booking stepper."
                disabled={!hasProducts}
                disabledReason="Add at least one product to make this package public."
                error={form.errors.is_active}
            />

            <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
                Description
                <textarea
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder="What the package includes (beans, milk options, flavors, barista hours)"
                    rows={7}
                />
                {form.errors.description && <span className="text-xs text-red-600">{form.errors.description}</span>}
            </label>

            <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
                Internal notes
                <textarea
                    className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.data.notes}
                    onChange={(e) => form.setData('notes', e.target.value)}
                    placeholder="Any internal reminders"
                    rows={3}
                />
                {form.errors.notes && <span className="text-xs text-red-600">{form.errors.notes}</span>}
            </label>

            <div className="md:col-span-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">Products in this package</p>
                    <span className="text-xs text-gray-500">
                        {hasProducts ? `${selectedProductIds.length} selected` : 'Select at least one product'}
                    </span>
                </div>

                {copyPackages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                        <div className="text-xs font-medium text-gray-800">Copy products from:</div>
                        <Select onValueChange={setCopySourceId} value={copySourceId}>
                            <SelectTrigger className="w-56 text-sm">
                                <SelectValue placeholder="Choose a package" />
                            </SelectTrigger>
                            <SelectContent>
                                {copyPackages.map((pkg) => (
                                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                                        {pkg.name} {pkg.products?.length ? `(${pkg.products.length})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" size="sm" variant="outline" onClick={applyCopyFromPackage} disabled={!copySourceId}>
                            Copy products
                        </Button>
                    </div>
                )}
                {productsInModal ? (
                    <>
                        <div className="flex items-center gap-2">
                            <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Manage products
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Select products</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-4">
                                        <Input
                                            placeholder="Search products..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                            {filteredProducts.map((product) => renderProductRow(product, selectedProductIds, toggleProduct))}
                                            {filteredProducts.length === 0 && (
                                                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                                                    No products match your search.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setProductModalOpen(false)}>
                                            Done
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <div className="text-xs text-gray-600">
                                {hasProducts
                                    ? products
                                          .filter((p) => selectedProductIds.includes(p.id))
                                          .map((p) => p.name)
                                          .slice(0, 3)
                                          .join(', ') + (selectedProductIds.length > 3 ? '…' : '')
                                    : 'No products selected'}
                            </div>
                        </div>
                        {products.length === 0 && (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                                No products available. Create products first to assign them to packages.
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Input
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        {products.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                                No products available. Create products first to assign them to packages.
                            </div>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {filteredProducts.map((product) => renderProductRow(product, selectedProductIds, toggleProduct))}
                                {filteredProducts.length === 0 && (
                                    <div className="md:col-span-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                                        No products match your search.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                {form.errors.product_ids && <span className="text-xs text-red-600">{form.errors.product_ids}</span>}
            </div>
        </div>
    );
}

function renderProductRow(product: ProductOption, selectedIds: number[], toggle: (id: number) => void) {
    const isChecked = selectedIds.includes(product.id);
    return (
        <label
            key={product.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
        >
            <Checkbox checked={isChecked} onCheckedChange={() => toggle(product.id)} className="mt-0.5" />
            <div className="flex flex-col">
                <span className="font-semibold text-gray-900">{product.name}</span>
                {product.price !== undefined && <span className="text-xs text-gray-600">{currency(product.price)}</span>}
            </div>
        </label>
    );
}

function AvailabilityToggle({
    checked,
    onChange,
    label,
    helpText,
    disabled,
    disabledReason,
    error,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    helpText?: string;
    disabled?: boolean;
    disabledReason?: string;
    error?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                {helpText && <span className="text-xs text-gray-500">{helpText}</span>}
                {disabled && disabledReason && <span className="text-xs text-red-600">{disabledReason}</span>}
                {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-disabled={disabled}
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    onChange(!checked);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ${
                    disabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70'
                        : checked
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 bg-gray-200'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        checked ? 'translate-x-5' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}
