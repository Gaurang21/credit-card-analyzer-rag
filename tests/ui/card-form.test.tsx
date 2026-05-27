import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardForm } from "@/components/card-form";
import type { CardInput } from "@/lib/cards/schema";

const EMPTY: CardInput = {
  name: "",
  issuer: "",
  network: null,
  last_four: "",
  annual_fee: 0,
  foreign_txn_fee_pct: 0,
  signup_bonus: null,
  notes: "",
  categories: [],
};

describe("<CardForm />", () => {
  it("submits a minimal manual card", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CardForm initial={EMPTY} onSubmit={onSubmit} submitLabel="Save card" />);

    await user.type(screen.getByLabelText(/card name/i), "Sapphire Preferred");
    await user.type(screen.getByLabelText(/issuer/i), "Chase");
    await user.selectOptions(screen.getByLabelText(/network/i), "Visa");
    await user.clear(screen.getByLabelText(/annual fee/i));
    await user.type(screen.getByLabelText(/annual fee/i), "95");

    await user.click(screen.getByRole("button", { name: /save card/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]![0] as CardInput;
    expect(payload.name).toBe("Sapphire Preferred");
    expect(payload.issuer).toBe("Chase");
    expect(payload.network).toBe("Visa");
    expect(payload.annual_fee).toBe(95);
  });

  it("adds and removes a rewards category", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CardForm initial={EMPTY} onSubmit={onSubmit} submitLabel="Save" />);

    await user.type(screen.getByLabelText(/card name/i), "Test Card");
    await user.click(screen.getByRole("button", { name: /add category/i }));

    const categoryInputs = screen.getAllByPlaceholderText("dining");
    await user.type(categoryInputs[0]!, "dining");
    const multInputs = screen.getAllByPlaceholderText("3");
    await user.clear(multInputs[0]!);
    await user.type(multInputs[0]!, "4");

    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0]![0] as CardInput;
    expect(payload.categories).toHaveLength(1);
    expect(payload.categories[0]).toMatchObject({ category: "dining", multiplier: 4 });
  });

  it("shows validation errors for a bad last-4", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CardForm initial={EMPTY} onSubmit={onSubmit} submitLabel="Save" />);
    await user.type(screen.getByLabelText(/card name/i), "Bad");
    await user.type(screen.getByLabelText(/last 4/i), "12");
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText(/exactly 4 digits/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
