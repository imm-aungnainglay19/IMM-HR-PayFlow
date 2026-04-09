import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import pb from '@/src/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { useAuth } from '@/src/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isMock = user?.id === 'mock-admin-id';
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    activeCycles: 0,
    recentSlips: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      
      if (isMock) {
        // Provide mock data for demo mode
        setTimeout(() => {
          setStats({
            totalEmployees: 12,
            totalPayroll: 45000,
            activeCycles: 2,
            recentSlips: 24
          });
          setIsLoading(false);
        }, 500);
        return;
      }

      try {
        const [employees, cycles, slips] = await Promise.all([
          pb.collection('employees').getList(1, 1),
          pb.collection('payroll_cycles').getList(1, 10, { filter: 'status != "paid"' }),
          pb.collection('salary_slips').getList(1, 100)
        ]);

        const totalPayroll = slips.items.reduce((acc, slip) => acc + slip.net_pay, 0);

        setStats({
          totalEmployees: employees.totalItems,
          totalPayroll: totalPayroll,
          activeCycles: cycles.totalItems,
          recentSlips: slips.totalItems
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
        toast.error('Failed to load dashboard statistics. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Real-time insights into your HR and Payroll operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Employees</CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalEmployees}</div>
            <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Payroll</CardTitle>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">${stats.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1 font-medium">
              Net payout for all cycles
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Cycles</CardTitle>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.activeCycles}</div>
            <p className="text-xs text-indigo-600 flex items-center mt-1 font-medium">
              Cycles in draft or approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Salary Slips</CardTitle>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.recentSlips}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1 font-medium">
              Generated in total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Payroll Trends</CardTitle>
            <CardDescription>Monthly net salary distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 m-6">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Payroll analytics visualization will appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Payroll cycle April 2026 approved</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
