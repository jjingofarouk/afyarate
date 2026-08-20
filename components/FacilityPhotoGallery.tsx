import type { FacilityPhoto } from "@/lib/facilities";

export default function FacilityPhotoGallery({ photos }: { photos: FacilityPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Photos from the community ({photos.length})
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.imageUrl}
            alt="Facility photo submitted by a visitor"
            className="aspect-square w-full rounded-xl border border-slate-200 object-cover dark:border-slate-800"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}
