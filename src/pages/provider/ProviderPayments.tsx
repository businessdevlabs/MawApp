import { useState } from 'react';
import { useProviderPayments } from '@/hooks/useProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Download, 
  Calendar,
  User,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface Payment {
  _id: string;
  bookingId: {
    _id: string;
    clientId: { fullName: string; email: string };
    serviceId: { name: string; duration: number };
    appointmentDate: string;
    startTime: string;
  };
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string;
  paymentDate: string;
  platformFee: number;
  netAmount: number;
}

const ProviderPayments = () => {
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate date filters
  const getDateParams = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'thisMonth': {
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      }
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        return {
          startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      }
      case 'custom':
        return startDate && endDate ? { startDate, endDate } : {};
      default:
        return {};
    }
  };

  const { data: payments = [], isLoading } = useProviderPayments(getDateParams());

  // Sort payments
  const sortedPayments = [...payments].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    if (sortBy === 'date') {
      return multiplier * (new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    } else {
      return multiplier * (a.amount - b.amount);
    }
  });

  // Calculate stats
  const totalRevenue = payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
  const totalFees = payments.reduce((sum: number, payment: Payment) => sum + payment.platformFee, 0);
  const netRevenue = payments.reduce((sum: number, payment: Payment) => sum + payment.netAmount, 0);
  const averagePayment = payments.length > 0 ? totalRevenue / payments.length : 0;

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const PaymentCard = ({ payment }: { payment: Payment }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold">{payment.bookingId?.clientId?.fullName || 'Unknown Client'}</h3>
              <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                {payment.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(payment.paymentDate), 'EEEE, MMMM do, yyyy')}
                </span>
              </div>
              <div className="font-medium">
                Service: {payment.bookingId?.serviceId?.name}
              </div>
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(payment.paymentMethod)}
                <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
              </div>
              <div className="text-xs text-gray-500">
                Transaction ID: {payment.transactionId}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Gross Amount</p>
                <p className="font-semibold text-green-600">${payment.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Platform Fee</p>
                <p className="font-medium text-red-500">-${payment.platformFee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Net Amount</p>
                <p className="font-bold text-green-700">${payment.netAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Revenue</p>
                    <p className="text-2xl font-bold text-green-700">${netRevenue.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-700" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Platform Fees</p>
                    <p className="text-2xl font-bold text-red-500">${totalFees.toFixed(2)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Payment</p>
                    <p className="text-2xl font-bold text-blue-600">${averagePayment.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date-filter">Date Filter</Label>
                  <select
                    id="date-filter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as 'all' | 'thisMonth' | 'lastMonth' | 'custom')}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {dateFilter === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Sort By</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={sortBy === 'date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'date') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('date');
                          setSortOrder('desc');
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={sortBy === 'amount' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'amount') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('amount');
                          setSortOrder('desc');
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <DollarSign className="w-4 h-4" />
                      Amount
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History ({sortedPayments.length} payments)</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No payments found</p>
                  <p className="text-sm text-gray-400">
                    Payments will appear here once you complete appointments
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedPayments.map((payment) => (
                    <PaymentCard key={payment._id} payment={payment} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderPayments;