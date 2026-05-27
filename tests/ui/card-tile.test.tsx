import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardTile } from "@/components/card-tile";

describe("<CardTile />", () => {
  it("renders the marketing card with categories and fees", () => {
    render(
      <CardTile
        id="abc"
        name="Sapphire Preferred"
        issuer="Chase"
        network="Visa"
        annualFee={95}
        foreignFee={0}
        topCategories={[
          { category: "travel", multiplier: 3 },
          { category: "dining", multiplier: 2 },
        ]}
      />,
    );
    expect(screen.getByText("Sapphire Preferred")).toBeInTheDocument();
    expect(screen.getByText("Chase")).toBeInTheDocument();
    expect(screen.getByText(/3× travel/i)).toBeInTheDocument();
    expect(screen.getByText(/2× dining/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual \$95/)).toBeInTheDocument();
    expect(screen.getByText(/Foreign 0%/)).toBeInTheDocument();
  });

  it("shows an 'add rewards' chip when there are no categories", () => {
    render(
      <CardTile id="x" name="Bare Card" issuer={null} network={null} annualFee={0} foreignFee={3} topCategories={[]} />,
    );
    expect(screen.getByText(/no rewards set/i)).toBeInTheDocument();
  });

  it("links to the card detail page", () => {
    render(
      <CardTile
        id="card-123"
        name="X"
        issuer={null}
        network={null}
        annualFee={0}
        foreignFee={0}
        topCategories={[{ category: "flat", multiplier: 1.5 }]}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cards/card-123");
  });
});
