import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import SubscribePromptModal from "./SubscribePromptModal";

interface Props {
  children: React.ReactNode;
  onAllowedClick?: () => void;
  className?: string;
  requiredRole?: string;
  asButton?: boolean;
}

/**
 * Wraps any clickable area.
 *
 * LOCKED users  → capture-phase handler fires BEFORE child buttons, shows modal.
 * ALLOWED users → onAllowedClick fires (for navigation wrappers); child buttons
 *                 that have their own onClick still work normally.
 * Owner always bypasses subscription check.
 */
export default function LockedAction({
  children,
  onAllowedClick,
  className = "",
  requiredRole,
  asButton = false,
}: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [open, setOpen] = useState(false);

  const isOwner = currentUser?.role === "owner";
  const isSubscribed = isOwner || !!currentUser?.isSubscribed;
  const hasRole = !requiredRole || isOwner || currentUser?.role === requiredRole;
  const allowed = isSubscribed && hasRole;

  const lockCapture = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const Tag = asButton ? "button" : "div";

  return (
    <>
      <Tag
        className={className}
        onClickCapture={allowed ? undefined : lockCapture}
        onClick={allowed && onAllowedClick ? onAllowedClick : undefined}
      >
        {children}
      </Tag>
      <SubscribePromptModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
