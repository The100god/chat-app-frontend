'use client'

import { Suspense } from 'react';
import AuthForm from '../../components/AuthForm';

export default function SignupPage() {
  return (
<Suspense fallback={<div>Loading...</div>}>
    <AuthForm type="signup" />;
</Suspense> 
  )
}
