
export function PublicFooter() {
    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                    <img src="/images/eastlone_geckologo.png" alt="Eastlone logo" className="h-10 w-10 object-contain" />
                    <div>
                        <p className="font-semibold text-gray-900">Eastlone Cafe</p>
                        <p className="text-xs text-gray-600">Mobile coffee cart & events</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700">
                    <a
                        href="https://www.facebook.com/eastlonecafe"
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer rounded-full border border-gray-200 px-3 py-2 hover:border-primary hover:text-primary"
                    >
                        Facebook
                    </a>
                    <a
                        href="https://www.instagram.com/eastlonecafe/"
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer rounded-full border border-gray-200 px-3 py-2 hover:border-primary hover:text-primary"
                    >
                        Instagram
                    </a>
                </div>
            </div>
        </footer>
    );
}
