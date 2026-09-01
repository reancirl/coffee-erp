import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/settings/appearance',
    },
];

type Theme = 'light' | 'dark' | 'system';

interface AppearanceSettingsProps {
    theme: Theme;
}

export default function Appearance({ theme: currentTheme }: AppearanceSettingsProps) {
    const { data, setData, patch } = useForm<{ theme: Theme }>({
        theme: currentTheme,
    });

    const themes = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Sun },
    ] as const;

    const handleThemeChange = (value: Theme) => {
        setData('theme', value);
        patch(route('settings.appearance'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance" />
            <SettingsLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Theme</CardTitle>
                        <CardDescription>Select your preferred theme.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup
                            value={data.theme}
                            onValueChange={(value: Theme) => handleThemeChange(value)}
                            className="grid max-w-md grid-cols-3 gap-8 pt-2"
                        >
                            {themes.map(({ value, label, icon: Icon }) => (
                                <div key={value}>
                                    <RadioGroupItem
                                        value={value}
                                        id={value}
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor={value}
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <Icon className="mb-3 h-6 w-6" />
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>
            </SettingsLayout>
        </AppLayout>
    );
}
