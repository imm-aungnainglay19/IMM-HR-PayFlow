import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  Loader2,
  FileText,
  Briefcase,
  ArrowRight,
  Download,
  Info
} from 'lucide-react';
import pb from '@/src/lib/pocketbase';
import { useAuth } from '@/src/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface SalarySlip {
  id: string;
  net_pay: number;
  gross_pay: number;
  deductions: number;
  created: string;
  expand?: {
    cycle: {
      month_year: string;
    }
  }
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [latestSlip, setLatestSlip] = useState<SalarySlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestSlip = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const records = await pb.collection('salary_slips').getList<SalarySlip>(1, 1, {
          filter: `employee = "${user.id}"`,
          sort: '-created',
          expand: 'cycle'
        });
        if (records.items.length > 0) {
          setLatestSlip(records.items[0]);
        }
      } catch (err) {
        console.error('Failed to fetch slip', err);
        toast.error('Failed to load your latest payslip. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestSlip();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.full_name}!</h1>
          <p className="text-slate-500 mt-1">Here's an overview of your employment and payroll</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-sm py-1 px-3">
          {user?.position || 'Employee'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="h-2 bg-indigo-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Latest Payslip</CardTitle>
              <CardDescription>
                {latestSlip?.expand?.cycle?.month_year || 'No recent slips found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestSlip ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-4">
                  <div className="space-y-1">
                    <span className="text-sm text-slate-500 uppercase tracking-wider font-medium">Net Payout</span>
                    <div className="text-4xl font-bold text-slate-900">${latestSlip.net_pay.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 flex-1 max-w-xs">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-medium">Gross Pay</span>
                      <div className="font-semibold text-slate-900">${latestSlip.gross_pay.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-medium">Deductions</span>
                      <div className="font-semibold text-red-600">-${latestSlip.deductions.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400">Your first payslip will appear here once processed.</p>
                </div>
              )}
            </CardContent>
            {latestSlip && (
              <CardFooter className="bg-slate-50 border-t border-slate-100 py-4">
                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 ml-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardFooter>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Employee ID</span>
                  <span className="font-semibold text-slate-900">{user?.employee_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Joining Date</span>
                  <span className="font-semibold text-slate-900">
                    {user?.joining_date ? format(new Date(user.joining_date), 'MMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base Salary</span>
                  <span className="font-semibold text-slate-900">${user?.base_salary?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                <Link to="/employee/payslips">
                  <Button variant="ghost" className="w-full justify-between hover:bg-slate-50">
                    View All Payslips
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-between hover:bg-slate-50">
                  Update Bank Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between hover:bg-slate-50">
                  Request Leave
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-slate-200 shadow-sm bg-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="text-white">Tax Information</CardTitle>
              <CardDescription className="text-indigo-100">Your current tax bracket and contributions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm opacity-80">Estimated Tax (YTD)</span>
                <span className="text-2xl font-bold">$1,240.00</span>
              </div>
              <div className="w-full bg-indigo-500 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[65%]" />
              </div>
              <p className="text-xs opacity-70 italic">Calculated based on your current base salary and local regulations.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Bank Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-md border border-slate-200 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Chase Bank</p>
                  <p className="text-xs text-slate-500">•••• 4242</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
