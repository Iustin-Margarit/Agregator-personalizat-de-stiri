'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DisabledArticlesBannerProps {
  userId: string;
  disabledCount: number;
}

export default function DisabledArticlesBanner({ userId, disabledCount }: DisabledArticlesBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  const handleClearSlots = async () => {
    setIsLoading(true);
    const { error } = await supabase.rpc('delete_disabled_saved_articles', {
      p_user_id: userId,
    });

    if (error) {
      showToast({
        title: 'Error Clearing Slots',
        message: error.message,
        type: 'error',
      });
    } else {
      showToast({
        title: 'Slots Cleared',
        message: `${disabledCount} saved article slot(s) from disabled sources have been cleared.`,
        type: 'success',
      });
      setIsVisible(false);
      // You might want to trigger a page refresh here to update the saved articles list
      window.location.reload();
    }
    setIsLoading(false);
  };

  if (!isVisible || disabledCount === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4" role="alert">
      <div className="flex">
        <div className="py-1">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
        </div>
        <div>
          <p className="font-bold">Action Required</p>
          <p className="text-sm">
            You have {disabledCount} saved article(s) from news sources that are no longer available. 
            They are not visible but still occupy your saved slots.
          </p>
          <div className="mt-2">
            <Button
              onClick={handleClearSlots}
              disabled={isLoading}
              variant="default"
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isLoading ? 'Clearing...' : `Clear ${disabledCount} Slot(s)`}
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="ml-2 text-yellow-800 hover:bg-yellow-200"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}