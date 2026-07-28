"use client";

import { useRouter } from "next/navigation";

type AdminBackButtonProps = {
  fallbackHref: string;
  className?: string;
};

export function AdminBackButton({ fallbackHref, className }: AdminBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button className={className ?? "admin-back-button"} type="button" onClick={handleBack}>
      <span aria-hidden="true">←</span>
      Retour
    </button>
  );
}
