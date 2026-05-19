import { useState } from "react";
import type { ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { LoadingButton } from "@/components/LoadingButton";
import { SectionCard } from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";

export function SupportTicketPage() {
  const [form, setForm] = useState({ name: "Meera Shah", email: "meera.shah@pixelotech.example", phone: "+91 98765 43210", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const submit = useMockSubmit();
  const toast = useAppToast();

  return (
    <div className="w-full max-w-4xl">
      <SectionCard>
        <h2 className="text-base font-semibold text-foreground">Contact Form</h2>
        <p className="mt-1 text-sm text-muted-foreground">Send a workspace support request.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field label="Subject"><Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="How can we help?" /></Field>
        </div>
        <Field label="Message">
          <textarea
            className="mt-2 min-h-32 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Describe your request"
            value={form.message}
          />
        </Field>
        <LoadingButton
          className="mt-5"
          isLoading={submit.isSubmitting}
          loadingText="Submitting..."
          onClick={() =>
            submit.run(() => {
              setSubmitted(true);
              toast.success("Support request submitted.");
            }, { onError: () => toast.error("Something went wrong. Please try again.") })
          }
        >
          Submit Request
        </LoadingButton>
        {submitted ? <p className="mt-3 text-sm font-medium text-whatsapp-dark">Support request submitted.</p> : null}
      </SectionCard>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>{children}</label>;
}
