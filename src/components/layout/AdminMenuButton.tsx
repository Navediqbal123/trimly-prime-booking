import { Menu } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AdminOutletContext {
  openAdminSidebar: () => void;
}

export function AdminMenuButton() {
  const { openAdminSidebar } = useOutletContext<AdminOutletContext>();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openAdminSidebar}
      aria-label="Open admin navigation menu"
      className="h-9 w-9 shrink-0"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
