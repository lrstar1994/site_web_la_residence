# Authentification administrateur Supabase

Cette phase prépare un back-office protégé par Supabase Auth et par la table `site.admin_users`.

## Migration

Appliquer manuellement la migration :

`supabase/migrations/20260715210000_create_site_admin_auth.sql`

Méthode recommandée :

1. Supabase Dashboard
2. SQL Editor
3. New query
4. Copier le contenu de la migration
5. Run

Aucune commande `supabase db push` n'est exécutée par Codex.

## Créer le premier administrateur

1. Ouvrir Supabase Dashboard.
2. Aller dans Authentication → Providers.
3. Vérifier que Email est activé.
4. Désactiver l'inscription publique si elle n'est pas nécessaire au reste du projet.
5. Aller dans Authentication → Users.
6. Créer manuellement l'utilisateur avec son adresse email réelle et un mot de passe temporaire fort.
7. Copier son UUID depuis `auth.users`.
8. Exécuter dans SQL Editor :

```sql
insert into site.admin_users (user_id, role, is_active)
values ('UUID_AUTH_USER', 'admin', true)
on conflict (user_id) do update
set
  role = excluded.role,
  is_active = excluded.is_active;
```

Ne jamais écrire l'email réel, le mot de passe réel ou l'UUID réel dans une migration versionnée.

## Rôles

- `admin` : pourra plus tard gérer les utilisateurs et tous les contenus.
- `editor` : pourra plus tard gérer les articles sans administrer les comptes.

Dans cette première version, les deux rôles peuvent accéder à `/admin`.

## Sécurité

- La clé `service_role` ne doit jamais être utilisée dans le frontend.
- La page de connexion utilise Supabase Auth email/mot de passe.
- L'accès admin est refusé si l'utilisateur Supabase n'a pas de ligne active dans `site.admin_users`.
- Les routes admin sont `noindex`.
