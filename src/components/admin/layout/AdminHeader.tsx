import { signOutAdmin } from "@/app/[locale]/admin/(protected)/actions";
import type { AdminUser } from "@/lib/auth/require-admin";

type AdminHeaderProps = {
  title: string;
  admin: AdminUser;
};

export function AdminHeader({ title, admin }: AdminHeaderProps) {
  return (
    <header className="admin-shell-header">
      <div>
        <p className="admin-shell-kicker">Administration</p>
        <h1>{title}</h1>
      </div>
      <div className="admin-shell-account">
        <div>
          <span>{admin.email ?? "Email indisponible"}</span>
          <strong>{admin.role}</strong>
        </div>
        <form action={signOutAdmin.bind(null, "fr")}>
          <button type="submit">Se déconnecter</button>
        </form>
      </div>
    </header>
  );
}
