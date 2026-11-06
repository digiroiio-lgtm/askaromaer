"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/actions/state";
import { Notice } from "./ui";

const Ctx = createContext<FormState>({});
/** pending flag for SubmitButton (useFormStatus does not see manual submissions) */
export const PendingCtx = createContext(false);

export function ActionForm({
  action,
  locale,
  children,
  className = "space-y-4",
  hidden,
  resetOnSuccess,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  locale: string;
  children: React.ReactNode;
  className?: string;
  hidden?: Record<string, string>;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
    if (state.redirectTo) router.push(state.redirectTo);
    else if (state.ok) router.refresh();
  }, [state, router, resetOnSuccess]);
  return (
    <Ctx.Provider value={state}>
     <PendingCtx.Provider value={pending}>
      {/* Submit manually so React does not reset the fields when validation fails */}
      <form
        ref={ref}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        {state.error && <Notice kind="error">{state.error}</Notice>}
        {state.ok && state.message && <Notice kind="success">{state.message}</Notice>}
        {children}
      </form>
     </PendingCtx.Provider>
    </Ctx.Provider>
  );
}

function useFieldError(name: string) {
  return useContext(Ctx).fields?.[name];
}

function Err({ name }: { name: string }) {
  const e = useFieldError(name);
  return e ? <p id={`${name}-err`} className="mt-1 text-[13px] text-rose-700">{e}</p> : null;
}

type Base = { name: string; label: string; hint?: string; icon?: React.ReactNode; srLabel?: boolean };

export function Input({ name, label, hint, icon, srLabel, ...rest }: Base & React.InputHTMLAttributes<HTMLInputElement>) {
  const e = useFieldError(name);
  return (
    <div>
      <label htmlFor={`f-${name}`} className={srLabel ? "sr-only" : "label"}>{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2">{icon}</span>}
        <input id={`f-${name}`} name={name} aria-invalid={!!e} aria-describedby={e ? `${name}-err` : undefined} placeholder={srLabel ? label : rest.placeholder} className={`input ${icon ? "pl-11" : ""} ${e ? "border-rose-400" : ""}`} {...rest} />
      </div>
      {hint && !e && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
      <Err name={name} />
    </div>
  );
}

export function Textarea({ name, label, hint, ...rest }: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const e = useFieldError(name);
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <textarea id={`f-${name}`} name={name} rows={5} aria-invalid={!!e} className={`input ${e ? "border-rose-400" : ""}`} {...rest} />
      {hint && !e && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
      <Err name={name} />
    </div>
  );
}

export function Select({ name, label, options, icon, srLabel, ...rest }: Base & { options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const e = useFieldError(name);
  return (
    <div>
      <label htmlFor={`f-${name}`} className={srLabel ? "sr-only" : "label"}>{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none">{icon}</span>}
        <select id={`f-${name}`} name={name} aria-invalid={!!e} className={`input appearance-none ${icon ? "pl-11" : ""} ${e ? "border-rose-400" : ""}`} {...rest}>
          {srLabel && <option value="">{label}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <Err name={name} />
    </div>
  );
}

export function CheckGroup({ name, label, options, defaultValues = [], columns = 2 }: { name: string; label: string; options: { value: string; label: string }[]; defaultValues?: string[]; columns?: number }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className={`grid gap-2 ${columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-[14px] cursor-pointer">
            <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValues.includes(o.value)} className="check" />
            {o.label}
          </label>
        ))}
      </div>
      <Err name={name} />
    </fieldset>
  );
}

export function FieldError({ name }: { name: string }) {
  return <Err name={name} />;
}
