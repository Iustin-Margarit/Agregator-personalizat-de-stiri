'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmailConfirmedPage() {
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('error_description');
        
        // This is a special message sent by Supabase after the *first* confirmation link is clicked.
        const confirmationMessage = searchParams.get('message');

        if (error) {
            setTitle('An Error Occurred');
            setMessage(errorMessage || 'An unknown error occurred. Please try again or contact support.');
            setIsError(true);
        } else if (confirmationMessage?.includes('Please proceed to confirm link sent to the other email')) {
            setTitle('One More Step!');
            setMessage('Thank you for confirming your new email. To finalize the change, please click the confirmation link sent to your old email address. This is a security step to ensure your account remains safe.');
        } else if (confirmationMessage?.includes('Email updated successfully')) {
            setTitle('Email Changed Successfully!');
            setMessage('Your email address has been updated. Please log in again with your new credentials.');
        } else {
            // Default or unknown state
             setTitle('Confirmation Page');
             setMessage('Please follow the instructions sent to your email inbox.');
        }

    }, [searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className={`w-full max-w-md text-center shadow-lg ${isError ? 'border-red-500' : 'border-green-500'}`}>
                <CardHeader>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-6">{message}</p>
                    <Button asChild>
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}