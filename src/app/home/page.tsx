import { redirect } from 'next/navigation';

// The platform now lives at the root; /home was the pre-launch bypass URL.
export default function HomeRedirect() {
  redirect('/');
}
