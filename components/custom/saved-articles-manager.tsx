'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useToast } from '@/components/ui/toast';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Folder,
  Tag,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Edit3,
  X,
  Filter,
  MoreHorizontal,
  Search,
  ArrowDownUp
} from 'lucide-react';
import EnhancedArticleCard from './enhanced-article-card';

interface SavedFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

interface SavedTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface SavedArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  image_url?: string;
  published_at?: string;
  source?: string;
  category?: string;
  folder_id?: string | null;
  is_read: boolean;
  notes?: string;
  saved_at: string;
  slug?: string;
  tags: SavedTag[];
}

interface SavedArticlesManagerProps {
  userId: string;
  initialArticles: SavedArticle[];
  articleCount: number;
  articleLimit: number;
}

export default function SavedArticlesManager({ userId, initialArticles, articleCount, articleLimit }: SavedArticlesManagerProps) {
  const [articles, setArticles] = useState<SavedArticle[]>(initialArticles);
  const [folders, setFolders] = useState<SavedFolder[]>([]);
  const [tags, setTags] = useState<SavedTag[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showReadArticles, setShowReadArticles] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('#3B82F6');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10B981');
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('saved_at_desc');
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default'
  });
  
  const supabase = createClient();
  const { showToast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Load folders and tags when component mounts
    loadFoldersAndTags();
  }, [userId]);

  // Initialize state from URL parameters AFTER tags and folders are loaded
  useEffect(() => {
    // Only initialize from URL if we have loaded the data
    if (isDataLoaded) {
      const urlSelectedFolder = searchParams.get('folder');
      const urlSelectedTags = searchParams.get('tags');
      const urlShowRead = searchParams.get('showRead');

      if (urlSelectedFolder) {
        setSelectedFolder(urlSelectedFolder);
      }

      if (urlSelectedTags) {
        const tagIds = urlSelectedTags.split(',').filter(Boolean);
        
        // Only set tags that actually exist in the loaded tags array
        const validTagIds = tagIds.filter(tagId =>
          tags.some(tag => tag.id === tagId)
        );
        
        if (validTagIds.length > 0) {
          setSelectedTags(new Set(validTagIds));
        } else {
          setSelectedTags(new Set());
        }
      } else {
        setSelectedTags(new Set());
      }

      if (urlShowRead !== null) {
        setShowReadArticles(urlShowRead === 'true');
      }
    }
  }, [searchParams, isDataLoaded, tags]); // Depend on data being loaded

  // Update URL when filters change
  const updateURL = (updates: {
    folder?: string;
    tags?: Set<string>;
    showRead?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.folder !== undefined) {
      if (updates.folder === 'all') {
        params.delete('folder');
      } else {
        params.set('folder', updates.folder);
      }
    }
    
    if (updates.tags !== undefined) {
      if (updates.tags.size === 0) {
        params.delete('tags');
      } else {
        const tagString = Array.from(updates.tags).join(',');
        params.set('tags', tagString);
      }
    }
    
    if (updates.showRead !== undefined) {
      if (updates.showRead === true) {
        params.delete('showRead'); // Default is true, so remove from URL
      } else {
        params.set('showRead', 'false');
      }
    }

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/saved${newURL}`, { scroll: false });
  };

  const loadFoldersAndTags = async () => {
    // Load folders
    const { data: foldersData, error: foldersError } = await supabase
      .from('saved_folders')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (foldersError) {
      console.error('Error loading folders:', foldersError);
    } else {
      setFolders(foldersData || []);
    }

    // Load tags
    const { data: tagsData, error: tagsError } = await supabase
      .from('saved_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (tagsError) {
      console.error('Error loading tags:', tagsError);
    } else {
      setTags(tagsData || []);
    }

    // Mark data as loaded
    setIsDataLoaded(true);
  };


  const createFolder = async () => {
    if (!newFolderName.trim() || newFolderName.trim().length > 25) {
        showToast({
            type: 'error',
            title: 'Invalid folder name',
            message: 'Folder name must be between 1 and 25 characters.'
        });
        return;
    }

    const { data, error } = await supabase
      .from('saved_folders')
      .insert({
        user_id: userId,
        name: newFolderName.trim(),
        description: newFolderDescription.trim().slice(0, 40) || null,
        color: newFolderColor
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      showToast({
        type: 'error',
        title: 'Error creating folder',
        message: 'Please try again.'
      });
    } else {
      showToast({
        type: 'success',
        title: 'Folder created',
        message: `"${newFolderName}" has been created successfully.`
      });
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreatingFolder(false);
      loadFoldersAndTags(); // Reload to ensure consistency
    }
  };

  const startEditingFolder = (folder: SavedFolder) => {
    setEditingFolder(folder.id);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setEditFolderColor(folder.color);
  };

  const updateFolder = async () => {
    if (!editingFolder || !editFolderName.trim() || editFolderName.trim().length > 25) {
        showToast({
            type: 'error',
            title: 'Invalid folder name',
            message: 'Folder name must be between 1 and 25 characters.'
        });
        return;
    }

    const { data, error } = await supabase
      .from('saved_folders')
      .update({
        name: editFolderName.trim(),
        description: editFolderDescription.trim().slice(0, 40) || null,
        color: editFolderColor
      })
      .eq('id', editingFolder)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating folder:', error);
      showToast({
        type: 'error',
        title: 'Error updating folder',
        message: 'Please try again.'
      });
    } else {
      showToast({
        type: 'success',
        title: 'Folder updated',
        message: `"${editFolderName}" has been updated successfully.`
      });
      setEditingFolder(null);
      setEditFolderName('');
      setEditFolderDescription('');
      loadFoldersAndTags(); // Reload to ensure consistency
    }
  };

  const cancelEditingFolder = () => {
    setEditingFolder(null);
    setEditFolderName('');
    setEditFolderDescription('');
  };

  const deleteFolder = async (folderId: string) => {
    const folderName = folders.find(f => f.id === folderId)?.name || 'this folder';
    
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folderName}"? Articles inside will be moved to Unorganized.`,
      variant: 'destructive',
      onConfirm: async () => {
        const { error } = await supabase
          .from('saved_folders')
          .delete()
          .eq('id', folderId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error deleting folder:', error);
          showToast({
            type: 'error',
            title: 'Error deleting folder',
            message: 'Please try again.'
          });
        } else {
          showToast({
            type: 'success',
            title: 'Folder deleted',
            message: `"${folderName}" has been deleted successfully.`
          });
          setEditingFolder(null);
          if (selectedFolder === folderId) {
            setSelectedFolder('all');
            updateURL({ folder: 'all' });
          }
          // Update articles in local state to reflect the change
          setArticles(articles.map(article =>
            article.folder_id === folderId
              ? { ...article, folder_id: null }
              : article
          ));
          loadFoldersAndTags(); // Reload to ensure consistency
        }
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const createTag = async () => {
    if (!newTagName.trim() || newTagName.trim().length > 15) {
        showToast({
            type: 'error',
            title: 'Invalid tag name',
            message: 'Tag name must be between 1 and 15 characters.'
        });
        return;
    }

    const { data, error } = await supabase
      .from('saved_tags')
      .insert({
        user_id: userId,
        name: newTagName.trim(),
        color: newTagColor
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      showToast({
        type: 'error',
        title: 'Error creating tag',
        message: 'Please try again.'
      });
    } else {
      showToast({
        type: 'success',
        title: 'Tag created',
        message: `"${newTagName}" has been created successfully.`
      });
      setNewTagName('');
      setIsCreatingTag(false);
      loadFoldersAndTags(); // Reload to ensure consistency
    }
  };

  const deleteTag = async (tagId: string) => {
    const tagName = tags.find(t => t.id === tagId)?.name || 'this tag';
    
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Tag',
      message: `Are you sure you want to delete "${tagName}"? It will be removed from all associated articles.`,
      variant: 'destructive',
      onConfirm: async () => {
        const { error } = await supabase
          .from('saved_tags')
          .delete()
          .eq('id', tagId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error deleting tag:', error);
          showToast({
            type: 'error',
            title: 'Error deleting tag',
            message: 'Please try again.'
          });
        } else {
          showToast({
            type: 'success',
            title: 'Tag deleted',
            message: `"${tagName}" has been deleted successfully.`
          });
          setSelectedTags(prev => {
            const newSelection = new Set(prev);
            newSelection.delete(tagId);
            updateURL({ tags: newSelection });
            return newSelection;
          });
          // Also remove the tag from the articles in the local state
          setArticles(articles.map(article => ({
            ...article,
            tags: article.tags.filter(t => t.id !== tagId)
          })));
          loadFoldersAndTags(); // Reload to ensure consistency
        }
      }
    });
  };

  const toggleArticleSelection = (articleId: string) => {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(articleId)) {
      newSelection.delete(articleId);
    } else {
      newSelection.add(articleId);
    }
    setSelectedArticles(newSelection);
  };

  const selectAllArticles = () => {
    const filteredArticleIds = getProcessedArticles().map(article => article.id);
    setSelectedArticles(new Set(filteredArticleIds));
  };

  const clearSelection = () => {
    setSelectedArticles(new Set());
  };

  const bulkMarkAsRead = async (isRead: boolean) => {
    const articleIds = Array.from(selectedArticles);
    if (articleIds.length === 0) return;

    const { error } = await supabase
      .from('saved_articles')
      .update({ is_read: isRead })
      .eq('user_id', userId)
      .in('article_id', articleIds);

    if (error) {
      console.error('Error updating read status:', error);
      showToast({
        type: 'error',
        title: 'Error updating articles',
        message: 'Please try again.'
      });
    } else {
      showToast({
        type: 'success',
        title: 'Articles updated',
        message: `${articleIds.length} article${articleIds.length === 1 ? '' : 's'} marked as ${isRead ? 'read' : 'unread'}.`
      });
      setArticles(articles.map(article => 
        selectedArticles.has(article.id) 
          ? { ...article, is_read: isRead }
          : article
      ));
      clearSelection();
    }
  };

  const bulkMoveToFolder = async (folderId: string | null) => {
    const articleIds = Array.from(selectedArticles);
    if (articleIds.length === 0) return;

    const { error } = await supabase
      .from('saved_articles')
      .update({ folder_id: folderId })
      .eq('user_id', userId)
      .in('article_id', articleIds);

    if (error) {
      console.error('Error moving articles:', error);
      showToast({
        type: 'error',
        title: 'Error moving articles',
        message: 'Please try again.'
      });
    } else {
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name || 'folder' : 'Unorganized';
      showToast({
        type: 'success',
        title: 'Articles moved',
        message: `${articleIds.length} article${articleIds.length === 1 ? '' : 's'} moved to ${folderName}.`
      });
      setArticles(articles.map(article =>
        selectedArticles.has(article.id)
          ? { ...article, folder_id: folderId }
          : article
      ));
      clearSelection();
    }
  };

  const bulkAddTag = async (tagId: string) => {
    const articleIds = Array.from(selectedArticles);
    if (articleIds.length === 0) return;

    // Use UPSERT to avoid constraint violations
    const insertData = articleIds.map(articleId => ({
      saved_article_user_id: userId,
      saved_article_article_id: articleId,
      tag_id: tagId
    }));

    const { error } = await supabase
      .from('saved_article_tags')
      .upsert(insertData, {
        onConflict: 'saved_article_user_id,saved_article_article_id,tag_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('Error adding tags:', error);
      showToast({
        type: 'error',
        title: 'Error adding tags',
        message: 'Please try again.'
      });
    } else {
      const tagName = tags.find(t => t.id === tagId)?.name || 'tag';
      showToast({
        type: 'success',
        title: 'Tags added',
        message: `${tagName} added to ${articleIds.length} article${articleIds.length === 1 ? '' : 's'}.`
      });
      clearSelection();
      // Manually update the local state to reflect the new tags
      const newTag = tags.find(t => t.id === tagId);
      if (newTag) {
          setArticles(articles.map(article => {
              if (selectedArticles.has(article.id) && !article.tags.some(t => t.id === tagId)) {
                  return { ...article, tags: [...article.tags, newTag] };
              }
              return article;
          }));
      }
    }
  };

  const bulkRemoveTag = async (tagId: string) => {
    const articleIds = Array.from(selectedArticles);
    if (articleIds.length === 0) return;

    const { error } = await supabase
      .from('saved_article_tags')
      .delete()
      .eq('saved_article_user_id', userId)
      .eq('tag_id', tagId)
      .in('saved_article_article_id', articleIds);

    if (error) {
      console.error('Error removing tags:', error);
      showToast({
        type: 'error',
        title: 'Error removing tags',
        message: 'Please try again.'
      });
    } else {
      const tagName = tags.find(t => t.id === tagId)?.name || 'tag';
      showToast({
        type: 'success',
        title: 'Tags removed',
        message: `${tagName} removed from ${articleIds.length} article${articleIds.length === 1 ? '' : 's'}.`
      });
      clearSelection();
      // Manually update the local state to reflect the removed tags
      setArticles(articles.map(article => {
          if (selectedArticles.has(article.id)) {
              return { ...article, tags: article.tags.filter(t => t.id !== tagId) };
          }
          return article;
      }));
    }
  };

  const bulkDelete = async () => {
    const articleIds = Array.from(selectedArticles);
    if (articleIds.length === 0) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Articles',
      message: `Are you sure you want to delete ${articleIds.length} saved article${articleIds.length === 1 ? '' : 's'}? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .in('article_id', articleIds);

        if (error) {
          console.error('Error deleting articles:', error);
          showToast({
            type: 'error',
            title: 'Error deleting articles',
            message: 'Please try again.'
          });
        } else {
          showToast({
            type: 'success',
            title: 'Articles deleted',
            message: `${articleIds.length} article${articleIds.length === 1 ? '' : 's'} deleted successfully.`
          });
          setArticles(articles.filter(article => !selectedArticles.has(article.id)));
          clearSelection();
        }
      }
    });
  };

  const getProcessedArticles = () => {
    let processedArticles = articles;

    // 1. Filter by folder, tags, read status
    processedArticles = processedArticles.filter(article => {
      // Folder filter
      if (selectedFolder !== 'all') {
        if (selectedFolder === 'unorganized') {
          if (article.folder_id) return false;
        } else {
          if (article.folder_id !== selectedFolder) return false;
        }
      }
      // Tag filter
      if (selectedTags.size > 0) {
        const articleTagIds = article.tags.map(tag => tag.id);
        const hasSelectedTag = Array.from(selectedTags).some(tagId =>
          articleTagIds.includes(tagId)
        );
        if (!hasSelectedTag) return false;
      }
      // Read status filter
      if (!showReadArticles && article.is_read) return false;
      return true;
    });

    // 2. Filter by search term
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      processedArticles = processedArticles.filter(article =>
        article.title?.toLowerCase().includes(lowercasedTerm) ||
        article.summary?.toLowerCase().includes(lowercasedTerm) ||
        article.source?.toLowerCase().includes(lowercasedTerm)
      );
    }

    // 3. Sort articles
    processedArticles.sort((a, b) => {
      switch (sortOrder) {
        case 'saved_at_desc':
          return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
        case 'saved_at_asc':
          return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
        case 'published_at_desc':
          return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
        case 'published_at_asc':
          return new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return processedArticles;
  };

  const processedArticles = getProcessedArticles();
  const selectedCount = selectedArticles.size;

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Saved Articles</h1>
          <Badge variant="secondary" className="text-lg">
            {articleCount} / {articleLimit}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant={bulkActionMode ? "default" : "outline"}
            onClick={() => setBulkActionMode(!bulkActionMode)}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Organization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders and Tags */}
        <div className="lg:col-span-1 space-y-6">
          {/* Folders Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center">
                <Folder className="h-4 w-4 mr-2" />
                Folders
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreatingFolder(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Folder List */}
            <div className="space-y-1">
              <button
                className={`w-full text-left px-2 py-1 rounded text-sm ${
                  selectedFolder === 'all' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedFolder('all');
                  updateURL({ folder: 'all' });
                }}
              >
                All Articles ({articles.length})
              </button>
              <button
                className={`w-full text-left px-2 py-1 rounded text-sm ${
                  selectedFolder === 'unorganized' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedFolder('unorganized');
                  updateURL({ folder: 'unorganized' });
                }}
              >
                Unorganized ({articles.filter(a => !a.folder_id).length})
              </button>
              {folders.map(folder => (
                <div key={folder.id} className="group relative">
                  {editingFolder === folder.id ? (
                    // Edit mode
                    <div className="space-y-2 p-2 border rounded bg-muted">
                      <Input
                        placeholder="Folder name"
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="text-sm"
                        maxLength={25}
                        />
                      <Input
                        placeholder="Description (optional)"
                        value={editFolderDescription}
                        onChange={(e) => setEditFolderDescription(e.target.value)}
                        className="text-sm"
                        maxLength={40}
                        />
                      <div className="flex items-center gap-2">
                        <ColorPicker
                          value={editFolderColor}
                          onChange={setEditFolderColor}
                          showPresets={true}
                          size="sm"
                        />
                        <div className="flex items-center justify-between w-full">
                          <div className="flex gap-1">
                           <Button size="sm" onClick={updateFolder} className="text-xs px-2 py-1">
                              Save
                           </Button>
                           <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingFolder}
                              className="text-xs px-2 py-1"
                           >
                              <X className="h-3 w-3" />
                           </Button>
                          </div>
                          <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => deleteFolder(folder.id)}
                             className="text-xs px-2 py-1 text-red-500 hover:text-red-700"
                          >
                             <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex items-center">
                      <button
                        className={`flex-1 text-left px-2 py-1 rounded text-sm flex items-center ${
                          selectedFolder === folder.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          setSelectedFolder(folder.id);
                          updateURL({ folder: folder.id });
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name} ({articles.filter(a => a.folder_id === folder.id).length})
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        onClick={() => startEditingFolder(folder)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Create Folder Form */}
            {isCreatingFolder && (
              <div className="mt-3 space-y-2 border-t pt-3">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  maxLength={25}
                  />
                <Input
                  placeholder="Description (optional)"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  maxLength={40}
                  />
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={newFolderColor}
                    onChange={setNewFolderColor}
                    showPresets={true}
                    size="sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={createFolder}>
                      Create
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsCreatingFolder(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreatingTag(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags List */}
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
               <div key={tag.id} className="relative group">
                 <Badge
                   variant={selectedTags.has(tag.id) ? "default" : "outline"}
                   className="cursor-pointer pr-6" // Add padding for the delete button
                   style={selectedTags.has(tag.id) ? { backgroundColor: tag.color, color: 'white' } : {}}
                   onClick={() => {
                     const newSelectedTags = new Set(selectedTags);
                     if (newSelectedTags.has(tag.id)) {
                       newSelectedTags.delete(tag.id);
                     } else {
                       newSelectedTags.add(tag.id);
                     }
                     
                     setSelectedTags(newSelectedTags);
                     updateURL({ tags: newSelectedTags });
                   }}
                 >
                   {tag.name}
                 </Badge>
                 <button
                   onClick={(e) => {
                     e.stopPropagation(); // Prevent tag selection when deleting
                     deleteTag(tag.id);
                   }}
                   className="absolute top-0 right-0 p-0.5 rounded-full bg-muted text-muted-foreground hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                   aria-label={`Delete tag ${tag.name}`}
                 >
                   <X className="h-3 w-3" />
                 </button>
               </div>
              ))}
            </div>

            {/* Create Tag Form */}
            {isCreatingTag && (
              <div className="mt-3 space-y-2 border-t pt-3">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  maxLength={15}
                  />
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={newTagColor}
                    onChange={setNewTagColor}
                    showPresets={true}
                    size="sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={createTag}>
                      Create
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsCreatingTag(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center mb-3">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-read"
                checked={showReadArticles}
                onCheckedChange={(checked) => {
                  const newValue = checked === true;
                  setShowReadArticles(newValue);
                  updateURL({ showRead: newValue });
                }}
              />
              <Label htmlFor="show-read" className="text-sm">
                Show read articles
              </Label>
            </div>
          </div>
        </div>

        {/* Main Content - Articles */}
        <div className="lg:col-span-3">
          {/* Search and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search saved articles..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowDownUp className="h-4 w-4" />
                  Sort By
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortOrder('saved_at_desc')}>Date Saved (Newest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('saved_at_asc')}>Date Saved (Oldest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('published_at_desc')}>Date Published (Newest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('published_at_asc')}>Date Published (Oldest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('title_asc')}>Title (A-Z)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('title_desc')}>Title (Z-A)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        
          {/* Bulk Actions Bar */}
          {bulkActionMode && (
            <div className="bg-card border rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedCount} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAllArticles}>
                      Select All
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>
                
                {selectedCount > 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => bulkMarkAsRead(true)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Mark Read
                    </Button>
                    <Button size="sm" onClick={() => bulkMarkAsRead(false)}>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Mark Unread
                    </Button>
                    
                    {/* Move to Folder Dropdown */}
                    <select
                      key={folders.length}
                      className="px-3 py-1 border rounded text-sm bg-background text-foreground"
                      onChange={(e) => {
                        const folderId = e.target.value === 'none' ? null : e.target.value;
                        bulkMoveToFolder(folderId);
                        e.target.value = '';
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Move to folder...</option>
                      <option value="none">Remove from folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>

                    {/* Manage Tags Dropdown */}
                    <select
                      key={`manage-tags-${tags.length}`}
                      className="px-3 py-1 border rounded text-sm bg-background text-foreground"
                      onChange={(e) => {
                        const [action, tagId] = e.target.value.split(':');
                        if (action && tagId) {
                          if (action === 'add') {
                            bulkAddTag(tagId);
                          } else if (action === 'remove') {
                            bulkRemoveTag(tagId);
                          }
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Manage tags...</option>
                      <optgroup label="Add Tags">
                        {tags.map(tag => (
                          <option key={`add-${tag.id}`} value={`add:${tag.id}`}>
                            + {tag.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Remove Tags">
                        {tags.map(tag => (
                          <option key={`remove-${tag.id}`} value={`remove:${tag.id}`}>
                            - {tag.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    
                    <Button size="sm" variant="destructive" onClick={bulkDelete}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Articles Grid */}
          {processedArticles.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">
                {searchTerm ? `No articles match "${searchTerm}".` : 'No articles found.'}
              </p>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processedArticles.map((article) => (
                <div key={article.id} className="relative">
                  {bulkActionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedArticles.has(article.id)}
                        onCheckedChange={() => toggleArticleSelection(article.id)}
                        className="bg-background border-2"
                      />
                    </div>
                  )}
                  <div className={`${article.is_read ? 'opacity-60' : ''} ${bulkActionMode ? 'ml-8' : ''}`}>
                    <EnhancedArticleCard
                      key={`${article.id}-${folders.length}-${tags.length}`}
                      article={article}
                      userId={userId}
                      showEnhancedControls={true}
                      onArticleUpdate={(articleId, updates) => {
                        setArticles(articles.map(a =>
                          a.id === articleId ? { ...a, ...updates } : a
                        ));
                      }}
                      onDataRefresh={() => {
                        // This is a placeholder as the parent now handles data fetching via reload
                        // A more advanced implementation might use a global state or context
                        window.location.reload();
                      }}
                      folders={folders}
                      tags={tags}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        description={confirmationModal.message}
        variant={confirmationModal.variant}
        confirmText={confirmationModal.variant === 'destructive' ? 'Delete' : 'Confirm'}
      />
    </div>
  );
}