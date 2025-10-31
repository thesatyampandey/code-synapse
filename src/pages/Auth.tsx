import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ripple, AuthTabs, TechOrbitDisplay } from '@/components/ui/modern-animated-sign-in';
import { Code2, FileCode, GitBranch, Terminal, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type FormData = {
  email: string;
  password: string;
};

const iconsArray = [
  {
    component: () => <Code2 className="w-8 h-8 text-primary" />,
    className: 'size-[50px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => <FileCode className="w-8 h-8 text-cyan-500" />,
    className: 'size-[50px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => <GitBranch className="w-10 h-10 text-purple-500" />,
    className: 'size-[60px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => <Terminal className="w-10 h-10 text-green-500" />,
    className: 'size-[60px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => <Users className="w-8 h-8 text-blue-500" />,
    className: 'size-[50px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => <Zap className="w-8 h-8 text-yellow-500" />,
    className: 'size-[50px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true,
  },
];

export default function Auth() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to CodeSync! You're now logged in.",
        });
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Login successful",
          description: "Welcome back to CodeSync!",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Signup failed" : "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    event.preventDefault();
    setIsSignUp(!isSignUp);
  };

  const formFields = {
    header: 'Welcome to CodeSync',
    subHeader: isSignUp ? 'Create an account to start collaborating' : 'Sign in to start collaborating',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'Enter your email address',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password' as const,
        placeholder: 'Enter your password',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: loading ? 'Please wait...' : (isSignUp ? 'Sign up' : 'Sign in'),
    textVariantButton: isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up',
  };

  return (
    <section className='flex max-lg:justify-center min-h-screen bg-background dark'>
      {/* Left Side */}
      <span className='flex flex-col justify-center w-1/2 max-lg:hidden relative'>
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay iconsArray={iconsArray} text="CodeSync" />
      </span>

      {/* Right Side */}
      <span className='w-1/2 min-h-screen flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]'>
        <AuthTabs
          formFields={formFields}
          goTo={toggleAuthMode}
          handleSubmit={handleSubmit}
        />
      </span>
    </section>
  );
}
