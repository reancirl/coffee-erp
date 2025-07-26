import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';

interface Category {
    id: number;
    name: string;
    description?: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    category?: number;
    prices?: {
        hot?: number;
        iced?: number;
    };
    is_add_on: boolean;
    customizations?: Array<{
        name: string;
        options: string[];
        required: boolean;
    }>;
}

interface Props {
    product?: Product;
    categories: Category[];
}

type ProductForm = {
    name: string;
    price: number;
    category: string;
    prices: {
        hot: number | null;
        iced: number | null;
    };
    is_add_on: boolean;
    customizations: Array<{
        name: string;
        options: string[];
        required: boolean;
    }>;
};

export default function Form({ product, categories }: Props) {
    const isEditing = !!product;
    const [hasVariantPricing, setHasVariantPricing] = useState(
        !!(product?.prices?.hot || product?.prices?.iced)
    );

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products',
            href: '/products',
        },
        {
            title: isEditing ? 'Edit Product' : 'Create Product',
            href: isEditing ? `/products/${product.id}/edit` : '/products/create',
        },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm<ProductForm>({
        name: product?.name || '',
        price: product?.price || 0,
        category: product?.category?.toString() || 'none',
        prices: {
            hot: product?.prices?.hot || null,
            iced: product?.prices?.iced || null,
        },
        is_add_on: product?.is_add_on || false,
        customizations: (product?.customizations || []).map(customization => ({
            ...customization,
            options: Array.isArray(customization.options) ? customization.options : []
        })),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const submitData = {
            ...data,
            category: data.category === 'none' ? null : data.category,
            prices: hasVariantPricing ? data.prices : null,
        };

        if (isEditing) {
            put(route('products.update', product.id), {
                onSuccess: () => reset(),
            });
        } else {
            post(route('products.store'), {
                onSuccess: () => reset(),
            });
        }
    };

    const addCustomization = () => {
        setData('customizations', [
            ...data.customizations,
            { name: '', options: [''], required: false }
        ]);
    };

    const removeCustomization = (index: number) => {
        const newCustomizations = data.customizations.filter((_, i) => i !== index);
        setData('customizations', newCustomizations);
    };

    const updateCustomization = (index: number, field: string, value: any) => {
        const newCustomizations = [...data.customizations];
        newCustomizations[index] = { ...newCustomizations[index], [field]: value };
        setData('customizations', newCustomizations);
    };

    const addCustomizationOption = (customizationIndex: number) => {
        const newCustomizations = [...data.customizations];
        newCustomizations[customizationIndex].options.push('');
        setData('customizations', newCustomizations);
    };

    const removeCustomizationOption = (customizationIndex: number, optionIndex: number) => {
        const newCustomizations = [...data.customizations];
        newCustomizations[customizationIndex].options = newCustomizations[customizationIndex].options.filter((_, i) => i !== optionIndex);
        setData('customizations', newCustomizations);
    };

    const updateCustomizationOption = (customizationIndex: number, optionIndex: number, value: string) => {
        const newCustomizations = [...data.customizations];
        newCustomizations[customizationIndex].options[optionIndex] = value;
        setData('customizations', newCustomizations);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? `Edit ${product.name}` : 'Create Product'} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={route('products.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Button>
                    </Link>
                    <h2 className="text-2xl font-bold">
                        {isEditing ? `Edit ${product.name}` : 'Create New Product'}
                    </h2>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>
                                    Enter the basic details for the product
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={data.category} onValueChange={(value) => setData('category', value === 'none' ? '' : value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Category</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category} />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_add_on"
                                        checked={data.is_add_on}
                                        onCheckedChange={(checked) => setData('is_add_on', !!checked)}
                                    />
                                    <Label htmlFor="is_add_on">This is an add-on item</Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing</CardTitle>
                                <CardDescription>
                                    Set the pricing for this product
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="variant_pricing"
                                        checked={hasVariantPricing}
                                        onCheckedChange={(checked) => setHasVariantPricing(!!checked)}
                                    />
                                    <Label htmlFor="variant_pricing">Different prices for hot/iced variants</Label>
                                </div>

                                {hasVariantPricing ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="hot_price">Hot Price (₱)</Label>
                                            <Input
                                                id="hot_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.prices.hot || ''}
                                                onChange={(e) => setData('prices', {
                                                    ...data.prices,
                                                    hot: e.target.value ? parseFloat(e.target.value) : null
                                                })}
                                            />
                                            <InputError message={errors['prices.hot' as keyof typeof errors]} />
                                        </div>
                                        <div>
                                            <Label htmlFor="iced_price">Iced Price (₱)</Label>
                                            <Input
                                                id="iced_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.prices.iced || ''}
                                                onChange={(e) => setData('prices', {
                                                    ...data.prices,
                                                    iced: e.target.value ? parseFloat(e.target.value) : null
                                                })}
                                            />
                                            <InputError message={errors['prices.iced' as keyof typeof errors]} />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="price">Price (₱)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price}
                                            onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                        <InputError message={errors.price} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Customizations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customizations</CardTitle>
                            <CardDescription>
                                Add customization options for this product (e.g., size, flavor, etc.)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.customizations.map((customization, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Customization {index + 1}</h4>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeCustomization(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Customization Name</Label>
                                            <Input
                                                value={customization.name}
                                                onChange={(e) => updateCustomization(index, 'name', e.target.value)}
                                                placeholder="e.g., Size, Flavor"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={customization.required}
                                                onCheckedChange={(checked) => updateCustomization(index, 'required', !!checked)}
                                            />
                                            <Label>Required</Label>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Options</Label>
                                        <div className="space-y-2">
                                            {(customization.options || []).map((option, optionIndex) => (
                                                <div key={optionIndex} className="flex items-center gap-2">
                                                    <Input
                                                        value={option}
                                                        onChange={(e) => updateCustomizationOption(index, optionIndex, e.target.value)}
                                                        placeholder="Option name"
                                                    />
                                                    {(customization.options || []).length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeCustomizationOption(index, optionIndex)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addCustomizationOption(index)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Option
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addCustomization}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Customization
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end space-x-2">
                        <Link href={route('products.index')}>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
