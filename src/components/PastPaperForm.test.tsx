import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CutoffData, Subject } from "../types";
import { PastPaperForm } from "./PastPaperForm";

const subjects: Subject[] = [
  {
    id: "chi-id",
    name: "Chinese Language",
    shortCode: "CHI",
    baseColor: "#ffffff",
    paperLabels: ["Paper 1", "Paper 2"],
  },
];

const cutoffData: CutoffData = {
  CHI: {
    2024: [
      { level: "5**", minimumPercentage: 90 },
      { level: "5*", minimumPercentage: 80 },
      { level: "5", minimumPercentage: 70 },
      { level: "4", minimumPercentage: 60 },
      { level: "3", minimumPercentage: 50 },
      { level: "2", minimumPercentage: 40 },
    ],
  },
};

function getSelectForField(labelText: string): HTMLSelectElement {
  const label = screen.getByText(labelText);
  const wrapper = label.parentElement;
  const select = wrapper?.querySelector("select");
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`Select not found for label: ${labelText}`);
  }
  return select;
}

function getInputForField(labelText: string, type: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  const wrapper = label.parentElement;
  const input = wrapper?.querySelector(`input[type="${type}"]`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Input not found for label: ${labelText}`);
  }
  return input;
}

describe("PastPaperForm", () => {
  it("shows validation error when required fields are missing", () => {
    render(
      <PastPaperForm
        subjects={subjects}
        cutoffData={cutoffData}
        onSubmit={vi.fn()}
        submitLabel="Save attempt"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save attempt" }));
    expect(screen.getByText("Please fill all required fields.")).toBeInTheDocument();
  });

  it("submits valid values for a DSE attempt", () => {
    const onSubmit = vi.fn();

    render(
      <PastPaperForm
        subjects={subjects}
        cutoffData={cutoffData}
        onSubmit={onSubmit}
        submitLabel="Save attempt"
      />
    );

    fireEvent.change(getSelectForField("Subject *"), { target: { value: "chi-id" } });
    fireEvent.change(getInputForField("Exam year *", "number"), { target: { value: "2024" } });
    fireEvent.change(getSelectForField("Paper label *"), { target: { value: "Paper 1" } });
    fireEvent.change(getInputForField("Date attempted *", "date"), { target: { value: "2026-04-01" } });
    fireEvent.change(getInputForField("Score *", "number"), { target: { value: "65" } });
    fireEvent.change(getInputForField("Total marks *", "number"), { target: { value: "100" } });

    fireEvent.click(screen.getByRole("button", { name: "Save attempt" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      subjectId: "chi-id",
      examYear: "2024",
      paperLabel: "Paper 1",
      date: "2026-04-01",
      score: "65",
      total: "100",
      isDse: true,
      manualGrade: "5",
      notes: "",
    });
  });
});
