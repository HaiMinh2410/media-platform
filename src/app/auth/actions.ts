'use server';

import { createClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const supabase = createClient();
  const { error } = await (await supabase).auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard/settings/accounts');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  
  const supabase = createClient();
  const { error } = await (await supabase).auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard/settings/accounts`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
