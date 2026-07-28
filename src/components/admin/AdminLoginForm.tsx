"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { signInAdmin } from "@/app/[locale]/admin/(auth)/connexion/actions";

type AdminLoginFormProps = {
  locale: Locale;
  labels: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    pending: string;
    error: string;
    logoAlt: string;
  };
};

export function AdminLoginForm({ locale, labels }: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInAdmin.bind(null, locale),
    {},
  );

  return (
    <div className="admin-auth-card">
      <Image
        src="/logo_la_residence_ankerana_transparent.PNG"
        alt={labels.logoAlt}
        width={180}
        height={76}
        priority
        className="admin-auth-logo"
      />
      <div className="admin-auth-heading">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </div>
      <form action={formAction} className="admin-auth-form">
        <label>
          <span>{labels.email}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          <span>{labels.password}</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={200}
          />
        </label>
        {state.error ? (
          <p className="admin-auth-error" role="alert">
            {labels.error}
          </p>
        ) : null}
        <button type="submit" disabled={isPending}>
          {isPending ? labels.pending : labels.submit}
        </button>
      </form>
    </div>
  );
}
