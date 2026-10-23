// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageContent } from "@/components/message-content";

describe("MessageContent", () => {
  it("renders malformed headings without exposing Markdown markers", () => {
    render(<MessageContent>{"##Formula\n\nWorked example"}</MessageContent>);

    expect(screen.getByRole("heading", { name: "Formula" })).toBeInTheDocument();
    expect(screen.queryByText("##Formula")).not.toBeInTheDocument();
  });

  it("renders GitHub-style tables as semantic tables", () => {
    const { container } = render(
      <MessageContent>
        {"| Component | Weight |\n| --- | ---: |\n| NET | 75% |\n| FSc | 15% |"}
      </MessageContent>
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Component" })).toBeInTheDocument();
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("typesets display formulas instead of showing raw LaTeX", () => {
    const { container } = render(
      <MessageContent>{"$$\\text{Aggregate} = \\frac{75}{100}$$"}</MessageContent>
    );

    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.textContent).not.toContain("$$");
  });
});
