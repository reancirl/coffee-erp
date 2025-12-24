import { Link } from '@inertiajs/react';
import { useState } from 'react';

interface PublicHeaderProps {
    isLoggedIn: boolean;
}

export function PublicHeader({ isLoggedIn }: PublicHeaderProps) {
    const [open, setOpen] = useState(false);

    const NavLinks = () => (
        <>
            <Link href="/menu" prefetch className="cursor-pointer hover:text-primary">
                Menu
            </Link>
            <Link href="/rewards" prefetch className="cursor-pointer hover:text-primary">
                Rewards
            </Link>
            <a
                href="https://pmna.craphify.com"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer hover:text-primary"
            >
                Merch
            </a>
        </>
    );

    const AuthLinks = () =>
        isLoggedIn ? (
            <Link
                href="/dashboard"
                className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 hover:border-primary hover:text-primary"
            >
                Dashboard
            </Link>
        ) : (
            <>
                <Link
                    href="/login"
                    className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 hover:border-primary hover:text-primary"
                >
                    Login
                </Link>
                <Link
                    href="/register"
                    className="cursor-pointer rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Register
                </Link>
            </>
        );

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:py-6">
                {/* Desktop layout */}
                <div className="hidden flex-1 items-center gap-6 text-md font-medium text-gray-700 md:flex">
                    <NavLinks />
                </div>
                <div className="hidden flex-1 flex-col items-center gap-2 text-center md:flex">
                    <Link href="/">
                        <img
                            src="/images/eastlone_geckologo.png"
                            alt="Eastlone logo"
                            className="h-20 w-20 object-contain md:h-32 md:w-32"
                        />
                    </Link>
                </div>
                <div className="hidden flex-1 items-center justify-end gap-3 text-sm font-medium text-gray-700 md:flex">
                    <AuthLinks />
                </div>

                {/* Mobile layout: logo left, hamburger right */}
                <div className="flex w-full items-center justify-between md:hidden">
                    <Link href="/">
                        <img src="/images/eastlone_geckologo.png" alt="Eastlone logo" className="h-20 w-20 object-contain" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen((prev) => !prev)}
                        className="rounded-md border border-gray-200 p-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        aria-label="Toggle navigation"
                    >
                        <div className="h-0.5 w-5 bg-gray-800" />
                        <div className="mt-1 h-0.5 w-5 bg-gray-800" />
                        <div className="mt-1 h-0.5 w-5 bg-gray-800" />
                    </button>
                </div>

                {/* Mobile dropdown */}
                {open && (
                    <div className="absolute left-4 right-4 top-full z-50 mt-2 w-auto md:hidden">
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
                            <div className="flex flex-col gap-3 text-sm font-medium text-gray-700">
                                <NavLinks />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700">
                                <AuthLinks />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
