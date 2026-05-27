import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type SignUpResult = {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
};

const hoisted = vi.hoisted(() => ({
  signUp: vi.fn<() => Promise<SignUpResult>>(async () => ({
    data: { session: { access_token: "tok" } },
    error: null,
  })),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({ auth: { signUp: hoisted.signUp } }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hoisted.pushMock, refresh: hoisted.refreshMock }),
}));

import { SignupForm } from "@/app/(auth)/signup/signup-form";

describe("<SignupForm />", () => {
  beforeEach(() => {
    hoisted.pushMock.mockReset();
    hoisted.refreshMock.mockReset();
    hoisted.signUp.mockReset().mockResolvedValue({
      data: { session: { access_token: "tok" } },
      error: null,
    });
  });

  it("routes to /dashboard when a session is returned immediately", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(screen.getByLabelText(/email/i), "new@vault.app");
    await user.type(screen.getByLabelText(/password/i), "secret-pass");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => expect(hoisted.pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a 'check your email' notice when confirmation is required", async () => {
    hoisted.signUp.mockResolvedValueOnce({ data: { session: null }, error: null });
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(screen.getByLabelText(/email/i), "new@vault.app");
    await user.type(screen.getByLabelText(/password/i), "secret-pass");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/check your email/i);
    expect(hoisted.pushMock).not.toHaveBeenCalled();
  });
});
