"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { DragEvent } from "react";
import { useRouter } from "next/navigation";

import {
  reorderAccommodationsAction,
  toggleAccommodationAction,
} from "@/app/[locale]/admin/(protected)/hebergements/actions";

import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";

import type { AdminAccommodation } from "@/lib/admin/accommodations/get-admin-accommodations";

type Filters = {
  query: string;
  state: "all" | "active" | "inactive";
  sort: "order" | "updated" | "price";
};

const initialFilters: Filters = {
  query: "",
  state: "all",
  sort: "order",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} MGA`;
}

function applySequentialSortOrder(
  items: AdminAccommodation[],
) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: (index + 1) * 10,
  }));
}

function moveItem(
  items: AdminAccommodation[],
  draggedId: string,
  targetId: string,
) {
  const fromIndex = items.findIndex(
    (item) => item.id === draggedId,
  );

  const toIndex = items.findIndex(
    (item) => item.id === targetId,
  );

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const next = [...items];

  const [movedItem] = next.splice(
    fromIndex,
    1,
  );

  next.splice(
    toIndex,
    0,
    movedItem,
  );

  return applySequentialSortOrder(next);
}

export function AdminAccommodationsExplorer({
  accommodations,
}: {
  accommodations: AdminAccommodation[];
}) {
  const router = useRouter();

  const [filters, setFilters] =
    useState<Filters>(initialFilters);

  const [localOrder, setLocalOrder] =
    useState<AdminAccommodation[]>(
      accommodations,
    );

  /*
   * IMPORTANT :
   * Cette référence contient toujours immédiatement
   * le dernier ordre réel.
   *
   * Elle évite qu'un dragEnd utilise un ancien état React.
   */
  const localOrderRef =
    useRef<AdminAccommodation[]>(
      accommodations,
    );

  const [draggedId, setDraggedId] =
    useState<string | null>(null);

  const [dragOverId, setDragOverId] =
    useState<string | null>(null);

  const [toggle, setToggle] =
    useState<{
      item: AdminAccommodation;
      nextActive: boolean;
    } | null>(null);

  const [message, setMessage] =
    useState<{
      tone: "success" | "error";
      text: string;
    } | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const [
    isReordering,
    startReorderTransition,
  ] = useTransition();

  /*
   * Quand les données serveur sont rafraîchies,
   * on resynchronise à la fois l'état et la référence.
   */
  useEffect(() => {
    const ordered = [...accommodations].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.nameFr.localeCompare(
          right.nameFr,
          "fr-FR",
        ),
    );

    setLocalOrder(ordered);
    localOrderRef.current = ordered;
  }, [accommodations]);

  /*
   * On autorise la réorganisation uniquement
   * lorsque toute la liste est visible dans son ordre réel.
   */
  const canReorder =
    filters.query.trim() === "" &&
    filters.state === "all" &&
    filters.sort === "order";

  const filtered = useMemo(() => {
    const query = normalize(
      filters.query,
    );

    const result = localOrder.filter(
      (item) => {
        const searchable = normalize(
          `${item.nameFr} ${item.nameEn} ${item.code}`,
        );

        return (
          (!query ||
            searchable.includes(query)) &&
          (filters.state === "all" ||
            (filters.state === "active" &&
              item.isActive) ||
            (filters.state === "inactive" &&
              !item.isActive))
        );
      },
    );

    /*
     * Pour "Ordre d'affichage", on conserve exactement
     * l'ordre du tableau local.
     *
     * C'est important pendant le drag & drop.
     */
    if (filters.sort === "order") {
      return result;
    }

    return [...result].sort(
      (left, right) => {
        if (filters.sort === "updated") {
          return (
            new Date(
              right.updatedAt,
            ).getTime() -
            new Date(
              left.updatedAt,
            ).getTime()
          );
        }

        return (
          left.priceFrom -
          right.priceFrom
        );
      },
    );
  }, [localOrder, filters]);

  function confirmToggle() {
    if (!toggle) {
      return;
    }

    startTransition(async () => {
      const result =
        await toggleAccommodationAction(
          toggle.item.id,
          toggle.nextActive,
        );

      setMessage({
        tone: result.ok
          ? "success"
          : "error",
        text: result.message,
      });

      setToggle(null);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleDragStart(
    event: DragEvent<HTMLTableRowElement>,
    itemId: string,
  ) {
    if (
      !canReorder ||
      isReordering
    ) {
      event.preventDefault();
      return;
    }

    setMessage(null);

    setDraggedId(itemId);
    setDragOverId(null);

    /*
     * Firefox a notamment besoin de données
     * dans dataTransfer pour assurer correctement
     * certains drag & drop HTML natifs.
     */
    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      itemId,
    );
  }

  function handleDragOver(
    event: DragEvent<HTMLTableRowElement>,
    targetId: string,
  ) {
    if (
      !canReorder ||
      isReordering ||
      !draggedId
    ) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";

    if (draggedId === targetId) {
      return;
    }

    setDragOverId(targetId);

    /*
     * On calcule le nouvel ordre à partir de la ref,
     * donc toujours à partir de la toute dernière liste.
     */
    const current =
      localOrderRef.current;

    const next = moveItem(
      current,
      draggedId,
      targetId,
    );

    if (next === current) {
      return;
    }

    /*
     * La ref est mise à jour immédiatement.
     */
    localOrderRef.current = next;

    /*
     * Puis React reçoit le même ordre pour l'affichage.
     */
    setLocalOrder(next);
  }

  function handleDrop(
    event: DragEvent<HTMLTableRowElement>,
  ) {
    if (
      !canReorder ||
      isReordering
    ) {
      return;
    }

    event.preventDefault();
  }

  function handleDragEnd() {
    const wasDragging =
      draggedId !== null;

    setDraggedId(null);
    setDragOverId(null);

    if (
      !wasDragging ||
      !canReorder ||
      isReordering
    ) {
      return;
    }

    /*
     * C'est ici que la ref est essentielle :
     * on récupère exactement l'ordre affiché à l'écran.
     */
    const orderedIds =
      localOrderRef.current.map(
        (item) => item.id,
      );

    /*
     * On garde une copie de l'ordre reçu du serveur.
     * En cas d'échec de sauvegarde, on pourra revenir
     * à cet ordre.
     */
    const serverOrder = [
      ...accommodations,
    ].sort(
      (left, right) =>
        left.sortOrder -
          right.sortOrder ||
        left.nameFr.localeCompare(
          right.nameFr,
          "fr-FR",
        ),
    );

    startReorderTransition(
      async () => {
        const result =
          await reorderAccommodationsAction(
            orderedIds,
          );

        if (!result.ok) {
          /*
           * Retour à l'ordre précédent
           * si Supabase refuse la sauvegarde.
           */
          localOrderRef.current =
            serverOrder;

          setLocalOrder(
            serverOrder,
          );

          setMessage({
            tone: "error",
            text: result.message,
          });

          return;
        }

        /*
         * L'ordre local correspond maintenant
         * aux valeurs 10, 20, 30...
         */
        const normalized =
          applySequentialSortOrder(
            localOrderRef.current,
          );

        localOrderRef.current =
          normalized;

        setLocalOrder(
          normalized,
        );

        setMessage({
          tone: "success",
          text: result.message,
        });

        /*
         * On demande ensuite au Server Component
         * de relire les données enregistrées.
         */
        router.refresh();
      },
    );
  }

  if (
    accommodations.length === 0
  ) {
    return (
      <section
        className="admin-news-empty"
        role="status"
      >
        <h2>
          Aucun hébergement
        </h2>

        <p>
          Aucun hébergement
          n&apos;a encore été créé.
        </p>
      </section>
    );
  }

  return (
    <>
      {message ? (
        <section
          className={`admin-status-message ${message.tone}`}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </section>
      ) : null}

      <section
        className="admin-news-filters"
        aria-label="Filtres des hébergements"
      >
        <label>
          <span>
            Recherche
          </span>

          <input
            value={filters.query}
            placeholder="Rechercher par nom..."
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  query:
                    event.target
                      .value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>
            État
          </span>

          <select
            value={filters.state}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  state:
                    event.target
                      .value as Filters["state"],
                }),
              )
            }
          >
            <option value="all">
              Tous
            </option>

            <option value="active">
              Actifs
            </option>

            <option value="inactive">
              Inactifs
            </option>
          </select>
        </label>

        <label>
          <span>
            Tri
          </span>

          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  sort:
                    event.target
                      .value as Filters["sort"],
                }),
              )
            }
          >
            <option value="order">
              Ordre d&apos;affichage
            </option>

            <option value="updated">
              Dernière modification
            </option>

            <option value="price">
              Prix croissant
            </option>
          </select>
        </label>

        {JSON.stringify(
          filters,
        ) !==
        JSON.stringify(
          initialFilters,
        ) ? (
          <button
            className="admin-news-reset"
            type="button"
            onClick={() =>
              setFilters(
                initialFilters,
              )
            }
          >
            Réinitialiser
          </button>
        ) : null}
      </section>

      <section
        className={`admin-accommodation-reorder-hint ${
          canReorder
            ? "is-enabled"
            : ""
        }`}
      >
        {canReorder ? (
          <p>
            <strong>
              Réorganiser les hébergements :
            </strong>{" "}
            faites glisser une ligne avec
            la poignée ⋮⋮ pour modifier
            son ordre d&apos;affichage.
          </p>
        ) : (
          <p>
            Pour réorganiser les
            hébergements, sélectionnez
            « Ordre d&apos;affichage »,
            « Tous » et supprimez la
            recherche éventuelle.
          </p>
        )}

        {isReordering ? (
          <span>
            Enregistrement de
            l&apos;ordre...
          </span>
        ) : null}
      </section>

      {filtered.length > 0 ? (
        <section
          className="admin-news-table-card"
          aria-label="Liste des hébergements"
        >
          <table className="admin-news-table admin-accommodations-sortable-table">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="admin-accommodation-drag-column"
                >
                  Ordre
                </th>

                <th scope="col">
                  Hébergement
                </th>

                <th scope="col">
                  Prix à partir de
                </th>

                <th scope="col">
                  Capacité
                </th>

                <th scope="col">
                  Surface
                </th>

                <th scope="col">
                  État
                </th>

                <th scope="col">
                  Dernière modification
                </th>

                <th scope="col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (item, index) => (
                  <tr
                    key={item.id}
                    draggable={
                      canReorder &&
                      !isReordering
                    }
                    className={[
                      canReorder
                        ? "is-sortable"
                        : "",
                      draggedId ===
                      item.id
                        ? "is-dragging"
                        : "",
                      dragOverId ===
                      item.id
                        ? "is-drag-over"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onDragStart={(
                      event,
                    ) =>
                      handleDragStart(
                        event,
                        item.id,
                      )
                    }
                    onDragOver={(
                      event,
                    ) =>
                      handleDragOver(
                        event,
                        item.id,
                      )
                    }
                    onDrop={
                      handleDrop
                    }
                    onDragEnd={
                      handleDragEnd
                    }
                  >
                    <td
                      data-label="Ordre"
                      className="admin-accommodation-drag-cell"
                    >
                      <div className="admin-accommodation-drag-handle">
                        <span
                          className="admin-accommodation-order-number"
                          aria-label={`Position ${index + 1}`}
                        >
                          {index + 1}
                        </span>

                        <span
                          className="admin-accommodation-drag-icon"
                          aria-hidden="true"
                          title="Faire glisser pour réorganiser"
                        >
                          ⋮⋮
                        </span>
                      </div>
                    </td>

                    <td data-label="Hébergement">
                      <div className="admin-news-article-cell">
                        <div className="admin-news-thumb">
                          {item.coverImage ? (
                            <Image
                              src={
                                item.coverImage
                              }
                              alt=""
                              fill
                              sizes="64px"
                            />
                          ) : null}
                        </div>

                        <div>
                          <p className="admin-news-title">
                            {item.nameFr}
                          </p>

                          <span className="admin-news-code">
                            {
                              item.featureCount
                            }{" "}
                            caractéristiques
                          </span>
                        </div>
                      </div>
                    </td>

                    <td data-label="Prix">
                      {formatPrice(
                        item.priceFrom,
                      )}
                    </td>

                    <td data-label="Capacité">
                      {item.capacity}{" "}
                      pers.
                    </td>

                    <td data-label="Surface">
                      {item.surfaceM2
                        ? `${item.surfaceM2} m²`
                        : "Non renseignée"}
                    </td>

                    <td data-label="État">
                      <span
                        className={`admin-news-status ${
                          item.isActive
                            ? "published"
                            : "draft"
                        }`}
                      >
                        {item.isActive
                          ? "Actif"
                          : "Inactif"}
                      </span>
                    </td>

                    <td data-label="Dernière modification">
                      {formatDate(
                        item.updatedAt,
                      )}
                    </td>

                    <td data-label="Actions">
                      <div className="admin-news-actions">
                        <Link
                          className="admin-news-action"
                          href={`/fr/admin/hebergements/${item.id}/modifier`}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="admin-action-icon"
                          >
                            <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
                          </svg>

                          Modifier
                        </Link>

                        <button
                          className={`admin-news-action ${
                            item.isActive
                              ? "danger"
                              : ""
                          }`}
                          type="button"
                          aria-haspopup="dialog"
                          onClick={() => {
                            setMessage(
                              null,
                            );

                            setToggle({
                              item,
                              nextActive:
                                !item.isActive,
                            });
                          }}
                        >
                          <span aria-hidden="true">
                            {item.isActive
                              ? "−"
                              : "+"}
                          </span>

                          {item.isActive
                            ? "Désactiver"
                            : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </section>
      ) : (
        <section
          className="admin-news-empty"
          role="status"
        >
          <h2>
            Aucun résultat
          </h2>

          <p>
            Aucun hébergement ne
            correspond aux filtres
            sélectionnés.
          </p>
        </section>
      )}

      {toggle ? (
        <AdminConfirmDialog
          title={
            toggle.nextActive
              ? "Activer cet hébergement ?"
              : "Désactiver cet hébergement ?"
          }
          description={
            toggle.nextActive
              ? "Il sera visible sur le site public."
              : "Il ne sera plus visible sur le site public."
          }
          confirmLabel={
            toggle.nextActive
              ? "Confirmer l'activation"
              : "Confirmer la désactivation"
          }
          cancelLabel="Annuler"
          variant={
            toggle.nextActive
              ? "default"
              : "danger"
          }
          pending={isPending}
          pendingLabel={
            toggle.nextActive
              ? "Activation..."
              : "Désactivation..."
          }
          onConfirm={
            confirmToggle
          }
          onCancel={() => {
            if (!isPending) {
              setToggle(
                null,
              );
            }
          }}
        />
      ) : null}
    </>
  );
}