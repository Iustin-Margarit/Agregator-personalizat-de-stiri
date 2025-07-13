'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

type User = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

interface UserManagementClientProps {
  initialUsers: User[];
}

export default function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase.auth]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setLoading((prev) => ({ ...prev, [userId]: true }));

    const { error } = await supabase.rpc('update_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
    });

    if (error) {
      showToast({
        title: 'Error updating role',
        message: error.message,
        type: 'error',
      });
    } else {
      showToast({
        title: 'Role updated successfully',
        message: `User has been made a ${newRole}.`,
        type: 'success',
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    }
    setLoading((prev) => ({ ...prev, [userId]: false }));
  };

  const openConfirmationModal = (user: User) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setUserToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading((prev) => ({ ...prev, [userToDelete.id]: true }));

    const { error } = await supabase.rpc('delete_user', {
      p_user_id: userToDelete.id,
    });

    if (error) {
      showToast({
        title: 'Error deleting user',
        message: error.message,
        type: 'error',
      });
    } else {
      showToast({
        title: 'User deleted successfully',
        message: `User ${userToDelete.email} has been deleted.`,
        type: 'success',
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete.id));
    }
    setLoading((prev) => ({ ...prev, [userToDelete.id]: false }));
    closeConfirmationModal();
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{user.email ?? 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <select
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                    value={user.role || 'user'}
                    disabled={loading[user.id] || user.id === currentUser?.id}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={user.id === currentUser?.id ? "You cannot change your own role." : ""}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openConfirmationModal(user)}
                    disabled={loading[user.id] || user.id === currentUser?.id}
                    title={user.id === currentUser?.id ? "You cannot delete your own account." : ""}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleDeleteUser}
        title="Are you sure?"
        description={`This will permanently delete the user ${userToDelete?.email}. This action cannot be undone.`}
        confirmText="Delete"
        isLoading={userToDelete ? loading[userToDelete.id] : false}
      />
    </>
  );
}