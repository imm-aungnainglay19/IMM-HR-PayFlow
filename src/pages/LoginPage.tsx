import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Mail, Loader2 } from 'lucide-react';
import pb from '@/src/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Default credentials for testing
    if (email === 'admin' && password === 'changeme') {
      pb.authStore.save('mock-token', {
        id: 'mock-admin-id',
        email: 'admin@payflow.com',
        full_name: 'Demo Admin',
        collectionName: 'admins',
        collectionId: 'mock-collection-id',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });
      toast.success('Logged in with demo credentials');
      navigate('/admin');
      setIsLoading(false);
      return;
    }

    try {
      // Attempt to login as admin first
      try {
        const authData = await pb.collection('admins').authWithPassword(email, password);
        if (authData) {
          toast.success('Successfully logged in as Admin');
          navigate('/admin');
          return;
        }
      } catch (adminErr) {
        // If admin login fails, try employee login
        try {
          const authData = await pb.collection('employees').authWithPassword(email, password);
          if (authData) {
            toast.success('Successfully logged in as Employee');
            navigate('/employee');
            return;
          }
        } catch (employeeErr) {
          toast.error('Invalid credentials');
        }
      }
    } catch (err) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <CreditCard className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PayFlow</h1>
          <p className="text-slate-500 mt-2">Enterprise HR & Payroll Management</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Username or Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="text" 
                    placeholder="admin or name@company.com" 
                    className="pl-10 border-slate-200 focus:ring-indigo-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 border-slate-200 focus:ring-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-sm text-slate-500">
          Securely powered by PocketBase
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
