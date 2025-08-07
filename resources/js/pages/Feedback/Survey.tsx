import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Coffee, Star, Heart } from 'lucide-react';

interface SurveyProps {
    token: string;
}

export default function Survey({ token }: SurveyProps) {
    const { data, setData, post, processing, errors } = useForm({
        overall_experience: '',
        enjoyed_most_least: '',
        recommend_likelihood: '',
        customer_name: '',
        customer_email: '',
        session_token: token,
    });

    const experienceOptions = ['Excellent', 'Good', 'Fair', 'Poor'];
    const recommendOptions = [
        { value: 10, label: 'Very Likely (10)' },
        { value: 9, label: 'Likely (9)' },
        { value: 8, label: 'Likely (8)' },
        { value: 7, label: 'Somewhat Likely (7)' },
        { value: 6, label: 'Neutral (6)' },
        { value: 5, label: 'Neutral (5)' },
        { value: 4, label: 'Unlikely (4)' },
        { value: 3, label: 'Unlikely (3)' },
        { value: 2, label: 'Very Unlikely (2)' },
        { value: 1, label: 'Very Unlikely (1)' },
        { value: 0, label: 'Never (0)' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/feedback/submit');
    };

    return (
        <>
            <Head title="Café Feedback Survey" />
            
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Coffee className="h-12 w-12 text-amber-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
                            📝 3-Question Café Feedback Survey
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-white">
                            Help us improve your café experience! This will only take 2 minutes.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Question 1: Overall Experience */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-amber-500" />
                                    <Label className="text-lg font-semibold">
                                        1. How was your overall experience today?
                                    </Label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {experienceOptions.map((option) => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`experience-${option}`}
                                                checked={data.overall_experience === option}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setData('overall_experience', option);
                                                    }
                                                }}
                                            />
                                            <Label 
                                                htmlFor={`experience-${option}`}
                                                className="cursor-pointer"
                                            >
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.overall_experience && (
                                    <p className="text-red-500 text-sm">{errors.overall_experience}</p>
                                )}
                            </div>

                            {/* Question 2: Open-ended */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    <Label className="text-lg font-semibold">
                                        2. What did you enjoy most or least about your visit?
                                    </Label>
                                </div>
                                <Textarea
                                    placeholder="Tell us about your experience - ambiance, service, menu items, etc."
                                    value={data.enjoyed_most_least}
                                    onChange={(e) => setData('enjoyed_most_least', e.target.value)}
                                    className="min-h-[100px]"
                                />
                                {errors.enjoyed_most_least && (
                                    <p className="text-red-500 text-sm">{errors.enjoyed_most_least}</p>
                                )}
                            </div>

                            {/* Question 3: Recommendation */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Coffee className="h-5 w-5 text-amber-600" />
                                    <Label className="text-lg font-semibold">
                                        3. How likely are you to recommend us to a friend?
                                    </Label>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                    {recommendOptions.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`recommend-${option.value}`}
                                                checked={data.recommend_likelihood === option.value.toString()}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setData('recommend_likelihood', option.value.toString());
                                                    }
                                                }}
                                            />
                                            <Label 
                                                htmlFor={`recommend-${option.value}`}
                                                className="cursor-pointer"
                                            >
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.recommend_likelihood && (
                                    <p className="text-red-500 text-sm">{errors.recommend_likelihood}</p>
                                )}
                            </div>

                            {/* Optional Contact Info */}
                            <div className="space-y-4 border-t pt-6">
                                <Label className="text-lg font-semibold text-amber-600">
                                    🫶 Let’s stay in touch — sign up for updates and occasional giveaways like free drinks!
                                </Label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="customer_name">Name (Optional)</Label>
                                        <Input
                                            id="customer_name"
                                            placeholder="Your name"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                        />
                                        {errors.customer_name && (
                                            <p className="text-red-500 text-sm">{errors.customer_name}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="customer_email">Email (Optional)</Label>
                                        <Input
                                            id="customer_email"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={data.customer_email}
                                            onChange={(e) => setData('customer_email', e.target.value)}
                                        />
                                        {errors.customer_email && (
                                            <p className="text-red-500 text-sm">{errors.customer_email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg"
                                disabled={processing || !data.overall_experience || !data.recommend_likelihood}
                            >
                                {processing ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
