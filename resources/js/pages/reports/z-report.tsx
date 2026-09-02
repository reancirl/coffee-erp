import { Head } from '@inertiajs/react';
import AppLayout, { withAppShell } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import ZReportPrinter from '@/components/reports/ZReportPrinter';

interface ProductSales {
  product_name: string;
  quantity_sold: number;
  total_sales: number;
}

interface PaymentMethodTotal {
  count: number;
  total: number;
}

interface ZReportData {
  date: string;
  totalOrders: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  paymentMethodTotals: Record<string, PaymentMethodTotal>;
  allProductsSold: ProductSales[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports' },
  { title: 'Z-Report', href: '/reports/z-report' },
];

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

export default function ZReport({ reportData }: { reportData?: ZReportData }) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value);

  const generateReport = () => {
    router.get(route('reports.z-report.generate'), { date }, { preserveState: true });
  };

  const handlePrintStart = () => setIsPrinting(true);
  const handlePrintComplete = () => setIsPrinting(false);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Z-Report" />

      <div className="font-sans text-foreground p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Z-Report</h2>
        </div>

        {/* Selector */}
        <div className="bg-card shadow-sm rounded-lg p-6">
          <div className="mb-6 flex items-center gap-4">
            <label htmlFor="date" className="text-base font-medium text-foreground">
              Select Date for Z-Report:
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={handleDateChange}
              className="border rounded-md px-4 py-2 text-base text-foreground focus:outline-none focus:ring"
            />
            <button
              onClick={generateReport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md focus:outline-none focus:ring"
            >
              Generate Report
            </button>
          </div>

          {!reportData && (
            <div className="text-center text-muted-foreground py-10">
              Select a date and click "Generate Report" to view the Z-Report for that day.
            </div>
          )}

          {reportData && (
            <>
              {/* Title & Print */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-foreground">
                  Z-Report for{' '}
                  {new Date(reportData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div>
                  {isPrinting ? (
                    <span className="bg-muted text-muted-foreground font-semibold px-5 py-2 rounded-md opacity-50 cursor-not-allowed">
                      Printing...
                    </span>
                  ) : (
                    <ZReportPrinter
                      reportData={reportData}
                      onPrintStart={handlePrintStart}
                      onPrintComplete={handlePrintComplete}
                    />
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 bg-muted p-6 rounded-lg">
                {[
                  { label: 'Total Orders', value: reportData.totalOrders },
                  { label: 'Gross Sales', value: formatCurrency(reportData.grossSales) },
                  { label: 'Discounts', value: `-${formatCurrency(reportData.discounts)}`, textColor: 'text-red-600 dark:text-red-400' },
                  { label: 'Net Sales', value: formatCurrency(reportData.netSales), textColor: 'text-green-600 dark:text-green-400' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-base text-muted-foreground">{item.label}</p>
                    <p className={`text-xl font-bold ${item.textColor || 'text-foreground'}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Methods */}
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-4">Sales by Payment Method</h4>
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-base font-medium text-foreground uppercase tracking-wide">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-base font-medium text-foreground uppercase tracking-wide">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-right text-base font-medium text-foreground uppercase tracking-wide">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.entries(reportData.paymentMethodTotals).map(([method, data], idx) => (
                        <tr key={idx} className="hover:bg-muted">
                          <td className="px-6 py-3 text-base text-foreground">{method}</td>
                          <td className="px-6 py-3 text-base text-foreground">{data.count}</td>
                          <td className="px-6 py-3 text-base text-foreground text-right">
                            {formatCurrency(data.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top Products */}
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-4">Products Sold</h4>
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-base font-medium text-foreground uppercase tracking-wide">
                          Product
                        </th>
                        <th className="px-6 py-3 text-right text-base font-medium text-foreground uppercase tracking-wide">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-right text-base font-medium text-foreground uppercase tracking-wide">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.allProductsSold && reportData.allProductsSold.map((product, idx) => (
                        <tr key={idx} className="hover:bg-muted">
                          <td className="px-6 py-3 text-base text-foreground">{product.product_name}</td>
                          <td className="px-6 py-3 text-base text-foreground text-right">{product.quantity_sold}</td>
                          <td className="px-6 py-3 text-base text-foreground text-right">
                            {formatCurrency(product.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

ZReport.layout = withAppShell;
