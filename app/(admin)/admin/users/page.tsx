import { createClient } from '@/lib/supabase/server';
import UserManagementClient from './_components/user-management-client';

export default async function UserManagementPage() {
  const supabase = createClient();

  // Initial data fetch on the server
  const { data: users, error } = await supabase.rpc('get_all_users');

  if (error) {
    console.error('Error fetching users:', error);
    // Render an error state, but still pass an empty array to the client component
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        User Management
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Here you can view and manage all users in the system.
      </p>
      <div className="mt-8">
        <UserManagementClient initialUsers={users || []} />
      </div>
    </div>
  );
}