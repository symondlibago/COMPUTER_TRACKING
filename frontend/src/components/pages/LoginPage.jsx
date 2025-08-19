import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  User, 
  LogIn, 
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react';
import API_BASE_URL from './Config';

function LoginPage() {
  const navigate = useNavigate();
  const { dispatch, ActionTypes } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [adminLogin, setAdminLogin] = useState({
    username: '',
    password: ''
  });
  const [studentLogin, setStudentLogin] = useState({
    studentId: '',
    password: '',
    hours: 2
  });
  const [errors, setErrors] = useState({});

  // Handle admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminLogin.username,
          password: adminLogin.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token
        localStorage.setItem("auth_token", data.data.token);
        
        // Store user data for persistence
        localStorage.setItem("user_data", JSON.stringify({
          user: data.data.user,
          userType: "admin"
        }));

        dispatch({
          type: ActionTypes.LOGIN,
          payload: {
            user: data.data.user,
            userType: "admin",
          },
        });

        navigate("/admin/dashboard");
      } else {
        setErrors({ admin: data.message });
      }
    } catch (error) {
      setErrors({ admin: "Network error occurred" });
    }
  };

  // Handle student login
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/student/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentLogin.studentId,
          password: studentLogin.password,
          hours: studentLogin.hours,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token
        localStorage.setItem("auth_token", data.data.token);
        
        // Store user data for persistence (including student_id)
        localStorage.setItem("user_data", JSON.stringify({
          user: data.data.user,
          userType: "student",
          student_id: data.data.user.student_id || studentLogin.studentId
        }));

        dispatch({
          type: ActionTypes.LOGIN,
          payload: {
            user: data.data.user,
            userType: "student",
          },
        });

        navigate("/student");
      } else {
        setErrors({ student: data.message });
      }
    } catch (error) {
      setErrors({ student: "Network error occurred" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="p-3 bg-primary rounded-xl">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold">PC Monitor Pro</h1>
              <p className="text-sm text-muted-foreground">Computer Lab Management</p>
            </div>
          </motion.div>
          <p className="text-muted-foreground">
            Sign in to access the computer lab management system
          </p>
        </div>

        {/* Login Tabs */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Choose your account type to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student
                </TabsTrigger>
              </TabsList>

              {/* Admin Login */}
              <TabsContent value="admin">
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleAdminLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Enter admin username"
                      value={adminLogin.username}
                      onChange={(e) => setAdminLogin({...adminLogin, username: e.target.value})}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        value={adminLogin.password}
                        onChange={(e) => setAdminLogin({...adminLogin, password: e.target.value})}
                        className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {errors.admin && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {errors.admin}
                    </motion.p>
                  )}
                  <Button type="submit" className="w-full btn-energy">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In as Admin
                  </Button>
                  <div className="text-xs text-center text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
                    <strong>Demo Credentials:</strong><br />
                    Username: admin<br />
                    Password: admin123
                  </div>
                </motion.form>
              </TabsContent>

              {/* Student Login */}
              <TabsContent value="student">
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleStudentLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      type="text"
                      placeholder="Enter your student ID"
                      value={studentLogin.studentId}
                      onChange={(e) => setStudentLogin({...studentLogin, studentId: e.target.value})}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="student-password"
                        type={showStudentPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={studentLogin.password}
                        onChange={(e) => setStudentLogin({...studentLogin, password: e.target.value})}
                        className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                      >
                        {showStudentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {errors.student && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {errors.student}
                    </motion.p>
                  )}
                  <Button type="submit" className="w-full btn-energy">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In as Student
                  </Button>
                  <div className="text-xs text-center text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
                    <strong>Demo Credentials:</strong><br />
                    Student ID: 2024001-2024010<br />
                    Password: student123
                  </div>
                </motion.form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-sm text-muted-foreground"
        >
          <p>© 2024 PC Monitor Pro. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LoginPage;

