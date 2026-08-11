import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitMatchRequest } from "@/lib/matchRequests.functions";

export const Route = createFileRoute("/get-matched")({
  head: () => ({
    meta: [
      { title: "Find Your Match — Zoélys" },
      { name: "description", content: "Tell us about your pet and we'll handpick your perfect sitter within 24 hours." },
    ],
  }),
  component: GetMatched,
});

type FormData = Record<string, string | string[] | boolean>;

const stepsMeta = [
  "About You",
  "Your Pet",
  "Health & Care",
  "Service Needed",
  "Sitter Preferences",
  "Budget & Experience",
  "Final Details",
];

function GetMatched() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useServerFn(submitMatchRequest);

  const set = (k: string, v: FormData[string]) => setData((d) => ({ ...d, [k]: v }));

  async function handleSubmit() {
    setError(null);
    if (!data.consent) {
      setError("Please accept the consent to continue.");
      return;
    }
    if (!data.fullName || !data.email) {
      setError("Name and email are required.");
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      await submit({ data: data as Parameters<typeof submit>[0]["data"] });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const first = String(data.fullName || "").split(" ")[0] || "friend";
    return (
      <SiteLayout>
        <section className="min-h-[80vh] flex items-center justify-center px-6 py-24 bg-navy text-cream">
          <div className="max-w-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-gold mx-auto flex items-center justify-center mb-8">
              <Check className="w-10 h-10 text-navy" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl">Thank you, {first}.</h1>
            <div className="gold-rule" />
            <p className="mt-6 text-slate-muted leading-relaxed text-lg">
              Your request has been received. Our team will personally review your profile and send you
              your tailored match within 24 hours.
            </p>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-16 px-6 text-center">
        <div className="text-xs tracking-brand text-gold">YOUR REQUEST</div>
        <h1 className="font-serif text-4xl md:text-5xl mt-4">Tell us about your pet</h1>
        <div className="gold-rule" />
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-2xl">
          <Progress step={step} />

          <div className="card-soft p-8 md:p-12 mt-10">
            <h2 className="font-serif text-2xl text-navy mb-1">
              Step {step + 1}. {stepsMeta[step]}
            </h2>
            <div className="h-px bg-gold/30 my-6" />

            {step === 0 && <Step1 data={data} set={set} />}
            {step === 1 && <Step2 data={data} set={set} />}
            {step === 2 && <Step3 data={data} set={set} />}
            {step === 3 && <Step4 data={data} set={set} />}
            {step === 4 && <Step5 data={data} set={set} />}
            {step === 5 && <Step6 data={data} set={set} />}
            {step === 6 && <Step7 data={data} set={set} />}

            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-sm text-ink/60 hover:text-navy disabled:opacity-30"
              >
                ← Back
              </button>
              {step < stepsMeta.length - 1 ? (
                <button onClick={() => setStep((s) => s + 1)} className="btn-navy">
                  Continue →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-gold disabled:opacity-60">
                  {submitting ? "Sending…" : "Send My Request →"}
                </button>
              )}
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Progress({ step }: { step: number }) {
  const pct = ((step + 1) / stepsMeta.length) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs tracking-brand text-ink/50 mb-3">
        <span>STEP {step + 1} OF {stepsMeta.length}</span>
        <span className="text-gold">{stepsMeta[step].toUpperCase()}</span>
      </div>
      <div className="h-1 bg-navy/10 rounded-full overflow-hidden">
        <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block mb-5">
      <span className="text-sm text-navy font-medium block mb-2">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink/55 italic block mt-1.5">{hint}</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="input-elegant" />;
}
function Select({ options, ...props }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className="input-elegant">
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Toggle({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-full text-sm border transition ${
            value === o ? "bg-navy text-gold border-navy" : "bg-white text-navy border-navy/15 hover:border-gold"
          }`}>
          {o}
        </button>
      ))}
    </div>
  );
}
function MultiSelect({ value = [], onChange, options }: { value?: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`px-4 py-2 rounded-full text-sm border transition ${
            value.includes(o) ? "bg-gold text-navy border-gold" : "bg-white text-navy border-navy/15 hover:border-gold"
          }`}>
          {o}
        </button>
      ))}
    </div>
  );
}

type StepProps = { data: FormData; set: (k: string, v: FormData[string]) => void };

function Step1({ data, set }: StepProps) {
  return (
    <>
      <Field label="Full name"><Input value={String(data.fullName || "")} onChange={(e) => set("fullName", e.target.value)} /></Field>
      <Field label="Email"><Input type="email" value={String(data.email || "")} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Phone"><Input value={String(data.phone || "")} onChange={(e) => set("phone", e.target.value)} /></Field>
      <Field label="Neighbourhood / area" hint="We use this to tailor your match to sitters in your area.">
        <Input value={String(data.area || "")} onChange={(e) => set("area", e.target.value)} />
      </Field>
    </>
  );
}
function Step2({ data, set }: StepProps) {
  return (
    <>
      <Field label="Animal type"><Select options={["Dog","Cat","Bird","Rabbit","Reptile","Fish","Other"]} value={String(data.animal||"")} onChange={(e)=>set("animal",e.target.value)} /></Field>
      <div className="grid md:grid-cols-2 gap-x-6">
        <Field label="Breed"><Input value={String(data.breed||"")} onChange={(e)=>set("breed",e.target.value)} /></Field>
        <Field label="Pet name"><Input value={String(data.petName||"")} onChange={(e)=>set("petName",e.target.value)} /></Field>
        <Field label="Age"><Input value={String(data.age||"")} onChange={(e)=>set("age",e.target.value)} /></Field>
        <Field label="Size / weight"><Input value={String(data.size||"")} onChange={(e)=>set("size",e.target.value)} /></Field>
      </div>
      <Field label="Sex"><Toggle value={String(data.sex||"")} onChange={(v)=>set("sex",v)} options={["Male","Female"]} /></Field>
      <Field label="Temperament"><Select options={["Calm","Playful","Anxious","Energetic","Aggressive at times"]} value={String(data.temperament||"")} onChange={(e)=>set("temperament",e.target.value)} /></Field>
      <Field label="House-trained"><Toggle value={String(data.houseTrained||"")} onChange={(v)=>set("houseTrained",v)} options={["Yes","No","In progress"]} /></Field>
      <Field label="Behavioural traits">
        <MultiSelect value={data.traits as string[]} onChange={(v)=>set("traits",v)} options={["Pulls on lead","Separation anxiety","Food aggressive","Good with kids","Good with other animals","Escape artist","Needs constant attention","Very independent"]} />
      </Field>
    </>
  );
}
function Step3({ data, set }: StepProps) {
  const hasMed = data.hasMedical === "Yes";
  return (
    <>
      <Field label="Medical conditions"><Toggle value={String(data.hasMedical||"")} onChange={(v)=>set("hasMedical",v)} options={["No","Yes"]} /></Field>
      {hasMed && <Field label="Please describe"><textarea className="input-elegant min-h-24" value={String(data.medicalDesc||"")} onChange={(e)=>set("medicalDesc",e.target.value)} /></Field>}
      <Field label="Vaccination status"><Select options={["Fully up to date","Partially","Not vaccinated"]} value={String(data.vaccines||"")} onChange={(e)=>set("vaccines",e.target.value)} /></Field>
      <Field label="Parasite prevention"><Select options={["Up to date","Occasional","None"]} value={String(data.parasite||"")} onChange={(e)=>set("parasite",e.target.value)} /></Field>
      <Field label="Diet type"><Select options={["Kibble","Wet food","Raw","Home-cooked","Mixed"]} value={String(data.diet||"")} onChange={(e)=>set("diet",e.target.value)} /></Field>
      <Field label="Food allergies (optional)"><Input value={String(data.allergies||"")} onChange={(e)=>set("allergies",e.target.value)} /></Field>
      <div className="grid md:grid-cols-2 gap-x-6">
        <Field label="Meals per day"><Input type="number" value={String(data.meals||"")} onChange={(e)=>set("meals",e.target.value)} /></Field>
        <Field label="Exercise needs"><Select options={["Low","Moderate","High","Very high"]} value={String(data.exercise||"")} onChange={(e)=>set("exercise",e.target.value)} /></Field>
      </div>
      <Field label="Sleeping arrangement"><Select options={["Own bed","Crate","Owner's bed","Designated room"]} value={String(data.sleep||"")} onChange={(e)=>set("sleep",e.target.value)} /></Field>
    </>
  );
}
function Step4({ data, set }: StepProps) {
  const recurring = data.recurring === "Yes";
  return (
    <>
      <Field label="Service type">
        <MultiSelect value={data.services as string[]} onChange={(v)=>set("services",v)} options={["Home visit","Overnight stay","Day care","Dog walking"]} />
      </Field>
      <div className="grid md:grid-cols-2 gap-x-6">
        <Field label="Start date"><Input type="date" value={String(data.startDate||"")} onChange={(e)=>set("startDate",e.target.value)} /></Field>
        <Field label="End date"><Input type="date" value={String(data.endDate||"")} onChange={(e)=>set("endDate",e.target.value)} /></Field>
      </div>
      <Field label="Recurring need"><Toggle value={String(data.recurring||"")} onChange={(v)=>set("recurring",v)} options={["No","Yes"]} /></Field>
      {recurring && <Field label="Frequency"><Select options={["Weekly","Bi-weekly","Monthly","Custom"]} value={String(data.frequency||"")} onChange={(e)=>set("frequency",e.target.value)} /></Field>}
      <Field label="Hours per day"><Input type="number" value={String(data.hours||"")} onChange={(e)=>set("hours",e.target.value)} /></Field>
    </>
  );
}
function Step5({ data, set }: StepProps) {
  return (
    <>
      <Field label="Experience level"><Select options={["Some experience","Experienced","Highly experienced"]} value={String(data.expLevel||"")} onChange={(e)=>set("expLevel",e.target.value)} /></Field>
      <Field label="Outdoor space needed"><Toggle value={String(data.outdoor||"")} onChange={(v)=>set("outdoor",v)} options={["No","Yes"]} /></Field>
      <Field label="Other pets allowed"><Toggle value={String(data.otherPets||"")} onChange={(v)=>set("otherPets",v)} options={["No","Yes"]} /></Field>
      <Field label="Children in home"><Toggle value={String(data.children||"")} onChange={(v)=>set("children",v)} options={["No","Yes"]} /></Field>
      <Field label="Gender preference"><Toggle value={String(data.genderPref||"")} onChange={(v)=>set("genderPref",v)} options={["No preference","Female","Male"]} /></Field>
      <Field label="Language preference"><Input value={String(data.language||"")} onChange={(e)=>set("language",e.target.value)} /></Field>
      <Field label="Update frequency preference">
        <Select options={["Every 15 min","Every 30 min","Every hour","Every 2 hours","Once a day","Only if something happens"]} value={String(data.updates||"")} onChange={(e)=>set("updates",e.target.value)} />
      </Field>
      <Field label="Other qualities you'd value (free text)">
        <textarea className="input-elegant min-h-24" value={String(data.otherQualities||"")} onChange={(e)=>set("otherQualities",e.target.value)} />
      </Field>
    </>
  );
}
function Step6({ data, set }: StepProps) {
  const used = data.usedBefore === "Yes";
  return (
    <>
      <Field label="Have you used a pet sitter before?"><Toggle value={String(data.usedBefore||"")} onChange={(v)=>set("usedBefore",v)} options={["No","Yes"]} /></Field>
      {used && (
        <Field label="Did you experience any issues? Tell us so we can make sure your Zoélys experience is different.">
          <textarea className="input-elegant min-h-24" value={String(data.issues||"")} onChange={(e)=>set("issues",e.target.value)} />
        </Field>
      )}
      <div className="rounded-xl border border-gold/30 bg-cream/60 p-5 text-sm text-ink/75 italic mt-2">
        Pricing is tailored to your pet's needs and your chosen sitter. We'll include a full transparent quote in your match proposal.
      </div>
    </>
  );
}
function Step7({ data, set }: StepProps) {
  return (
    <>
      <Field label="How did you hear about Zoélys?">
        <Select options={["A friend","Instagram","TikTok","Google search","A partner","Other"]} value={String(data.referral||"")} onChange={(e)=>set("referral",e.target.value)} />
      </Field>
      <Field label="Anything else you'd like to share (optional)">
        <textarea className="input-elegant min-h-28" value={String(data.notes||"")} onChange={(e)=>set("notes",e.target.value)} />
      </Field>
      <label className="flex items-start gap-3 mt-4 cursor-pointer">
        <input type="checkbox" checked={!!data.consent} onChange={(e)=>set("consent",e.target.checked)} className="mt-1 accent-[#C9A84C]" />
        <span className="text-sm text-ink/75">
          I agree to be contacted by the Zoélys team and consent to my information being used to find my tailored match.
        </span>
      </label>
    </>
  );
}
