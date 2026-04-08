"use client";

import { UploadDropzone } from "@uploadthing/react";
import { UploadCloud } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";

import {
  type ProfileActionState,
  updateProfileSettingsAction,
} from "@/modules/profile/actions/profile.actions";
import type { OurFileRouter } from "@/shared/lib/uploadthing";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

type ProfileSettingsFormProps = {
  initialValues: {
    image: string;
    name: string;
    bio: string;
    region: string;
    socialLinks: string[];
    email: string;
  };
};

const initialState: ProfileActionState = {
  error: null,
  success: null,
};

function SaveProfileButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="min-w-[160px]" disabled={pending} type="submit">
      {pending ? "Saving..." : "Save settings"}
    </Button>
  );
}

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
  const [state, formAction] = useFormState(updateProfileSettingsAction, initialState);
  const paddedSocialLinks = Array.from(
    { length: 4 },
    (_, index) => initialValues.socialLinks[index] ?? "",
  );

  return (
    <form action={formAction} className="space-y-8">
      <input name="image" type="hidden" value={initialValues.image} />

      <section className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
          <p className="text-sm font-semibold text-[rgb(var(--foreground))]">Display picture</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
            Upload a square profile image. UploadThing saves it immediately to your account record.
          </p>

          <div className="mt-6 flex items-center justify-center">
            {initialValues.image ? (
              <img
                alt="Current profile avatar"
                className="h-28 w-28 rounded-[28px] border border-[rgb(var(--border))] object-cover shadow-lg"
                src={initialValues.image}
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--muted-foreground))]">
                <UploadCloud className="h-7 w-7" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
          <UploadDropzone<OurFileRouter, "avatarUploader">
            appearance={{
              button:
                "ut-ready:bg-[rgb(var(--accent-strong))] ut-ready:hover:bg-[rgb(var(--accent-strong))/0.9] ut-uploading:cursor-progress ut-uploading:bg-[rgb(var(--surface-elevated))]",
              container:
                "rounded-[24px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-6 text-[rgb(var(--foreground))]",
              allowedContent: "text-[rgb(var(--muted-foreground))]",
            }}
            className="w-full ut-label:text-sm ut-button:h-11 ut-button:rounded-2xl ut-button:px-4 ut-button:text-sm ut-allowed-content:text-xs"
            endpoint="avatarUploader"
          />
          <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
            UploadThing powered
          </p>
        </div>
      </section>

      <section className="grid gap-6 rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="name">
            Name
          </label>
          <Input defaultValue={initialValues.name} id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="region">
            Region
          </label>
          <Input defaultValue={initialValues.region} id="region" name="region" placeholder="Mumbai, India" />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="email">
            Account email
          </label>
          <Input defaultValue={initialValues.email} disabled id="email" />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="bio">
            Bio
          </label>
          <Textarea
            defaultValue={initialValues.bio}
            id="bio"
            maxLength={280}
            name="bio"
            placeholder="Tell HorizonSync who you are and what you care about."
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Social links</h2>
            <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
              HorizonSync reserves exactly four public link slots for your profile.
            </p>
          </div>
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
            4 slots
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {paddedSocialLinks.map((value, index) => (
            <div className="space-y-2" key={index}>
              <label
                className="text-sm font-medium text-[rgb(var(--foreground))]"
                htmlFor={`socialLink${index}`}
              >
                Social link {index + 1}
              </label>
              <Input
                defaultValue={value}
                id={`socialLink${index}`}
                name={`socialLink${index}`}
                placeholder="https://example.com/your-profile"
              />
            </div>
          ))}
        </div>
      </section>

      {state.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {state.success}
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <SaveProfileButton />
      </div>
    </form>
  );
}
