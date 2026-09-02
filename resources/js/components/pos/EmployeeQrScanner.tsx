import React, { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

export interface AllowanceBalance {
    period: string | null;
    amount: number;
    used: number;
    remaining: number;
}

export interface ScannedEmployee {
    id: number;
    name: string;
    employee_code: string | null;
    position: string | null;
    token: string;
    allowance: AllowanceBalance | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onIdentified: (employee: ScannedEmployee) => void;
}

type Phase = 'starting' | 'scanning' | 'checking' | 'identified' | 'error';

const peso = (amount: number): string =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

/** Laravel accepts the XSRF cookie value as an X-XSRF-TOKEN header. */
const xsrfToken = (): string => {
    const raw = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];
    return raw ? decodeURIComponent(raw) : '';
};

/**
 * Turn a getUserMedia failure into something a cashier can act on.
 */
const cameraErrorMessage = (error: unknown): string => {
    const name = typeof error === 'object' && error !== null && 'name' in error ? String((error as { name: unknown }).name) : '';
    const text = String(error ?? '');

    if (name === 'NotAllowedError' || /denied|permission/i.test(text)) {
        return 'Camera permission was denied. Allow camera access for this site in your browser settings, then try again.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError' || /no camera|not found/i.test(text)) {
        return 'No camera was found on this device.';
    }
    if (name === 'NotReadableError') {
        return 'The camera is already in use by another application. Close it and try again.';
    }
    return 'The camera could not be started. Check the device camera and try again.';
};

const EmployeeQrScanner: React.FC<Props> = ({ isOpen, onClose, onIdentified }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<QrScanner | null>(null);
    // Guards against the decode callback firing repeatedly while a lookup is
    // already in flight.
    const busyRef = useRef(false);

    const [phase, setPhase] = useState<Phase>('starting');
    const [message, setMessage] = useState<string>('');
    const [employee, setEmployee] = useState<ScannedEmployee | null>(null);

    const teardown = useCallback(() => {
        busyRef.current = false;
        const scanner = scannerRef.current;
        if (scanner) {
            // stop() releases the camera; destroy() frees the worker.
            scanner.stop();
            scanner.destroy();
            scannerRef.current = null;
        }
    }, []);

    const close = useCallback(() => {
        teardown();
        onClose();
    }, [teardown, onClose]);

    const lookUp = useCallback(async (token: string) => {
        setPhase('checking');
        try {
            const response = await fetch('/pos/scan-employee-qr', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({ token }),
            });

            const body = await response.json().catch(() => null);

            if (!response.ok || !body?.ok) {
                setMessage(body?.message ?? 'This QR could not be verified.');
                setPhase('error');
                return;
            }

            setEmployee({ ...body.employee, token, allowance: body.allowance ?? null });
            setPhase('identified');
        } catch {
            setMessage('Could not reach the server to verify this QR.');
            setPhase('error');
        }
    }, []);

    const start = useCallback(async () => {
        setPhase('starting');
        setMessage('');
        setEmployee(null);
        busyRef.current = false;

        // getUserMedia is unavailable outside a secure context. localhost is
        // treated as secure; a plain-HTTP LAN address is not.
        if (!window.isSecureContext) {
            setMessage(
                'The camera needs a secure connection. Open the POS over HTTPS (or on localhost) to scan.',
            );
            setPhase('error');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage('This browser does not support camera access.');
            setPhase('error');
            return;
        }

        try {
            if (!(await QrScanner.hasCamera())) {
                setMessage('No camera was found on this device.');
                setPhase('error');
                return;
            }

            const video = videoRef.current;
            if (!video) return;

            const scanner = new QrScanner(
                video,
                (result) => {
                    if (busyRef.current) return;
                    busyRef.current = true;
                    scanner.stop();
                    void lookUp(result.data);
                },
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: 'environment',
                    maxScansPerSecond: 5,
                },
            );

            scannerRef.current = scanner;
            await scanner.start();
            setPhase('scanning');
        } catch (error) {
            teardown();
            setMessage(cameraErrorMessage(error));
            setPhase('error');
        }
    }, [lookUp, teardown]);

    useEffect(() => {
        if (isOpen) {
            void start();
        } else {
            teardown();
        }
        // Always release the camera when this component goes away.
        return teardown;
    }, [isOpen, start, teardown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg bg-card p-5 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Scan Employee QR</h2>
                    <button onClick={close} className="text-2xl leading-none text-muted-foreground hover:text-foreground" aria-label="Close scanner">
                        &times;
                    </button>
                </div>

                {/* The video element must stay mounted for the scanner to attach. */}
                <div className={phase === 'identified' || phase === 'error' ? 'hidden' : 'block'}>
                    <div className="overflow-hidden rounded-md bg-black">
                        <video ref={videoRef} className="h-64 w-full object-cover" muted playsInline />
                    </div>
                    <p className="mt-3 text-center text-sm text-muted-foreground">
                        {phase === 'starting' && 'Starting camera...'}
                        {phase === 'scanning' && "Hold the employee's QR inside the frame."}
                        {phase === 'checking' && 'Verifying with the server...'}
                    </p>
                </div>

                {phase === 'identified' && employee && (
                    <div className="py-4 text-center">
                        <div className="mb-1 text-xl font-semibold">{employee.name}</div>
                        {employee.employee_code && (
                            <div className="font-mono text-sm text-muted-foreground">{employee.employee_code}</div>
                        )}
                        {employee.position && <div className="text-xs text-muted-foreground">{employee.position}</div>}

                        {employee.allowance && (
                            <div className="mx-auto mt-4 max-w-xs rounded-md border p-3 text-sm">
                                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                    {employee.allowance.period ?? 'Allowance'}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Allowance</span>
                                    <span>{peso(employee.allowance.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Used</span>
                                    <span>{peso(employee.allowance.used)}</span>
                                </div>
                                <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                                    <span>Remaining</span>
                                    <span className={employee.allowance.remaining <= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-300'}>
                                        {peso(employee.allowance.remaining)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex justify-center gap-2">
                            <button onClick={() => void start()} className="rounded border px-4 py-2 text-sm">
                                Scan again
                            </button>
                            <button
                                onClick={() => {
                                    teardown();
                                    onIdentified(employee);
                                }}
                                className="rounded bg-black px-4 py-2 text-sm text-white"
                            >
                                Use this employee
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'error' && (
                    <div className="py-4 text-center">
                        <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">{message}</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={close} className="rounded border px-4 py-2 text-sm">
                                Close
                            </button>
                            <button onClick={() => void start()} className="rounded bg-black px-4 py-2 text-sm text-white">
                                Try again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeQrScanner;
