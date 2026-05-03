import { getInitials } from "@/lib/utils";

export function Avatar({
  name,
  email
}: {
  name: string;
  email?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
        {getInitials(name)}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-950">{name}</p>
        {email ? <p className="text-xs text-slate-500">{email}</p> : null}
      </div>
    </div>
  );
}
