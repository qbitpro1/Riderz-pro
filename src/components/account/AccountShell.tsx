import type { ReactNode } from "react";
import type { CustomerSelf } from "@/lib/account/types";
import { AccountNav } from "./AccountNav";

/** Page frame for every signed-in account page: greeting, section tabs, content. */
export function AccountShell({ me, title, children }: { me: CustomerSelf; title: string; children: ReactNode }) {
  const first = me.name?.trim().split(/\s+/)[0];
  return (
    <section className="shell pb-16 pt-28 md:pb-24 md:pt-36">
      <p className="eyebrow">{first ? `Hi ${first}` : "Your account"}</p>
      <h1 className="display-3 mt-2">{title}</h1>
      <div className="mt-6">
        <AccountNav />
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
