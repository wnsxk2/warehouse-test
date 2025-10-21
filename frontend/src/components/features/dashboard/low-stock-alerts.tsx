import { AlertCircle } from 'lucide-react';

interface LowStockAlertsProps {
  count: number;
  isLoading?: boolean;
}

export function LowStockAlerts({ count, isLoading }: LowStockAlertsProps) {
  if (isLoading) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="h-4 w-16 bg-yellow-200 animate-pulse inline-block rounded"></span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">{count}</span> item{count > 1 ? 's' : ''} below reorder threshold
          </p>
        </div>
      </div>
    </div>
  );
}
