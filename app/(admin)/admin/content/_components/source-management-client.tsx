'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Source = {
  id: string;
  name: string;
  url: string;
  is_enabled: boolean;
  category_id: number;
  category_name: string;
};

export default function SourceManagementClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUrl, setEditingUrl] = useState<Record<string, string>>({});
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSources = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_sources');
      if (error) {
        showToast({
          title: 'Error fetching sources',
          message: error.message,
          type: 'error',
        });
      } else {
        setSources(data || []);
      }
      setLoading(false);
    };
    fetchSources();
  }, [supabase, showToast]);

  const handleToggle = async (source: Source) => {
    const { error } = await supabase.rpc('toggle_source_enabled', {
      p_source_id: source.id,
      p_is_enabled: !source.is_enabled,
    });
    if (error) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
    } else {
      setSources(prev => prev.map(s => s.id === source.id ? { ...s, is_enabled: !s.is_enabled } : s));
      showToast({ title: 'Success', message: `Source ${source.name} has been ${!source.is_enabled ? 'enabled' : 'disabled'}.`, type: 'success' });
    }
  };

  const handleUrlChange = async (sourceId: string) => {
    const newUrl = editingUrl[sourceId];
    if (!newUrl) return;

    const { error } = await supabase.rpc('update_source_url', {
        p_source_id: sourceId,
        p_new_url: newUrl,
    });

    if (error) {
        showToast({ title: 'Error', message: error.message, type: 'error' });
    } else {
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, url: newUrl } : s));
        setEditingUrl(prev => {
            const newState = { ...prev };
            delete newState[sourceId];
            return newState;
        });
        showToast({ title: 'Success', message: 'Source URL updated.', type: 'success' });
    }
  };

  if (loading) return <p>Loading sources...</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">URL</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Enabled</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {sources.map((source) => (
            <tr key={source.id}>
              <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{source.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{source.category_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                    <Input
                        type="text"
                        value={editingUrl[source.id] ?? source.url}
                        onChange={(e) => setEditingUrl(prev => ({ ...prev, [source.id]: e.target.value }))}
                        className="w-96"
                    />
                    <Button onClick={() => handleUrlChange(source.id)} size="sm">Save</Button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Switch
                  checked={source.is_enabled}
                  onCheckedChange={() => handleToggle(source)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}