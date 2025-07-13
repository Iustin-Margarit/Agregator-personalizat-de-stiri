import React from 'react';
import SourceManagementClient from './_components/source-management-client';

export default function ContentManagementPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Content & Source Management
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Here you can view, edit, and enable/disable all news sources.
      </p>
      <div className="mt-8">
        <SourceManagementClient />
      </div>
    </div>
  );
}