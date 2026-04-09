import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  UserPlus, 
  Calendar, 
  DollarSign,
  Briefcase,
  Loader2
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { EmployeeSkeleton } from '@/src/components/skeletons/PageSkeletons';

interface Employee {
  id: string;
  full_name: string;
  employee_id: string;
  position: string;
  joining_date: string;
  base_salary: number;
  email: string;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    employee_id: '',
    position: '',
    joining_date: format(new Date(), 'yyyy-MM-dd'),
    base_salary: 0,
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const records = await pb.collection('employees').getFullList<Employee>({
        sort: '-created',
      });
      setEmployees(records);
    } catch (err) {
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create auth record
      await pb.collection('employees').create({
        ...formData,
        passwordConfirm: formData.password,
        emailVisibility: true,
      });
      
      toast.success('Employee added successfully');
      setIsAddModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        employee_id: '',
        position: '',
        joining_date: format(new Date(), 'yyyy-MM-dd'),
        base_salary: 0,
      });
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <EmployeeSkeleton />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
          <p className="text-slate-500 mt-1">View and manage your organization's workforce</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700" aria-label="Add a new employee to the system">
              <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add New Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleAddEmployee} aria-label="Add employee form">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee profile and authentication account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input 
                      id="full_name" 
                      required 
                      aria-required="true"
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input 
                      id="employee_id" 
                      placeholder="EMP-001" 
                      required 
                      aria-required="true"
                      value={formData.employee_id}
                      onChange={e => setFormData({...formData, employee_id: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    aria-required="true"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    aria-required="true"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input 
                      id="position" 
                      required 
                      aria-required="true"
                      value={formData.position}
                      onChange={e => setFormData({...formData, position: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_salary">Base Salary ($)</Label>
                    <Input 
                      id="base_salary" 
                      type="number" 
                      required 
                      aria-required="true"
                      value={formData.base_salary}
                      onChange={e => setFormData({...formData, base_salary: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joining_date">Joining Date</Label>
                  <Input 
                    id="joining_date" 
                    type="date" 
                    required 
                    aria-required="true"
                    value={formData.joining_date}
                    onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-indigo-600" disabled={isSubmitting} aria-busy={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : 'Create Employee Profile'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" role="region" aria-label="Employee list">
        <div className="p-4 border-bottom border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input 
              placeholder="Search by name, ID or position..." 
              className="pl-10 bg-slate-50 border-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search employees"
            />
          </div>
          <Button variant="outline" size="icon" aria-label="More options">
            <Plus className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Position</TableHead>
              <TableHead className="font-semibold">Joining Date</TableHead>
              <TableHead className="font-semibold">Base Salary</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {emp.full_name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{emp.full_name}</span>
                        <span className="text-xs text-slate-500">{emp.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {emp.employee_id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase className="w-3 h-3" />
                      {emp.position}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(emp.joining_date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                      <DollarSign className="w-3 h-3" />
                      {emp.base_salary.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </Button>
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

export default EmployeeManagement;
