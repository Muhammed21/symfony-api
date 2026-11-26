import { useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import { CircleUser, LogOut } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { Avatar, ButtonTextAndSymbol, Link } from "@prime/ui";

import type { Session } from "../domain/account.ts";
import type { AccountUseCases } from "./use-cases.ts";
import { SESSION_QUERY_KEY, useSession } from "./use-session.ts";

import styles from "./account-button.module.css";

const LogInLink = () => {
  const here = useRouterState({ select: (state) => state.location.href });
  return (
    <Link
      label="Se connecter"
      size="regular"
      symbol={<CircleUser />}
      render={(anchor) => <RouterLink {...anchor} to="/compte" search={{ redirect: here }} />}
    />
  );
};

const AccountMenu = ({
  session,
  account,
}: {
  readonly session: Session;
  readonly account: AccountUseCases;
}) => {
  const queryClient = useQueryClient();
  const menuId = useId();
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const closeFromOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, [open]);

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      button.current?.focus();
    }
  };

  const logOut = () => {
    account.logOut();
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
  };

  return (
    <div ref={container} className={styles.account} onKeyDown={closeOnEscape}>
      <button
        ref={button}
        type="button"
        className={styles.avatarButton}
        aria-label={`Compte de ${session.email}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <Avatar initial={session.email.charAt(0).toUpperCase()} />
      </button>
      {open && (
        <section id={menuId} aria-label="Compte" className={styles.menu}>
          <p className={styles.email}>{session.email}</p>
          <ButtonTextAndSymbol label="Se déconnecter" symbol={<LogOut />} onClick={logOut} />
        </section>
      )}
    </div>
  );
};

export const AccountButton = ({ account }: { readonly account: AccountUseCases }) => {
  const { data: session } = useSession(account);
  return session === null ? <LogInLink /> : <AccountMenu session={session} account={account} />;
};
