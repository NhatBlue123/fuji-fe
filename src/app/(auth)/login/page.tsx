import LoginForm from '@/components/auth/LoginForm';
import AuthBackground from '@/components/auth/background/AuthBackground';

export default function LoginPage() {
  return (
    <AuthBackground>
      <LoginForm />
    </AuthBackground>
  );
}
