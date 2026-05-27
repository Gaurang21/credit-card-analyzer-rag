import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { AddCardWizard } from "@/app/(app)/cards/new/wizard";

const PARSED_CARD = {
  name: "Chase Sapphire Preferred",
  issuer: "Chase",
  network: "Visa",
  last_four: null,
  annual_fee: 95,
  foreign_txn_fee_pct: 0,
  signup_bonus: { points: 60000, spend_required: 4000, months: 3 },
  notes: "Travel benefits",
  categories: [
    { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
    { category: "dining", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
    { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
  ],
};

describe("<AddCardWizard />", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("renders all three input tabs", () => {
    render(<AddCardWizard />);
    expect(screen.getByRole("tab", { name: /manual/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /fetch from web/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /upload pdf/i })).toBeInTheDocument();
  });

  it("fetch-from-web → confirm step → save flow", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (typeof url === "string" && url.includes("/api/cards/extract/web")) {
        return new Response(JSON.stringify({ url: "https://chase.com/cards/cspr", card: PARSED_CARD }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (typeof url === "string" && url === "/api/cards") {
        // Verify save payload looks like the parsed card
        const body = JSON.parse(init!.body as string);
        expect(body.name).toBe(PARSED_CARD.name);
        expect(body.categories).toHaveLength(3);
        return new Response(JSON.stringify({ id: "new-id" }), { status: 201 });
      }
      throw new Error(`Unexpected fetch ${url}`);
    });

    render(<AddCardWizard />);
    await user.click(screen.getByRole("tab", { name: /fetch from web/i }));
    await user.type(screen.getByTestId("web-query"), "Chase Sapphire Preferred");
    await user.click(screen.getByRole("button", { name: /^fetch$/i }));

    // Confirm screen appears
    expect(await screen.findByText(/Review the parsed data/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/card name/i) as HTMLInputElement).value).toBe("Chase Sapphire Preferred");
    expect((screen.getByLabelText(/annual fee/i) as HTMLInputElement).value).toBe("95");

    await user.click(screen.getByRole("button", { name: /save card/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("shows the fetch error inline when the API fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({ error: "Issuer page blocked the scraper" }), { status: 422 }),
    );

    render(<AddCardWizard />);
    await user.click(screen.getByRole("tab", { name: /fetch from web/i }));
    await user.type(screen.getByTestId("web-query"), "Mystery Card");
    await user.click(screen.getByRole("button", { name: /^fetch$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/issuer page blocked/i);
  });
});
