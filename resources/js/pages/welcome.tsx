import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Cafe Menu" />
            <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#434343' }}>
                <img 
                    src="/images/menu-july.jpeg" 
                    alt="Eastlone Cafe Menu - July 2025" 
                    className="max-h-screen max-w-full object-contain shadow-lg" 
                />
            </div>
        </>
    );
}