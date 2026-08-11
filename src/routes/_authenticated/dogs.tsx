import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyDogs, saveDog, deleteDog, type Dog } from "@/lib/dogs.functions";

export const Route = createFileRoute("/_authenticated/dogs")({
  head: () => ({ meta: [{ title: "My Dogs — Zoélys" }] }),
  loader: () => getMyDogs(),
  component: DogsPage,
});

function DogsPage() {
  const { data: dogs } = useSuspenseQuery({
    queryKey: ["my-dogs"],
    queryFn: () => getMyDogs(),
  });
  const [editing, setEditing] = useState<Dog | "new" | null>(null);

  return (
    <SiteLayout>
      <section className="bg-espresso text-cream py-12 px-6">
        <div className="mx-auto max-w-5xl flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="tracking-brand text-terracotta-soft text-xs">
              — Your pack
            </div>
            <h1 className="font-serif text-4xl mt-2">My Dogs</h1>
            <p className="text-cream/70 text-sm mt-2 max-w-md">
              Add your dogs and choose if they appear on the community map so
              other owners can invite them to play.
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="bg-terracotta hover:bg-terracotta/90 text-cream rounded-full px-6 py-3 text-xs uppercase tracking-[0.18em]"
          >
            + Add a dog
          </button>
        </div>
      </section>

      <section className="py-12 px-6 bg-cream">
        <div className="mx-auto max-w-5xl">
          {dogs.length === 0 && (
            <div className="text-center py-16 text-espresso/60 italic font-serif">
              You haven't added any dogs yet.
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dogs.map((d) => (
              <button
                key={d.id}
                onClick={() => setEditing(d)}
                className="text-left p-6 rounded-2xl border border-espresso/10 bg-white hover:border-terracotta transition"
              >
                <div className="flex items-center gap-4">
                  {d.photo_url ? (
                    <img
                      src={d.photo_url}
                      alt={d.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-terracotta-soft flex items-center justify-center font-serif text-2xl text-espresso">
                      {d.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-serif text-xl text-espresso">
                      {d.name}
                    </div>
                    <div className="text-xs text-espresso/60">
                      {d.breed ?? "—"} · {d.size ?? ""}
                    </div>
                  </div>
                </div>
                {d.show_on_map ? (
                  <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-terracotta">
                    ● On the map
                  </p>
                ) : (
                  <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-espresso/40">
                    ○ Private
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {editing && (
        <DogEditor
          dog={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </SiteLayout>
  );
}

function DogEditor({ dog, onClose }: { dog: Dog | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveDog);
  const del = useServerFn(deleteDog);
  const [name, setName] = useState(dog?.name ?? "");
  const [breed, setBreed] = useState(dog?.breed ?? "");
  const [size, setSize] = useState<Dog["size"]>(dog?.size ?? "medium");
  const [age, setAge] = useState<string>(dog?.age_years?.toString() ?? "");
  const [bio, setBio] = useState(dog?.bio ?? "");
  const [photo, setPhoto] = useState(dog?.photo_url ?? "");
  const [showOnMap, setShowOnMap] = useState(dog?.show_on_map ?? false);
  const [lat, setLat] = useState<string>(dog?.lat?.toString() ?? "");
  const [lng, setLng] = useState<string>(dog?.lng?.toString() ?? "");
  const [neighborhood, setNeighborhood] = useState(dog?.neighborhood ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
      },
      () => setError("Could not get your location."),
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          id: dog?.id,
          name,
          breed: breed || undefined,
          size: size ?? undefined,
          age_years: age ? parseFloat(age) : undefined,
          bio: bio || undefined,
          photo_url: photo || undefined,
          show_on_map: showOnMap,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          neighborhood: neighborhood || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: ["my-dogs"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!dog) return;
    if (!confirm(`Remove ${dog.name}?`)) return;
    setBusy(true);
    try {
      await del({ data: { id: dog.id } });
      await qc.invalidateQueries({ queryKey: ["my-dogs"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-espresso/60 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={onSave}
        onClick={(e) => e.stopPropagation()}
        className="bg-cream max-w-lg w-full rounded-2xl p-8 space-y-4 my-12"
      >
        <h2 className="font-serif text-2xl text-espresso">
          {dog ? `Edit ${dog.name}` : "Add a dog"}
        </h2>
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
          />
          <input
            placeholder="Age (years)"
            type="number"
            step="0.5"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
          />
        </div>
        <select
          value={size ?? "medium"}
          onChange={(e) => setSize(e.target.value as Dog["size"])}
          className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
        >
          <option value="small">Small (under 10kg)</option>
          <option value="medium">Medium (10–25kg)</option>
          <option value="large">Large (25–40kg)</option>
          <option value="xlarge">XL (40kg+)</option>
        </select>
        <textarea
          placeholder="Bio — playstyle, favourite games…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
        />
        <input
          placeholder="Photo URL (optional)"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
        />

        <div className="border border-espresso/10 rounded-lg p-4 bg-white space-y-3">
          <label className="flex items-center gap-3 text-sm text-espresso">
            <input
              type="checkbox"
              checked={showOnMap}
              onChange={(e) => setShowOnMap(e.target.checked)}
            />
            Show {name || "this dog"} on the community map (exact location)
          </label>
          {showOnMap && (
            <>
              <input
                placeholder="Neighborhood (e.g. Brickell)"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
                />
                <input
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
                />
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                className="text-xs uppercase tracking-[0.18em] text-terracotta hover:underline"
              >
                Use my current location →
              </button>
              <p className="text-[10px] text-espresso/60 italic">
                Other signed-in owners will see exactly where you placed this
                pin. You can turn it off any time.
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {dog ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="text-xs uppercase tracking-[0.18em] text-red-700 hover:underline"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-espresso/60 hover:text-espresso"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-terracotta hover:bg-terracotta/90 text-cream rounded-full px-6 py-2.5 text-xs uppercase tracking-[0.18em] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
