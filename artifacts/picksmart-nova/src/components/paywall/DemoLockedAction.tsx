import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import RequestAccessModal from "./RequestAccessModal";

interface Props {
  children: React.ReactNode;
  onAllowedClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * Wraps any clickable area.
 * If the current user is a demo user (isDemoUser), captures the click and
 * shows the RequestAccessModal instead of performing the action.
 * Non-demo users pass through normally.
 */
export default function DemoLockedAction({ children, onAllowedClick, className = "", title }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [open, setOpen] = useState(false);

  const isDemo = !!currentUser?.isDemoUser;

  const handleClick = (e: React.MouseEvent) => {
    if (isDemo) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
      return;
    }
    onAllowedClick?.();
  };

  return (
    <>
      <div className={className} onClickCapture={isDemo ? handleClick : undefined} onClick={!isDemo && onAllowedClick ? onAllowedClick : undefined}>
        {children}
      </div>
      <RequestAccessModal
        open={open}
        onClose={() => setOpen(false)}
        title={title ?? "Request Access to Unlock This Feature"}
      />
    </>
  );
}
