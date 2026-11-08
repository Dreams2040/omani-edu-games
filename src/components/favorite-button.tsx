import { toggleFavorite } from "@/app/sets/actions";

export function FavoriteButton({ setId, isFavorite, withLabel = false }: { setId: string; isFavorite: boolean; withLabel?: boolean }) {
  const label = isFavorite ? "أزل من المفضلة" : "أضف إلى المفضلة";
  return (
    <form action={toggleFavorite.bind(null, setId, isFavorite)}>
      <button
        type="submit"
        aria-pressed={isFavorite}
        aria-label={withLabel ? undefined : label}
        title={label}
        className={`flex items-center gap-2 rounded-full p-2 font-semibold transition-colors hover:bg-saffron-soft ${
          isFavorite ? "text-saffron" : "text-muted hover:text-saffron-deep"
        } ${withLabel ? "px-4 ring-1 ring-border" : ""}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6">
          <path
            d="M12 3.2l2.7 5.5 6 .9-4.35 4.2 1 6-5.35-2.8-5.35 2.8 1-6L3.3 9.6l6-.9z"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {withLabel && <span className="text-foreground">{isFavorite ? "في المفضلة" : "أضف إلى المفضلة"}</span>}
      </button>
    </form>
  );
}
