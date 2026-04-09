import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  UserPlus, 
  Calendar, 
  DollarSign,
  Briefcase,
  Loader2,
  Building2,
  Pencil,
  Trash2
} from 'lucide-react';
import pb from '../lib/pocketbase';
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
} from '../../components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '../AuthContext';

import { EmployeeSkeleton } from '../components/skeletons/PageSkeletons';

const employeeSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  employee_id: z.string().min(1, 'Employee ID is required'),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  job_title: z.string().min(1, 'Job title is required'),
  salary_template: z.string().min(1, 'Salary template is required'),
  joining_date: z.string().min(1, 'Joining date is required'),
  base_salary: z.number().min(0, 'Base salary must be a positive number'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Department {
  id: string;
  name: string;
}

interface JobTitle {
  id: string;
  title: string;
  base_salary?: number;
}

interface SalaryTemplate {
  id: string;
  template_name: string;
  basic_salary: number;
  allowances: number;
  tax_rate: number;
}

interface Employee {
  id: string;
  full_name: string;
  employee_id: string;
  position: string;
  department: string;
  job_title: string;
  salary_template: string;
  joining_date: string;
  base_salary: number;
  email: string;
  expand?: {
    department?: Department;
    job_title?: JobTitle;
    salary_template?: SalaryTemplate;
  };
}

const EmployeeManagement: React.FC = () => {
  const { user } = useAuth();
  const isMock = user?.id === 'mock-admin-id';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [salaryTemplates, setSalaryTemplates] = useState<SalaryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    control, 
    reset, 
    setValue, 
    watch,
    formState: { errors } 
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      employee_id: '',
      position: '',
      department: '',
      job_title: '',
      salary_template: '',
      joining_date: format(new Date(), 'yyyy-MM-dd'),
      base_salary: 0,
    }
  });

  const watchJobTitle = watch('job_title');
  const watchSalaryTemplate = watch('salary_template');

  const selectedTemplate = salaryTemplates.find(t => t.id === watchSalaryTemplate);

  useEffect(() => {
    if (watchJobTitle) {
      const job = jobTitles.find(j => j.id === watchJobTitle);
      if (job) {
        setValue('position', job.title);
        if (job.base_salary) setValue('base_salary', job.base_salary);
      }
    }
  }, [watchJobTitle, jobTitles, setValue]);

  useEffect(() => {
    if (watchSalaryTemplate) {
      const template = salaryTemplates.find(t => t.id === watchSalaryTemplate);
      if (template) {
        setValue('base_salary', template.basic_salary);
      }
    }
  }, [watchSalaryTemplate, salaryTemplates, setValue]);

  useEffect(() => {
    if (editingEmployee) {
      reset({
        full_name: editingEmployee.full_name,
        email: editingEmployee.email,
        password: '',
        employee_id: editingEmployee.employee_id,
        position: editingEmployee.position,
        department: editingEmployee.department,
        job_title: editingEmployee.job_title,
        salary_template: editingEmployee.salary_template,
        joining_date: editingEmployee.joining_date.split(' ')[0], // Handle potential time string
        base_salary: editingEmployee.base_salary,
      });
    } else {
      reset({
        full_name: '',
        email: '',
        password: '',
        employee_id: '',
        position: '',
        department: '',
        job_title: '',
        salary_template: '',
        joining_date: format(new Date(), 'yyyy-MM-dd'),
        base_salary: 0,
      });
    }
  }, [editingEmployee, reset]);

  const fetchMetadata = async () => {
    if (isMock) {
      setDepartments([
        { id: 'd1', name: 'Engineering' },
        { id: 'd2', name: 'Product' },
        { id: 'd3', name: 'HR' }
      ]);
      setJobTitles([
        { id: 'j1', title: 'Software Engineer', base_salary: 5000 },
        { id: 'j2', title: 'Product Manager', base_salary: 6000 }
      ]);
      setSalaryTemplates([
        { id: 't1', template_name: 'Standard Tech', basic_salary: 4500, tax_rate: 10, allowances: 500 }
      ]);
      return;
    }

    try {
      const [deptRecords, jobRecords, templateRecords] = await Promise.all([
        pb.collection('departments').getFullList<Department>({ sort: 'name' }),
        pb.collection('job_titles').getFullList<JobTitle>({ sort: 'title' }),
        pb.collection('salary_templates').getFullList<SalaryTemplate>({ sort: 'name' })
      ]);
      setDepartments(deptRecords);
      setJobTitles(jobRecords);
      setSalaryTemplates(templateRecords);
    } catch (err: any) {
      console.error('Failed to fetch metadata:', err);
      const message = err.message || 'Failed to fetch metadata';
      if (err.status === 403) {
        toast.error('Permission denied: Please ensure your Pocketbase API Rules allow access to departments, job_titles, and salary_templates.');
      } else if (err.status === 404) {
        toast.error('Collections not found: Please ensure departments, job_titles, and salary_templates collections exist.');
      } else {
        toast.error(message);
      }
    }
  };

  const fetchEmployees = async (pageToFetch = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    if (isMock) {
      setTimeout(() => {
        const mockData = [
          {
            id: '1',
            full_name: 'John Doe',
            employee_id: 'EMP-001',
            position: 'Software Engineer',
            department: 'd1',
            job_title: 'j1',
            salary_template: 't1',
            joining_date: '2023-01-15',
            base_salary: 5000,
            email: 'john@example.com',
            expand: {
              department: { id: 'd1', name: 'Engineering' },
              job_title: { id: 'j1', title: 'Software Engineer' },
              salary_template: { id: 't1', template_name: 'Standard Tech', basic_salary: 4500, tax_rate: 10, allowances: 500 }
            }
          },
          {
            id: '2',
            full_name: 'Jane Smith',
            employee_id: 'EMP-002',
            position: 'Product Manager',
            department: 'd2',
            job_title: 'j2',
            salary_template: 't2',
            joining_date: '2023-03-10',
            base_salary: 6000,
            email: 'jane@example.com',
            expand: {
              department: { id: 'd2', name: 'Product' },
              job_title: { id: 'j2', title: 'Product Manager' },
              salary_template: { id: 't2', template_name: 'Senior Management', basic_salary: 5500, tax_rate: 15, allowances: 500 }
            }
          }
        ];
        
        if (isLoadMore) {
          setEmployees(prev => [...prev, ...mockData.map(e => ({ ...e, id: e.id + prev.length }))]);
        } else {
          setEmployees(mockData);
        }
        
        setTotalPages(1);
        setIsLoading(false);
        setIsFetchingMore(false);
      }, 500);
      return;
    }

    try {
      const result = await pb.collection('employees').getList<Employee>(pageToFetch, 50, {
        sort: '-created',
        expand: 'department,job_title,salary_template'
      });
      
      if (isLoadMore) {
        setEmployees(prev => [...prev, ...result.items]);
      } else {
        setEmployees(result.items);
      }
      
      setTotalPages(result.totalPages);
      setPage(result.page);

      // Check for missing expansions (likely permission issues)
      const hasMissingExpansions = result.items.some(emp => 
        (emp.department && !emp.expand?.department) || 
        (emp.job_title && !emp.expand?.job_title) ||
        (emp.salary_template && !emp.expand?.salary_template)
      );

      if (hasMissingExpansions) {
        toast.warning('Some relational data is restricted. Admin: Please check Pocketbase API permissions for departments, job_titles, and salary_templates collections.', {
          duration: 6000
        });
      }
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Permission denied: Please check Pocketbase API Rules.');
      } else if (err.status === 404) {
        toast.error('Resource not found: Please check your Pocketbase collections.');
      } else {
        toast.error('Failed to fetch employees');
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
    fetchMetadata();
  }, []);

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchEmployees(page + 1, true);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);

    if (isMock) {
      setTimeout(() => {
        toast.success(editingEmployee ? 'Employee updated successfully (Demo Mode)' : 'Employee added successfully (Demo Mode)');
        setIsModalOpen(false);
        setEditingEmployee(null);
        setIsSubmitting(false);
      }, 500);
      return;
    }

    try {
      if (editingEmployee) {
        const updateData: any = { ...data };
        if (!updateData.password) delete updateData.password;
        
        await pb.collection('employees').update(editingEmployee.id, updateData);
        toast.success('Employee updated successfully');
      } else {
        await pb.collection('employees').create({
          ...data,
          passwordConfirm: data.password,
          emailVisibility: true,
        });
        toast.success('Employee added successfully');
      }
      
      setIsModalOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;

    if (isMock) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully (Demo Mode)');
      return;
    }

    try {
      await pb.collection('employees').delete(id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee');
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
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingEmployee(null);
        }}>
          <DialogTrigger 
            render={
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700" 
                aria-label="Add a new employee to the system"
                onClick={() => {
                  setEditingEmployee(null);
                  setIsModalOpen(true);
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add New Employee
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit(onSubmit)} aria-label={editingEmployee ? "Edit employee form" : "Add employee form"}>
              <DialogHeader>
                <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                <DialogDescription>
                  {editingEmployee ? 'Update the employee profile information.' : 'Create a new employee profile and authentication account.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input 
                      id="full_name" 
                      {...register('full_name')}
                      aria-invalid={!!errors.full_name}
                      aria-describedby={errors.full_name ? "full_name-error" : undefined}
                    />
                    {errors.full_name && (
                      <p id="full_name-error" className="text-xs text-destructive">{errors.full_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input 
                      id="employee_id" 
                      placeholder="EMP-001" 
                      {...register('employee_id')}
                      aria-invalid={!!errors.employee_id}
                      aria-describedby={errors.employee_id ? "employee_id-error" : undefined}
                    />
                    {errors.employee_id && (
                      <p id="employee_id-error" className="text-xs text-destructive">{errors.employee_id.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingEmployee ? 'New Password (Optional)' : 'Initial Password'}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  {errors.password && (
                    <p id="password-error" className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="department" aria-invalid={!!errors.department} aria-describedby={errors.department ? "department-error" : undefined}>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.department && (
                      <p id="department-error" className="text-xs text-destructive">{errors.department.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Controller
                      name="job_title"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="job_title" aria-invalid={!!errors.job_title} aria-describedby={errors.job_title ? "job_title-error" : undefined}>
                            <SelectValue placeholder="Select Job Title" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobTitles.map(job => (
                              <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.job_title && (
                      <p id="job_title-error" className="text-xs text-destructive">{errors.job_title.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary_template">Salary Template</Label>
                    <Controller
                      name="salary_template"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="salary_template" aria-invalid={!!errors.salary_template} aria-describedby={errors.salary_template ? "salary_template-error" : undefined}>
                            <SelectValue placeholder="Select Template" />
                          </SelectTrigger>
                          <SelectContent>
                            {salaryTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.salary_template && (
                      <p id="salary_template-error" className="text-xs text-destructive">{errors.salary_template.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_salary">Basic Pay ($)</Label>
                    <Input 
                      id="base_salary" 
                      type="number" 
                      {...register('base_salary', { valueAsNumber: true })}
                      aria-invalid={!!errors.base_salary}
                      aria-describedby={errors.base_salary ? "base_salary-error" : undefined}
                    />
                    {errors.base_salary && (
                      <p id="base_salary-error" className="text-xs text-destructive">{errors.base_salary.message}</p>
                    )}
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      Compensation Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <span className="text-slate-500">Basic Salary:</span>
                      <span className="text-right font-medium">${selectedTemplate.basic_salary.toLocaleString()}</span>
                      
                      <span className="text-slate-500">Allowances:</span>
                      <span className="text-right font-medium">${selectedTemplate.allowances.toLocaleString()}</span>
                      
                      <div className="col-span-2 border-t border-slate-200 my-1"></div>
                      
                      <span className="text-slate-500">Tax Rate:</span>
                      <span className="text-right font-medium text-red-600">{selectedTemplate.tax_rate}%</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="joining_date">Joining Date</Label>
                  <Input 
                    id="joining_date" 
                    type="date" 
                    {...register('joining_date')}
                    aria-invalid={!!errors.joining_date}
                    aria-describedby={errors.joining_date ? "joining_date-error" : undefined}
                  />
                  {errors.joining_date && (
                    <p id="joining_date-error" className="text-xs text-destructive">{errors.joining_date.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-indigo-600" disabled={isSubmitting} aria-busy={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : (editingEmployee ? 'Update Employee' : 'Create Employee Profile')}
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {emp.expand?.job_title?.title || (emp.job_title ? <span className="text-amber-600 italic text-xs">Restricted</span> : emp.position)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="w-3 h-3" />
                        {emp.expand?.department?.name || (emp.department ? <span className="text-amber-600 italic">Restricted</span> : 'No Department')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(emp.joining_date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 font-semibold text-slate-900">
                        <DollarSign className="w-3 h-3" />
                        {emp.base_salary.toLocaleString()}
                      </div>
                      {emp.salary_template && (
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                          {emp.expand?.salary_template?.template_name || <span className="text-amber-600 lowercase italic">Restricted</span>}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${emp.full_name}`}>
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingEmployee(emp);
                          setIsModalOpen(true);
                        }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteEmployee(emp.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
  );
};

export default EmployeeManagement;
