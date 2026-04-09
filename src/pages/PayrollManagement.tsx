import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  CreditCard, 
  Calendar, 
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calculator,
  Save,
  Download
} from 'lucide-react';
import pb from '@/src/lib/pocketbase';
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/src/AuthContext';

import { PayrollSkeleton } from '@/src/components/skeletons/PageSkeletons';

interface Employee {
  id: string;
  full_name: string;
  employee_id: string;
  base_salary: number;
}

interface PayrollCycle {
  id: string;
  month_year: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'approved' | 'paid';
}

interface PayrollEntry {
  employeeId: string;
  fullName: string;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netPay: number;
  processed: boolean;
}

const PayrollManagement: React.FC = () => {
  const { user } = useAuth();
  const isMock = user?.id === 'mock-admin-id';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  
  // Payroll entries state
  const [entries, setEntries] = useState<Record<string, PayrollEntry>>({});

  const [newCycleData, setNewCycleData] = useState({
    month_year: format(new Date(), 'MMMM yyyy'),
    start_date: format(new Date(), 'yyyy-MM-01'),
    end_date: format(new Date(), 'yyyy-MM-28'),
    status: 'draft' as const,
  });

  const fetchData = async (pageToFetch = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    if (isMock) {
      setTimeout(() => {
        const mockEmployees = [
          { id: '1', full_name: 'John Doe', employee_id: 'EMP-001', base_salary: 5000 },
          { id: '2', full_name: 'Jane Smith', employee_id: 'EMP-002', base_salary: 6000 }
        ];
        const mockCycles: PayrollCycle[] = [
          { id: 'c1', month_year: 'April 2026', start_date: '2026-04-01', end_date: '2026-04-30', status: 'draft' }
        ];
        
        if (isLoadMore) {
          setEmployees(prev => [...prev, ...mockEmployees.map(e => ({ ...e, id: e.id + prev.length }))]);
        } else {
          setEmployees(mockEmployees);
          setCycles(mockCycles);
          setSelectedCycleId('c1');
        }

        const newEntries: Record<string, PayrollEntry> = {};
        mockEmployees.forEach(emp => {
          const id = isLoadMore ? emp.id + employees.length : emp.id;
          newEntries[id] = {
            employeeId: id,
            fullName: emp.full_name,
            baseSalary: emp.base_salary,
            deductions: 0,
            bonuses: 0,
            netPay: emp.base_salary,
            processed: false,
          };
        });
        
        setEntries(prev => ({ ...prev, ...newEntries }));
        setTotalPages(1);
        setIsLoading(false);
        setIsFetchingMore(false);
      }, 500);
      return;
    }

    try {
      const [empResult, cycleRecords] = await Promise.all([
        pb.collection('employees').getList<Employee>(pageToFetch, 50, { sort: 'full_name' }),
        pb.collection('payroll_cycles').getFullList<PayrollCycle>({ sort: '-created' })
      ]);
      
      const newEmployees = empResult.items;
      
      if (isLoadMore) {
        setEmployees(prev => [...prev, ...newEmployees]);
      } else {
        setEmployees(newEmployees);
        setCycles(cycleRecords);
        if (cycleRecords.length > 0 && !selectedCycleId) {
          setSelectedCycleId(cycleRecords[0].id);
        }
      }
      
      setTotalPages(empResult.totalPages);
      setPage(empResult.page);

      // Initialize entries for new employees
      const newEntries: Record<string, PayrollEntry> = {};
      newEmployees.forEach(emp => {
        if (!entries[emp.id]) {
          newEntries[emp.id] = {
            employeeId: emp.id,
            fullName: emp.full_name,
            baseSalary: emp.base_salary,
            deductions: 0,
            bonuses: 0,
            netPay: emp.base_salary,
            processed: false,
          };
        }
      });
      
      setEntries(prev => ({ ...prev, ...newEntries }));

    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err.status === 403) {
        toast.error('Permission denied: Please check Pocketbase API Rules.');
      } else if (err.status === 404) {
        toast.error('Resource not found: Please check your Pocketbase collections.');
      } else {
        toast.error('Failed to load payroll data. Please check your connection to PocketBase.');
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchData(page + 1, true);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMock) {
      toast.success('Payroll cycle created (Demo Mode)');
      setIsCycleModalOpen(false);
      return;
    }

    try {
      const record = await pb.collection('payroll_cycles').create(newCycleData);
      setCycles([record, ...cycles]);
      setSelectedCycleId(record.id);
      setIsCycleModalOpen(false);
      toast.success('Payroll cycle created');
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Permission denied: Please check Pocketbase API Rules.');
      } else if (err.status === 404) {
        toast.error('Resource not found: Please check your Pocketbase collections.');
      } else {
        toast.error('Failed to create cycle');
      }
    }
  };

  const updateEntry = (empId: string, field: 'deductions' | 'bonuses', value: number) => {
    setEntries(prev => {
      const entry = prev[empId];
      const deductions = field === 'deductions' ? value : entry.deductions;
      const bonuses = field === 'bonuses' ? value : entry.bonuses;
      const netPay = entry.baseSalary + bonuses - deductions;
      
      return {
        ...prev,
        [empId]: {
          ...entry,
          [field]: value,
          netPay
        }
      };
    });
  };

  const handleProcessPayroll = async () => {
    if (!selectedCycleId) return;
    
    setIsProcessing(true);
    
    if (isMock) {
      setTimeout(() => {
        toast.success(`Successfully processed payroll (Demo Mode)`);
        setIsProcessing(false);
      }, 1000);
      return;
    }

    let successCount = 0;
    
    try {
      for (const empId in entries) {
        const entry = entries[empId];
        if (entry.processed) continue;

        await pb.collection('salary_slips').create({
          employee: empId,
          cycle: selectedCycleId,
          gross_pay: entry.baseSalary + entry.bonuses,
          deductions: entry.deductions,
          net_pay: entry.netPay,
        });
        
        setEntries(prev => ({
          ...prev,
          [empId]: { ...prev[empId], processed: true }
        }));
        successCount++;
      }
      
      // Update cycle status to approved if all processed
      await pb.collection('payroll_cycles').update(selectedCycleId, { status: 'approved' });
      
      toast.success(`Successfully processed payroll for ${successCount} employees`);
      fetchData();
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Permission denied: Please check Pocketbase API Rules.');
      } else if (err.status === 404) {
        toast.error('Resource not found: Please check your Pocketbase collections.');
      } else {
        toast.error('Failed to process some payroll entries');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);

  if (isLoading) {
    return <PayrollSkeleton />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
          <p className="text-slate-500 mt-1">Calculate and process monthly employee salaries</p>
        </div>
        
        <Dialog open={isCycleModalOpen} onOpenChange={setIsCycleModalOpen}>
          <DialogTrigger 
            render={
              <Button className="bg-indigo-600 hover:bg-indigo-700" aria-label="Create a new payroll cycle">
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                New Payroll Cycle
              </Button>
            }
          />
          <DialogContent>
            <form onSubmit={handleCreateCycle} aria-label="Create payroll cycle form">
              <DialogHeader>
                <DialogTitle>Create Payroll Cycle</DialogTitle>
                <DialogDescription>
                  Define a new period for salary processing.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="month_year">Month & Year</Label>
                  <Input 
                    id="month_year" 
                    placeholder="e.g., April 2026" 
                    required 
                    aria-required="true"
                    value={newCycleData.month_year}
                    onChange={e => setNewCycleData({...newCycleData, month_year: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      required 
                      aria-required="true"
                      value={newCycleData.start_date}
                      onChange={e => setNewCycleData({...newCycleData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      required 
                      aria-required="true"
                      value={newCycleData.end_date}
                      onChange={e => setNewCycleData({...newCycleData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-indigo-600">Create Cycle</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Cycle</CardTitle>
            <CardDescription>Choose a period to process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="w-full" aria-label="Select payroll cycle">
                <SelectValue placeholder="Select a cycle" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map(cycle => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.month_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCycle && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-3" role="region" aria-label="Cycle details">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <Badge variant={selectedCycle.status === 'paid' ? 'default' : 'secondary'}>
                    {selectedCycle.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start</span>
                  <span className="font-medium">{format(new Date(selectedCycle.start_date), 'MMM dd')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">End</span>
                  <span className="font-medium">{format(new Date(selectedCycle.end_date), 'MMM dd')}</span>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full bg-indigo-600" 
              disabled={!selectedCycle || selectedCycle.status !== 'draft' || isProcessing}
              onClick={handleProcessPayroll}
              aria-label="Process all payroll entries for this cycle"
              aria-busy={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" /> : <Calculator className="w-4 h-4 mr-2" aria-hidden="true" />}
              Process All Payroll
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Base Salary</TableHead>
                  <TableHead className="font-semibold">Bonuses</TableHead>
                  <TableHead className="font-semibold">Deductions</TableHead>
                  <TableHead className="font-semibold">Net Pay</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No employees to process.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => {
                    const entry = entries[emp.id] || { baseSalary: 0, bonuses: 0, deductions: 0, netPay: 0, processed: false };
                    return (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{emp.full_name}</div>
                          <div className="text-xs text-slate-500">{emp.employee_id}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          ${emp.base_salary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            className="w-24 h-8 text-sm" 
                            value={entry.bonuses}
                            onChange={e => updateEntry(emp.id, 'bonuses', parseFloat(e.target.value) || 0)}
                            disabled={entry.processed || selectedCycle?.status !== 'draft'}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            className="w-24 h-8 text-sm text-red-600" 
                            value={entry.deductions}
                            onChange={e => updateEntry(emp.id, 'deductions', parseFloat(e.target.value) || 0)}
                            disabled={entry.processed || selectedCycle?.status !== 'draft'}
                          />
                        </TableCell>
                        <TableCell className="font-bold text-indigo-600">
                          ${entry.netPay.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.processed ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Processed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {page < totalPages && (
              <div className="p-4 border-t border-slate-100 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore} 
                  disabled={isFetchingMore}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Employees'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
