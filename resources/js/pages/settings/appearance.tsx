import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SettingsLayout from '@/layouts/settings/layout';

type Theme = 'light' | 'dark' | 'system';

interface AppearanceSettingsProps {
    theme: Theme;
}

export default function Appearance({ theme: currentTheme }: AppearanceSettingsProps) {
    const { data, setData, patch, processing } = useForm<{ theme: Theme }>({
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
        <>
            <Head title="Appearance" />
            <SettingsLayout
                title="Appearance"
                description="Customize the appearance of the application."
            >
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
        </>
    );
}
