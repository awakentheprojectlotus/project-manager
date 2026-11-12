import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or was moved. Head back to your workspace overview."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </Link>
        }
      />
    </div>
  );
}
