import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={session} />
        <main className="flex-1 p-6 md:p-8 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

