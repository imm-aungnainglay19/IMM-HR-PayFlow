import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Search,
  Receipt
} from 'lucide-react';
import pb from '../lib/pocketbase';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../../components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';

interface Department {
  id: string;
  name: string;
  description?: string;
  created: string;
}

interface JobTitle {
  id: string;
  title: string;
  department: string;
  base_salary?: number;
  expand?: {
    department: Department;
  };
  created: string;
}

interface SalaryTemplate {
  id: string;
  template_name: string;
  basic_salary: number;
  allowances: number;
  tax_rate: number;
  created: string;
}

const OrganizationSettings: React.FC = () => {
  const { user } = useAuth();
  const isMock = user?.id === 'mock-admin-id';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [salaryTemplates, setSalaryTemplates] = useState<SalaryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form states
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [editingJob, setEditingJob] = useState<JobTitle | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateBasicSalary, setTemplateBasicSalary] = useState('');
  const [templateTaxRate, setTemplateTaxRate] = useState('');
  const [templateAllowances, setTemplateAllowances] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<SalaryTemplate | null>(null);

  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    
    if (isMock) {
      setTimeout(() => {
        const mockDepts: Department[] = [
          { id: 'd1', name: 'Engineering', description: 'Software and Hardware', created: new Date().toISOString() },
          { id: 'd2', name: 'Product', description: 'Product Management', created: new Date().toISOString() },
          { id: 'd3', name: 'HR', description: 'Human Resources', created: new Date().toISOString() }
        ];
        const mockJobs: JobTitle[] = [
          { id: 'j1', title: 'Software Engineer', department: 'd1', base_salary: 5000, created: new Date().toISOString(), expand: { department: mockDepts[0] } },
          { id: 'j2', title: 'Product Manager', department: 'd2', base_salary: 6000, created: new Date().toISOString(), expand: { department: mockDepts[1] } }
        ];
        const mockTemplates: SalaryTemplate[] = [
          { 
            id: 't1', 
            template_name: 'Standard Tech', 
            basic_salary: 4500, 
            tax_rate: 10, 
            allowances: 500, 
            created: new Date().toISOString() 
          }
        ];
        setDepartments(mockDepts);
        setJobTitles(mockJobs);
        setSalaryTemplates(mockTemplates);
        if (showLoader) setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const [deptRecords, jobRecords, templateRecords] = await Promise.all([
        pb.collection('departments').getFullList<Department>({ sort: 'name' }),
        pb.collection('job_titles').getFullList<JobTitle>({ sort: 'title', expand: 'department' }),
        pb.collection('salary_templates').getFullList<SalaryTemplate>({ sort: 'template_name' })
      ]);
      setDepartments(deptRecords);
      setJobTitles(jobRecords);
      setSalaryTemplates(templateRecords);
    } catch (err: any) {
      console.error('Failed to fetch organization data', err);
      const message = err.message || 'Failed to load settings. Please check your connection.';
      
      if (err.status === 403) {
        toast.error('Permission denied: Please ensure your Pocketbase API Rules allow access to departments and job_titles collections.');
      } else if (err.status === 404) {
        toast.error('Collections not found: Please ensure departments and job_titles collections exist in your Pocketbase.');
      } else {
        toast.error(message);
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Department CRUD
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const data = { name: deptName, description: deptDesc };
      if (editingDept) {
        await pb.collection('departments').update(editingDept.id, data);
      } else {
        await pb.collection('departments').create(data);
      }
      
      // Re-fetch data first
      await fetchData(false);
      
      // Success toast and close modal after re-fetch
      toast.success(editingDept ? 'Department updated successfully' : 'Department created successfully');
      setIsDeptDialogOpen(false);
      setDeptName('');
      setDeptDesc('');
      setEditingDept(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save department');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      await pb.collection('departments').delete(id);
      await fetchData(false);
      toast.success('Department deleted and table updated');
    } catch (err: any) {
      toast.error('Failed to delete department. It might be in use.');
    }
  };

  // Job Title CRUD
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDept) {
      toast.error('Please select a department');
      return;
    }
    setIsActionLoading(true);
    try {
      const data = { 
        title: jobTitle, 
        department: jobDept, 
        base_salary: parseFloat(jobSalary) || 0 
      };
      if (editingJob) {
        await pb.collection('job_titles').update(editingJob.id, data);
      } else {
        await pb.collection('job_titles').create(data);
      }
      
      // Re-fetch data first
      await fetchData(false);
      
      // Success toast and close modal after re-fetch
      toast.success(editingJob ? 'Job title updated successfully' : 'Job title created successfully');
      setIsJobDialogOpen(false);
      setJobTitle('');
      setJobDept('');
      setJobSalary('');
      setEditingJob(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save job title');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await pb.collection('job_titles').delete(id);
      await fetchData(false);
      toast.success('Job title deleted and table updated');
    } catch (err: any) {
      toast.error('Failed to delete job title');
    }
  };

  // Salary Template CRUD
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const data = {
        template_name: templateName,
        basic_salary: parseFloat(templateBasicSalary) || 0,
        tax_rate: parseFloat(templateTaxRate) || 0,
        allowances: parseFloat(templateAllowances) || 0
      };
      if (editingTemplate) {
        await pb.collection('salary_templates').update(editingTemplate.id, data);
      } else {
        await pb.collection('salary_templates').create(data);
      }
      
      // Re-fetch data first
      await fetchData(false);
      
      // Success toast and close modal after re-fetch
      toast.success(editingTemplate ? 'Salary template updated successfully' : 'Salary template created successfully');
      setIsTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateBasicSalary('');
      setTemplateTaxRate('');
      setTemplateAllowances('');
      setEditingTemplate(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save salary template');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await pb.collection('salary_templates').delete(id);
      await fetchData(false);
      toast.success('Salary template deleted and table updated');
    } catch (err: any) {
      toast.error('Failed to delete salary template');
    }
  };

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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-slate-500 mt-1">Manage your company structure, departments, and roles</p>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="job_titles" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Titles
          </TabsTrigger>
          <TabsTrigger value="salary_templates" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Salary Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Departments</h2>
            <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
              <DialogTrigger 
                render={
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                    setEditingDept(null);
                    setDeptName('');
                    setDeptDesc('');
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
                  <DialogDescription>
                    Create a new organizational unit for your company.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveDept} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input 
                      id="dept-name" 
                      placeholder="e.g. Engineering, Marketing" 
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-desc">Description (Optional)</Label>
                    <Input 
                      id="dept-desc" 
                      placeholder="Brief description of the department" 
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isActionLoading}>
                      {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingDept ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                      No departments found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-slate-500">{dept.description || '-'}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(dept.created).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger 
                            render={
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingDept(dept);
                              setDeptName(dept.name);
                              setDeptDesc(dept.description || '');
                              setIsDeptDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDept(dept.id)}>
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
          </Card>
        </TabsContent>

        <TabsContent value="job_titles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Job Titles</h2>
            <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
              <DialogTrigger 
                render={
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                    setEditingJob(null);
                    setJobTitle('');
                    setJobDept('');
                    setJobSalary('');
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Job Title
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingJob ? 'Edit Job Title' : 'Add New Job Title'}</DialogTitle>
                  <DialogDescription>
                    Define a new role and associate it with a department.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveJob} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input 
                      id="job-title" 
                      placeholder="e.g. Senior Developer, HR Manager" 
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-dept">Department</Label>
                    <Select value={jobDept} onValueChange={setJobDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-salary">Base Salary (Monthly)</Label>
                    <Input 
                      id="job-salary" 
                      type="number"
                      placeholder="0.00" 
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isActionLoading}>
                      {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingJob ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobTitles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                      No job titles found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobTitles.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">
                          {job.expand?.department?.name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${job.base_salary?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger 
                            render={
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingJob(job);
                              setJobTitle(job.title);
                              setJobDept(job.department);
                              setJobSalary(job.base_salary?.toString() || '');
                              setIsJobDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteJob(job.id)}>
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
          </Card>
        </TabsContent>

        <TabsContent value="salary_templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Salary Templates</h2>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger 
                render={
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                    setEditingTemplate(null);
                    setTemplateName('');
                    setTemplateBasicSalary('');
                    setTemplateTaxRate('');
                    setTemplateAllowances('');
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                }
              />
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Edit Salary Template' : 'Add New Salary Template'}</DialogTitle>
                  <DialogDescription>
                    Define a standard salary structure with allowances and tax rates.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveTemplate} className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input 
                        id="template-name" 
                        placeholder="e.g. Standard Tech, Senior Management" 
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-basic">Basic Salary (Monthly)</Label>
                      <Input 
                        id="template-basic" 
                        type="number"
                        placeholder="0.00" 
                        value={templateBasicSalary}
                        onChange={(e) => setTemplateBasicSalary(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-allowances">Allowances (Total)</Label>
                      <Input 
                        id="template-allowances" 
                        type="number"
                        placeholder="0.00" 
                        value={templateAllowances}
                        onChange={(e) => setTemplateAllowances(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-tax">Tax Rate (%)</Label>
                      <Input 
                        id="template-tax" 
                        type="number"
                        placeholder="0" 
                        value={templateTaxRate}
                        onChange={(e) => setTemplateTaxRate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isActionLoading}>
                      {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingTemplate ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No salary templates found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  salaryTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.template_name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        ${template.basic_salary.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${template.allowances.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.tax_rate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger 
                            render={
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingTemplate(template);
                              setTemplateName(template.template_name);
                              setTemplateBasicSalary(template.basic_salary.toString());
                              setTemplateTaxRate(template.tax_rate.toString());
                              setTemplateAllowances(template.allowances.toString());
                              setIsTemplateDialogOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTemplate(template.id)}>
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationSettings;
