import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdvisorChat } from "@/app/(app)/advisor/chat";

/** Build a fake SSE Response body with the events the route would emit. */
function buildSseResponse(events: object[]) {
  const encoder = new TextEncoder();
  const lines = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Split into a few chunks so the streaming code path is exercised.
      const chunks = lines.match(/.{1,40}/gs) ?? [lines];
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

const SAMPLE_META = {
  intent: { merchant: "Apple Store", category: "electronics", amount: 3000, is_international: false },
  resolvedCategory: "electronics",
  merchantMatch: { merchant: "Apple Store", category: "electronics", similarity: 0.93 },
  ranked: [
    {
      cardName: "Citi Custom Cash",
      issuer: "Citi",
      appliedMultiplier: 5,
      matchedCategory: "electronics",
      amount: 3000,
      rewardPoints: 15000,
      cashValue: 150,
      foreignFeePenalty: 0,
      netValue: 150,
      warnings: ["Category cap: $500/month"],
    },
    {
      cardName: "Sapphire Preferred",
      issuer: "Chase",
      appliedMultiplier: 1,
      matchedCategory: null,
      amount: 3000,
      rewardPoints: 3000,
      cashValue: 37.5,
      foreignFeePenalty: 0,
      netValue: 37.5,
      warnings: [],
    },
  ],
};

describe("<AdvisorChat />", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows samples and submits a question, rendering the receipt + streamed text", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      buildSseResponse([
        { type: "meta", data: SAMPLE_META },
        { type: "text", data: "**Citi Custom Cash** " },
        { type: "text", data: "is the winner — 5× on electronics × $3,000 = 15,000 pts (~$150)." },
        { type: "done" },
      ]),
    );

    render(<AdvisorChat samples={["I'm buying a $3,000 MacBook — which card gives the best return?"]} />);

    await user.type(screen.getByTestId("advisor-input"), "MacBook $3000");
    await user.click(screen.getByTestId("advisor-submit"));

    // Intent chips
    expect(await screen.findByText(/merchant: Apple Store/i)).toBeInTheDocument();
    expect(screen.getByText(/category: electronics/i)).toBeInTheDocument();
    expect(screen.getByText(/amount: \$3,000.00/i)).toBeInTheDocument();
    expect(screen.getByText(/match: Apple Store \(93%\)/i)).toBeInTheDocument();

    // Top receipt
    const ranked = await screen.findByTestId("advisor-ranked");
    expect(ranked).toHaveTextContent(/Citi Custom Cash/);
    expect(ranked).toHaveTextContent(/#1.*top pick/i);
    expect(ranked).toHaveTextContent(/5× electronics on \$3,000.00/);
    expect(ranked).toHaveTextContent(/15,000 pts/);
    expect(ranked).toHaveTextContent(/\$150.00/);
    expect(ranked).toHaveTextContent(/Category cap: \$500\/month/);

    // Streamed answer appears
    await waitFor(() => {
      expect(screen.getByTestId("advisor-stream")).toHaveTextContent(/Citi Custom Cash.*is the winner/);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/advisor",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("clicking a sample prompt fires a query", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        buildSseResponse([
          { type: "meta", data: { ...SAMPLE_META, ranked: [] } },
          { type: "done" },
        ]),
      );
    render(<AdvisorChat samples={["Traveling to Japan next month"]} />);
    await user.click(screen.getByRole("button", { name: /traveling to japan/i }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
    expect(body.query).toMatch(/japan/i);
  });

  it("surfaces an error event", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      buildSseResponse([{ type: "error", data: "Ollama is down" }, { type: "done" }]),
    );
    render(<AdvisorChat samples={[]} />);
    await user.type(screen.getByTestId("advisor-input"), "anything");
    await user.click(screen.getByTestId("advisor-submit"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/ollama is down/i);
  });
});
