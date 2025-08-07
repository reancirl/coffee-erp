import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, CheckCircle, Heart, Star } from 'lucide-react';

export default function ThankYou() {
    return (
        <>
            <Head title="Thank You - Café Feedback" />
            
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg shadow-lg text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Coffee className="h-16 w-16 text-amber-600" />
                                <CheckCircle className="h-8 w-8 text-green-600 absolute -top-2 -right-2 bg-white rounded-full" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            Thank You! 🎉
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <p className="text-lg text-gray-700">
                                Your feedback has been successfully submitted!
                            </p>
                            
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    <span className="font-semibold text-amber-800">We appreciate you!</span>
                                </div>
                                <p className="text-sm text-amber-700">
                                    Your input helps us create an even better café experience for everyone.
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm text-gray-600">Follow us on social media</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <Coffee className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm text-gray-600">Visit us again soon!</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                If you entered the raffle, we'll contact you if you win!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
