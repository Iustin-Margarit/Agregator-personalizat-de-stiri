import { FileX, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ArticleNotFoundProps {
  title?: string;
  message?: string;
  showSearchSuggestion?: boolean;
}

export default function ArticleNotFound({ 
  title = "Article Not Found",
  message = "The article you're looking for doesn't exist or may have been removed. It might be an old article that's no longer available.",
  showSearchSuggestion = true
}: ArticleNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/feed" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Link>
        </div>

        {/* Not Found Display */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-100 rounded-full">
              <FileX className="h-12 w-12 text-gray-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/feed">
              <Button className="w-full sm:w-auto">
                Browse Latest Articles
              </Button>
            </Link>
            
            {showSearchSuggestion && (
              <Link href="/feed">
                <Button variant="outline" className="w-full sm:w-auto inline-flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Search Articles
                </Button>
              </Link>
            )}
          </div>

          {/* Helpful Suggestions */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">You might also like:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/feed?category=technology">
                <Button variant="outline" size="sm">Technology</Button>
              </Link>
              <Link href="/feed?category=world">
                <Button variant="outline" size="sm">World News</Button>
              </Link>
              <Link href="/feed?category=business">
                <Button variant="outline" size="sm">Business</Button>
              </Link>
              <Link href="/feed?category=science">
                <Button variant="outline" size="sm">Science</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}