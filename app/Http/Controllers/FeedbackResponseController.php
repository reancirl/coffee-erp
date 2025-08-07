<?php

namespace App\Http\Controllers;

use App\Models\FeedbackResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class FeedbackResponseController extends Controller
{
    public function show($token)
    {
        // Show the feedback form with the token
        return Inertia::render('Feedback/Survey', [
            'token' => $token
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'overall_experience' => 'required|in:Excellent,Good,Fair,Poor',
            'enjoyed_most_least' => 'nullable|string|max:1000',
            'recommend_likelihood' => 'required|integer|min:0|max:10',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'session_token' => 'required|string',
        ]);

        // Check if feedback already submitted for this session
        $existingFeedback = FeedbackResponse::where('session_token', $request->session_token)->first();
        // if ($existingFeedback) {
        //     return redirect()->back()->with('error', 'Feedback has already been submitted for this session.');
        // }

        FeedbackResponse::create([
            'overall_experience' => $request->overall_experience,
            'enjoyed_most_least' => $request->enjoyed_most_least,
            'recommend_likelihood' => $request->recommend_likelihood,
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'session_token' => $request->session_token,
            'submitted_at' => now(),
        ]);

        return Inertia::render('Feedback/ThankYou');
    }
}
