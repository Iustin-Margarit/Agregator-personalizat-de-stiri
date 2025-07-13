import React from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-center h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-white dark:bg-gray-800">
            <Link href="/admin/dashboard" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">
              Dashboard
            </Link>
            <Link href="/admin/users" className="flex items-center px-4 py-2 mt-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">
              User Management
            </Link>
            <Link href="/admin/content" className="flex items-center px-4 py-2 mt-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">
              Content Management
            </Link>
          </nav>
        </div>
        <div className="px-2 py-4 border-t dark:border-gray-700">
            <Link href="/feed" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">
                Return to Site
            </Link>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-700">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}