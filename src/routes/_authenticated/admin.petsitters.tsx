import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listPetsitters,
  createPetsitter,
  updatePetsitter,
  deletePetsitter,
} from "@/lib/petsitters.functions";

export const Route = createFileRoute("/_authenticated/admin/petsitters")({
  ssr: false,
  component: AdminPetsitters,
});

const SERVICES = ["Home visit", "Overnight stay", "Day care", "Dog walking"];
const ANIMALS = ["Dog", "Cat", "Bird", "Rabbit", "Reptile", "Fish", "Other"];
const SIZES = ["small", "medium", "large", "xl"];
const EXP = ["Some experience", "Experienced", "Highly experienced"];
const STATUSES = ["pending", "approved", "paused"] as const;

type Sitter = Awaited<ReturnType<typeof listPetsitters>>[number];

function AdminPetsitters() {
  const list = useServerFn(listPetsitters);
  const qc = useQueryClient();
  const { data: sitters = [], isLoading, error } = useQuery({
    queryKey: ["petsitters"],
    queryFn: () => list(),
  });
  const [editing, setEditing] = useState<Partial<Sitter> | null>(null);

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-10 px-6">
        <div className="mx-auto max-w-6xl flex justify-between items-end">
          <div>
            <div className="tracking-brand text-gold text-xs">— Admin</div>
            <h1 className="font-serif text-3xl mt-2">Approved petsitters</h1>
          </div>
          <button onClick={() => setEditing({})} className="btn-gold">
            + Add sitter
          </button>
        </div>
      </section>

      <section className="py-10 px-6 max-w-6xl mx-auto">
        {isLoading && <p className="text-ink/60">Loading…</p>}
        {error && <p className="text-red-700">{String((error as Error).message)}</p>}

        <div className="grid gap-3">
          {sitters.map((s) => (
            <div key={s.id} className="border border-navy/10 rounded-lg p-4 bg-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-xl text-navy">{s.full_name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === "approved" ? "bg-green-100 text-green-800" :
                    s.status === "paused" ? "bg-amber-100 text-amber-800" :
                    "bg-slate-100 text-slate-700"
                  }`}>{s.status}</span>
                </div>
                <p className="text-sm text-ink/70 mt-1">
                  {s.experience_level} · {s.years_experience}y · {s.neighborhoods.join(", ") || "no areas"}
                </p>
                <p className="text-xs text-ink/55 mt-1">
                  Services: {s.services.join(", ") || "—"} · Animals: {s.animals.join(", ") || "—"}
                </p>
              </div>
              <button onClick={() => setEditing(s)} className="text-gold text-sm hover:underline">Edit</button>
            </div>
          ))}
          {!isLoading && sitters.length === 0 && (
            <p className="text-ink/60 italic">No petsitters yet — add one to start matching.</p>
          )}
        </div>
      </section>

      {editing && (
        <SitterForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["petsitters"] });
            setEditing(null);
          }}
        />
      )}
    </SiteLayout>
  );
}

function SitterForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Sitter>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const create = useServerFn(createPetsitter);
  const update = useServerFn(updatePetsitter);
  const del = useServerFn(deletePetsitter);
  const isEdit = !!initial.id;

  const [f, setF] = useState({
    full_name: initial.full_name ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    photo_url: initial.photo_url ?? "",
    bio: initial.bio ?? "",
    languages: (initial.languages ?? []).join(", "),
    neighborhoods: (initial.neighborhoods ?? []).join(", "),
    services: initial.services ?? [],
    animals: initial.animals ?? [],
    size_capacity: initial.size_capacity ?? [],
    experience_level: initial.experience_level ?? "Some experience",
    years_experience: initial.years_experience ?? 0,
    has_outdoor_space: initial.has_outdoor_space ?? false,
    accepts_other_pets: initial.accepts_other_pets ?? false,
    accepts_children: initial.accepts_children ?? false,
    handles_medical: initial.handles_medical ?? false,
    handles_aggressive: initial.handles_aggressive ?? false,
    handles_anxious: initial.handles_anxious ?? false,
    gender: initial.gender ?? "",
    hourly_rate: initial.hourly_rate ?? null,
    daily_rate: initial.daily_rate ?? null,
    max_concurrent_bookings: initial.max_concurrent_bookings ?? 3,
    status: (initial.status ?? "pending") as typeof STATUSES[number],
    admin_notes: initial.admin_notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      setBusy(true);
      setErr(null);
      const payload = {
        ...f,
        languages: f.languages.split(",").map((s) => s.trim()).filter(Boolean),
        neighborhoods: f.neighborhoods.split(",").map((s) => s.trim()).filter(Boolean),
        years_experience: Number(f.years_experience) || 0,
        max_concurrent_bookings: Number(f.max_concurrent_bookings) || 3,
        hourly_rate: f.hourly_rate ? Number(f.hourly_rate) : null,
        daily_rate: f.daily_rate ? Number(f.daily_rate) : null,
      };
      if (isEdit && initial.id) {
        await update({ data: { id: initial.id, patch: payload } });
      } else {
        await create({ data: payload });
      }
    },
    onSuccess: onSaved,
    onError: (e) => setErr(e instanceof Error ? e.message : "Failed"),
    onSettled: () => setBusy(false),
  });

  const toggleArr = (key: "services" | "animals" | "size_capacity", v: string) =>
    setF((s) => ({
      ...s,
      [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v],
    }));

  return (
    <div className="fixed inset-0 bg-navy/60 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cream max-w-2xl w-full rounded-2xl p-8 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl text-navy mb-4">
          {isEdit ? "Edit sitter" : "New sitter"}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <L label="Full name *"><input className="input-elegant" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></L>
          <L label="Status">
            <select className="input-elegant" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as typeof STATUSES[number] })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </L>
          <L label="Email"><input className="input-elegant" value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></L>
          <L label="Phone"><input className="input-elegant" value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></L>
          <L label="Photo URL"><input className="input-elegant" value={f.photo_url ?? ""} onChange={(e) => setF({ ...f, photo_url: e.target.value })} /></L>
          <L label="Gender"><input className="input-elegant" value={f.gender ?? ""} onChange={(e) => setF({ ...f, gender: e.target.value })} placeholder="Female / Male / Non-binary" /></L>
        </div>
        <L label="Bio"><textarea className="input-elegant min-h-20" value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} /></L>
        <L label="Languages (comma-separated)"><input className="input-elegant" value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} placeholder="English, Spanish" /></L>
        <L label="Neighborhoods covered (comma-separated)"><input className="input-elegant" value={f.neighborhoods} onChange={(e) => setF({ ...f, neighborhoods: e.target.value })} placeholder="Brickell, Wynwood, South Beach" /></L>

        <Chips label="Services offered" options={SERVICES} value={f.services} onToggle={(v) => toggleArr("services", v)} />
        <Chips label="Animals accepted" options={ANIMALS} value={f.animals} onToggle={(v) => toggleArr("animals", v)} />
        <Chips label="Size capacity" options={SIZES} value={f.size_capacity} onToggle={(v) => toggleArr("size_capacity", v)} />

        <div className="grid md:grid-cols-3 gap-4 mt-2">
          <L label="Experience level">
            <select className="input-elegant" value={f.experience_level} onChange={(e) => setF({ ...f, experience_level: e.target.value })}>
              {EXP.map((s) => <option key={s}>{s}</option>)}
            </select>
          </L>
          <L label="Years"><input type="number" className="input-elegant" value={f.years_experience} onChange={(e) => setF({ ...f, years_experience: Number(e.target.value) })} /></L>
          <L label="Max bookings"><input type="number" className="input-elegant" value={f.max_concurrent_bookings} onChange={(e) => setF({ ...f, max_concurrent_bookings: Number(e.target.value) })} /></L>
          <L label="Hourly rate ($)"><input type="number" className="input-elegant" value={f.hourly_rate ?? ""} onChange={(e) => setF({ ...f, hourly_rate: e.target.value ? Number(e.target.value) : null })} /></L>
          <L label="Daily rate ($)"><input type="number" className="input-elegant" value={f.daily_rate ?? ""} onChange={(e) => setF({ ...f, daily_rate: e.target.value ? Number(e.target.value) : null })} /></L>
        </div>

        <div className="grid md:grid-cols-2 gap-2 mt-3">
          {([
            ["has_outdoor_space", "Has outdoor space"],
            ["accepts_other_pets", "Accepts homes with other pets"],
            ["accepts_children", "Accepts homes with children"],
            ["handles_medical", "Handles medical conditions"],
            ["handles_aggressive", "Handles reactive/aggressive pets"],
            ["handles_anxious", "Handles anxious pets"],
          ] as const).map(([k, lbl]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" checked={f[k] as boolean} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />
              {lbl}
            </label>
          ))}
        </div>

        <L label="Admin notes"><textarea className="input-elegant min-h-16" value={f.admin_notes ?? ""} onChange={(e) => setF({ ...f, admin_notes: e.target.value })} /></L>

        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-3">{err}</p>}

        <div className="flex justify-between items-center mt-6">
          {isEdit ? (
            <button
              onClick={async () => {
                if (!confirm("Delete this sitter?")) return;
                await del({ data: { id: initial.id! } });
                onSaved();
              }}
              className="text-sm text-red-700 hover:underline"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-ink/60 hover:text-navy">Cancel</button>
            <button onClick={() => save.mutate()} disabled={busy} className="btn-navy disabled:opacity-50">
              {busy ? "Saving…" : "Save sitter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-3">
      <span className="text-sm text-navy font-medium block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Chips({ label, options, value, onToggle }: { label: string; options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="mt-3">
      <div className="text-sm text-navy font-medium mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              value.includes(o) ? "bg-navy text-gold border-navy" : "bg-white text-navy border-navy/15 hover:border-gold"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
