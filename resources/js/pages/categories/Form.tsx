import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';
import InputError from '@/components/input-error';

interface Category {
    id: number;
    name: string;
    description?: string;
}

interface Props {
    category?: Category;
}

type CategoryForm = {
    name: string;
    description: string;
};

export default function Form({ category }: Props) {
    const isEditing = !!category;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Categories',
            href: '/categories',
        },
        {
            title: isEditing ? 'Edit Category' : 'Create Category',
            href: isEditing ? `/categories/${category.id}/edit` : '/categories/create',
        },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm<CategoryForm>({
        name: category?.name || '',
        description: category?.description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing) {
            put(route('categories.update', category.id), {
                onSuccess: () => reset(),
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => reset(),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? `Edit ${category.name}` : 'Create Category'} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={route('categories.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Categories
                        </Button>
                    </Link>
                    <h2 className="text-2xl font-bold">
                        {isEditing ? `Edit ${category.name}` : 'Create New Category'}
                    </h2>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Information</CardTitle>
                            <CardDescription>
                                {isEditing 
                                    ? 'Update the category details below'
                                    : 'Enter the details for the new category'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <Label htmlFor="name">Category Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="Enter category name"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Enter category description (optional)"
                                        rows={4}
                                    />
                                    <InputError message={errors.description} />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Provide a brief description of what products belong to this category.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end space-x-2">
                                    <Link href={route('categories.index')}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
