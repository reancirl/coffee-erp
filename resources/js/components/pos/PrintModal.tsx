import React from 'react';
import { primaryColor, secondaryColor, accentColor } from './types';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPrintOptions: string[];
    setSelectedPrintOptions: (options: string[]) => void;
    onDone: () => void;
    orderType: string; // Added order type (dine-in or takeout)
    beeperNumber: string; // Added beeper number
}

const PrintModal: React.FC<PrintModalProps> = ({
    isOpen,
    selectedPrintOptions,
    setSelectedPrintOptions,
    onDone,
    orderType,
    beeperNumber,
}) => {
    if (!isOpen) return null;

    const togglePrintOption = (option: string) => {
        if (option === 'Skip Printing') {
            if (selectedPrintOptions.includes('Skip Printing')) {
                setSelectedPrintOptions([]);
            } else {
                setSelectedPrintOptions(['Skip Printing']);
            }
        } else {
            if (selectedPrintOptions.includes('Skip Printing')) {
                setSelectedPrintOptions([]);
            }
            if (selectedPrintOptions.includes(option)) {
                setSelectedPrintOptions(selectedPrintOptions.filter((o) => o !== option));
            } else {
                setSelectedPrintOptions([...selectedPrintOptions, option]);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div
                className="bg-white p-6 rounded shadow-lg w-96"
                style={{ backgroundColor: primaryColor, color: accentColor }}
            >
                <h2 className="text-xl font-semibold mb-4">Print Options</h2>
                
                {/* Display order details */}
                <div className="mb-4 p-3 bg-gray-100 rounded">
                    <p className="font-medium text-black">Order Details:</p>
                    <p className="text-black"><span className="font-medium">Type:</span> {orderType}</p>
                    {beeperNumber && <p className="text-black"><span className="font-medium">Beeper #:</span> {beeperNumber}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {['Order Slip', 'Skip Printing'].map((option) => {
                        const isSelected = selectedPrintOptions.includes(option);
                        return (
                            <div
                                key={option}
                                onClick={() => togglePrintOption(option)}
                                className={`p-4 border rounded cursor-pointer text-center ${
                                    isSelected
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-gray-200 text-black'
                                }`}
                            >
                                {option}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        className="px-4 py-2 rounded text-sm font-semibold"
                        style={{
                            backgroundColor: secondaryColor,
                            color: accentColor,
                            border: `1px solid ${accentColor}`,
                        }}
                        onClick={() => {
                            alert(
                                `Printing: ${
                                    selectedPrintOptions.length > 0
                                        ? selectedPrintOptions.join(', ')
                                        : 'None'
                                }`
                            );
                            onDone();
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintModal; 