import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type SignInResult = {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
};

const hoisted = vi.hoisted(() => {
  return {
    signInWithPassword: vi.fn<() => Promise<SignInResult>>(async () => ({
      data: { session: { access_token: "tok" } },
      error: null,
    })),
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    searchMock: vi.fn<(k: string) => string | null>(() => null),
  };
});

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signInWithPassword: hoisted.signInWithPassword },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hoisted.pushMock, refresh: hoisted.refreshMock }),
  useSearchParams: () => ({ get: hoisted.searchMock }),
}));

import { LoginForm } from "@/app/(auth)/login/login-form";

describe("<LoginForm />", () => {
  beforeEach(() => {
    hoisted.pushMock.mockReset();
    hoisted.refreshMock.mockReset();
    hoisted.searchMock.mockReset().mockReturnValue(null);
    hoisted.signInWithPassword.mockReset().mockResolvedValue({
      data: { session: { access_token: "tok" } },
      error: null,
    });
  });

  it("renders email + password fields and a submit button", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("redirects to /dashboard after a successful sign-in", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "test@vault.app");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(hoisted.pushMock).toHaveBeenCalledWith("/dashboard"));
    expect(hoisted.refreshMock).toHaveBeenCalled();
  });

  it("surfaces an inline error on auth failure", async () => {
    hoisted.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "wrong@vault.app");
    await user.type(screen.getByLabelText(/password/i), "nope");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid login credentials/i);
    expect(hoisted.pushMock).not.toHaveBeenCalled();
  });

  it("respects the ?next= redirect target", async () => {
    hoisted.searchMock.mockReturnValue("/cards/new");
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "ok@vault.app");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(hoisted.pushMock).toHaveBeenCalledWith("/cards/new"));
  });
});
