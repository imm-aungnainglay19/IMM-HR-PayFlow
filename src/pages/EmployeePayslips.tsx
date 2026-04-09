import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  DollarSign,
  Loader2,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import pb from '../lib/pocketbase';
import { useAuth } from '../AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SalarySlip {
  id: string;
  employee: string;
  net_pay: number;
  gross_pay: number;
  deductions: number;
  created: string;
  expand?: {
    cycle: {
      month_year: string;
      start_date: string;
      end_date: string;
    }
  }
}

const EmployeePayslips: React.FC = () => {
  const { user } = useAuth();
  const isMock = user?.id === 'mock-admin-id';
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSlips = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      if (isMock) {
        setTimeout(() => {
          setSlips([
            {
              id: 's1',
              employee: user.id,
              net_pay: 4800,
              gross_pay: 5000,
              deductions: 200,
              created: '2026-03-31T10:00:00Z',
              expand: {
                cycle: {
                  month_year: 'March 2026',
                  start_date: '2026-03-01',
                  end_date: '2026-03-31'
                }
              }
            },
            {
              id: 's2',
              employee: user.id,
              net_pay: 4800,
              gross_pay: 5000,
              deductions: 200,
              created: '2026-02-28T10:00:00Z',
              expand: {
                cycle: {
                  month_year: 'February 2026',
                  start_date: '2026-02-01',
                  end_date: '2026-02-28'
                }
              }
            }
          ]);
          setIsLoading(false);
        }, 500);
        return;
      }

      try {
        const records = await pb.collection('salary_slips').getFullList<SalarySlip>({
          filter: `employee = "${user.id}"`,
          sort: '-created',
          expand: 'cycle'
        });
        setSlips(records);
      } catch (err: any) {
        console.error('Fetch error:', err);
        if (err.status === 403) {
          toast.error('Permission denied: Please check Pocketbase API Rules.');
        } else if (err.status === 404) {
          toast.error('Resource not found: Please check your Pocketbase collections.');
        } else {
          toast.error('Failed to load your payslips. Please check your connection to PocketBase.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlips();
  }, [user?.id]);

  const filteredSlips = slips.filter(slip => 
    slip.expand?.cycle?.month_year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Payslips</h1>
          <p className="text-slate-500 mt-1">View and download your historical salary records</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-bottom border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by month or year..." 
              className="pl-10 bg-slate-50 border-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold">Period</TableHead>
              <TableHead className="font-semibold">Processed Date</TableHead>
              <TableHead className="font-semibold">Gross Pay</TableHead>
              <TableHead className="font-semibold">Deductions</TableHead>
              <TableHead className="font-semibold">Net Payout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </TableCell>
              </TableRow>
            ) : filteredSlips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No payslips found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSlips.map((slip) => (
                <TableRow key={slip.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {slip.expand?.cycle?.month_year || 'Unknown Period'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {slip.expand?.cycle?.start_date ? format(new Date(slip.expand.cycle.start_date), 'MMM dd') : ''} - {slip.expand?.cycle?.end_date ? format(new Date(slip.expand.cycle.end_date), 'MMM dd') : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-600">
                      {format(new Date(slip.created), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900 font-medium">
                      ${slip.gross_pay.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-red-600 font-medium">
                      -${slip.deductions.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">
                      ${slip.net_pay.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeePayslips;
