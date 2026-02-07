import RegisterForm from '@/components/auth/RegisterForm';
import AuthBackground from '@/components/auth/background/AuthBackground';

export default function RegisterPage() {
  return (
    <AuthBackground>
      <RegisterForm />
    </AuthBackground>
  );
}
