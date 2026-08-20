"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  deleteRestaurantGalleryImageAction,
} from "@/app/[locale]/admin/(protected)/restaurant/galerie/actions";

import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";

import type { AdminRestaurantGalleryImage } from "@/lib/admin/restaurant/admin-restaurant-gallery-types";

export function AdminRestaurantGalleryExplorer({
  images,
}: {
  images: AdminRestaurantGalleryImage[];
}) {
  const router = useRouter();

  const sliderRef =
    useRef<HTMLDivElement>(null);

  const [
    deleteCandidate,
    setDeleteCandidate,
  ] =
    useState<AdminRestaurantGalleryImage | null>(
      null,
    );

  const [
    deleteError,
    setDeleteError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isDeleting,
    startDeleteTransition,
  ] = useTransition();

  /* =========================================================
     DÉFILEMENT DU CARROUSEL
     ========================================================= */

  const scrollSlider =
    useCallback(
      (
        direction:
          | -1
          | 1,
      ) => {
        const slider =
          sliderRef.current;

        if (!slider) {
          return;
        }

        const firstItem =
          slider.querySelector<HTMLElement>(
            ".admin-restaurant-gallery-card",
          );

        const step =
          firstItem
            ? firstItem.offsetWidth +
              18
            : Math.round(
                slider.clientWidth *
                  0.8,
              );

        slider.scrollBy({
          left:
            direction *
            step,

          behavior:
            "smooth",
        });
      },
      [],
    );

  /* =========================================================
     SUPPRESSION
     ========================================================= */

  function confirmDelete() {
    if (
      !deleteCandidate
    ) {
      return;
    }

    setDeleteError(
      null,
    );

    const imageId =
      deleteCandidate.id;

    startDeleteTransition(
      async () => {
        const result =
          await deleteRestaurantGalleryImageAction(
            imageId,
          );

        if (
          !result.ok
        ) {
          setDeleteError(
            result.message,
          );

          return;
        }

        setDeleteCandidate(
          null,
        );

        router.refresh();
      },
    );
  }

  /* =========================================================
     GALERIE VIDE
     ========================================================= */

  if (
    images.length ===
    0
  ) {
    return (
      <section
        className="admin-news-empty"
        role="status"
      >
        <h2>
          Aucune image dans la galerie
        </h2>

        <p>
          Ajoutez vos premières photos pour construire la galerie du restaurant Le Privilège.
        </p>
      </section>
    );
  }

  /* =========================================================
     AFFICHAGE
     ========================================================= */

  return (
    <>
      <section
        className="admin-restaurant-gallery-panel"
        aria-label="Galerie du restaurant"
      >
        {/* ===================================================
            EN-TÊTE
           =================================================== */}

        <div className="admin-restaurant-gallery-panel-header">
          <div>
            <p className="admin-section-kicker">
              Galerie
            </p>

            <h2>
              Photos du restaurant
            </h2>

            <p>
              {images.length}{" "}
              image
              {images.length >
              1
                ? "s"
                : ""}{" "}
              dans la galerie
            </p>
          </div>

          <div className="admin-restaurant-gallery-navigation">
            <button
              type="button"
              aria-label="Voir les images précédentes"
              onClick={() =>
                scrollSlider(
                  -1,
                )
              }
            >
              <span aria-hidden="true">
                ‹
              </span>
            </button>

            <button
              type="button"
              aria-label="Voir les images suivantes"
              onClick={() =>
                scrollSlider(
                  1,
                )
              }
            >
              <span aria-hidden="true">
                ›
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================
            CARROUSEL
           =================================================== */}

        <div
          ref={
            sliderRef
          }
          className="admin-restaurant-gallery-carousel"
        >
          {images.map(
            (
              image,
              index,
            ) => (
              <article
                key={
                  image.id
                }
                className="admin-restaurant-gallery-card"
              >
                <div className="admin-restaurant-gallery-card-image">
                  <Image
                    src={
                      image.imagePath
                    }
                    alt={
                      image.altFr
                    }
                    fill
                    sizes="(max-width: 768px) 82vw, 300px"
                  />

                  {/* =========================================
                      NUMÉRO
                     ========================================= */}

                  <span className="admin-restaurant-gallery-number">
                    {index +
                      1}
                  </span>

                  {/* =========================================
                      MISE EN AVANT
                     ========================================= */}

                  {image.isFeatured ? (
                    <span className="admin-restaurant-gallery-featured">
                      Mise en avant
                    </span>
                  ) : null}

                  {/* =========================================
                      SUPPRESSION
                     ========================================= */}

                  <button
                    type="button"
                    className="admin-restaurant-gallery-delete"
                    aria-label={`Supprimer l'image ${index + 1}`}
                    disabled={
                      isDeleting
                    }
                    onClick={() => {
                      setDeleteError(
                        null,
                      );

                      setDeleteCandidate(
                        image,
                      );
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 7h16" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M6 7l1 14h10l1-14" />
                      <path d="M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
              </article>
            ),
          )}
        </div>

        {/* ===================================================
            INDICATION MOBILE
           =================================================== */}

        <div
          className="admin-restaurant-gallery-swipe-hint"
          aria-hidden="true"
        >
          <span>
            ←
          </span>

          <span>
            Faites défiler les photos
          </span>

          <span>
            →
          </span>
        </div>
      </section>

      {/* =====================================================
          ERREUR SUPPRESSION
         ===================================================== */}

      {deleteError ? (
        <section
          className="admin-news-form-alert"
          role="alert"
        >
          {deleteError}
        </section>
      ) : null}

      {/* =====================================================
          CONFIRMATION
         ===================================================== */}

      {deleteCandidate ? (
        <AdminConfirmDialog
          title="Supprimer cette photo ?"
          description="Cette photo sera supprimée définitivement de la galerie et du stockage Supabase."
          confirmLabel="Supprimer la photo"
          cancelLabel="Annuler"
          variant="danger"
          pending={
            isDeleting
          }
          pendingLabel="Suppression..."
          onConfirm={
            confirmDelete
          }
          onCancel={() => {
            if (
              isDeleting
            ) {
              return;
            }

            setDeleteCandidate(
              null,
            );

            setDeleteError(
              null,
            );
          }}
        >
          <div className="admin-confirm-dialog-preview">
            <Image
              src={
                deleteCandidate.imagePath
              }
              alt={
                deleteCandidate.altFr
              }
              width={
                92
              }
              height={
                72
              }
            />

            <span>
              Photo de la galerie du restaurant
            </span>
          </div>
        </AdminConfirmDialog>
      ) : null}
    </>
  );
}