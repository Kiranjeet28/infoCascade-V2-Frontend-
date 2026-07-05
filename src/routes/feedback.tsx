import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, MessageSquare, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { feedbackApi } from "@/api/feedback";
import { useSubmissionLock } from "@/hooks/use-submission-lock";


export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — InfoCascade" },
      {
        name: "description",
        content:
          "Share your feedback, suggestions, or report an issue to help us improve InfoCascade.",
      },
      { property: "og:title", content: "Feedback — InfoCascade" },
      {
        property: "og:description",
        content:
          "Share your feedback, suggestions, or report an issue to help us improve InfoCascade.",
      },
    ],
  }),
  component: FeedbackPage,
});

const CATEGORIES = ["Bug", "Feature", "UX", "Other"] as const;

function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Bug");

  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const lock = useSubmissionLock("feedback");
  const [lastAttempt, setLastAttempt] = useState(0);

  const mut = useMutation({
    mutationFn: () =>
      feedbackApi.create({
        name: name.trim(),
        email: email.trim(),
        category,
        rating,
        message: message.trim(),
      }),
    onSuccess: () => {
      toast.success("Thanks! Your feedback has been submitted.");
      lock.markSubmitted();
      setName("");
      setEmail("");
      setCategory("Bug");
      setRating(5);
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit feedback"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.alreadySubmitted) {
      toast.error("You've already submitted feedback from this device.");
      return;
    }
    const now = Date.now();
    if (now - lastAttempt < 3000) {
      toast.error("Please wait a few seconds before retrying.");
      return;
    }
    setLastAttempt(now);
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    if (name.length > 100 || email.length > 255 || message.length > 1000) {
      toast.error("One of the fields is too long.");
      return;
    }
    mut.mutate();
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 text-accent" /> We're listening
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Share your feedback
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Bug, suggestion, or a kind word — it all helps us make InfoCascade better.
          </p>
        </header>

        {lock.alreadySubmitted ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-8 text-center shadow-soft">
            <CheckCircle2 className="h-10 w-10 text-accent" />
            <h2 className="font-display text-xl font-semibold">Feedback already received</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Thanks — we've already recorded a submission from this device. To keep things fair,
              only one feedback entry is allowed per person.
            </p>
          </div>
        ) : (
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-soft"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Rating">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`h-6 w-6 transition ${
                      n <= rating
                        ? "fill-accent text-accent"
                        : "text-muted-foreground hover:text-accent"
                    }`}
                  />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Tell us what's on your mind…"
              className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mut.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {mut.isPending ? "Sending…" : "Send feedback"}
            </button>
          </div>
        </form>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
