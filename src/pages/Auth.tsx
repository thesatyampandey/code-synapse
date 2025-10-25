import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ripple, AuthTabs, TechOrbitDisplay } from '@/components/ui/modern-animated-sign-in';
import { Code2, FileCode, GitBranch, Terminal, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const navigate = useNavigate();
  const { toast } = useToast();

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
    
    // Mock authentication
    toast({
      title: "Login successful",
      description: "Welcome back to CodeSync!",
    });
    
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const goToForgotPassword = (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    event.preventDefault();
    toast({
      title: "Password reset",
      description: "Password reset feature coming soon!",
    });
  };

  const formFields = {
    header: 'Welcome to CodeSync',
    subHeader: 'Sign in to start collaborating',
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
    submitButton: 'Sign in',
    textVariantButton: 'Forgot password?',
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
          goTo={goToForgotPassword}
          handleSubmit={handleSubmit}
        />
      </span>
    </section>
  );
}
