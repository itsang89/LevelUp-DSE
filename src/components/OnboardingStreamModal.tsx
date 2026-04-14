'use client'

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import type { Subject } from "../types";
import { PRESET_SUBJECTS } from "../constants";

interface OnboardingStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSubjectCodes: string[];
  onAddSubjects: (subjects: Subject[]) => Promise<void>;
}

const CORE_CODES = ["CHI", "ENG", "MATH", "C&SD"];

interface ElectiveGroup {
  label: string;
  codes: string[];
}

const ELECTIVE_GROUPS: ElectiveGroup[] = [
  { label: "Sciences", codes: ["BIO", "CHEM", "PHY", "M1", "M2"] },
  { label: "Humanities", codes: ["HIST", "GEOG", "CHI-HIST", "CHI-LIT", "ENG-LIT", "ERS"] },
  { label: "Business & Technology", codes: ["ECON", "BAFS", "ICT", "DAT", "TL", "THS"] },
  { label: "Arts & Health", codes: ["VA", "MUSIC", "PE", "HMSC"] },
];

function createSubjectId(shortCode: string): string {
  return shortCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function OnboardingStreamModal({
  isOpen,
  onClose,
  existingSubjectCodes,
  onAddSubjects,
}: OnboardingStreamModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const presetsByCode = new Map(PRESET_SUBJECTS.map((p) => [p.shortCode, p]));

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  async function handleAdd() {
    const toAdd: Subject[] = [];
    for (const code of selected) {
      if (existingSubjectCodes.includes(code)) continue;
      const preset = presetsByCode.get(code);
      if (!preset) continue;
      const id = createSubjectId(code);
      toAdd.push({ id, ...preset });
    }
    if (toAdd.length === 0) {
      onClose();
      return;
    }
    try {
      setIsSaving(true);
      await onAddSubjects(toAdd);
      setSelected(new Set());
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkip() {
    setSelected(new Set());
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title="Add Your Electives"
      description="Pick the subjects you're taking. You can always add or remove them later in Settings."
    >
      <div className="space-y-6">
        {ELECTIVE_GROUPS.map((group) => {
          const groupSubjects = group.codes
            .map((code) => presetsByCode.get(code))
            .filter(Boolean) as (typeof PRESET_SUBJECTS)[number][];

          if (groupSubjects.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 mb-3">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {groupSubjects.map((preset) => {
                  const code = preset.shortCode;
                  const isExisting = existingSubjectCodes.includes(code) && !CORE_CODES.includes(code);
                  const isChecked = selected.has(code) || isExisting;

                  return (
                    <label
                      key={code}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                        isExisting
                          ? "border-border-hairline opacity-40 cursor-not-allowed"
                          : isChecked
                          ? "border-primary/30 bg-primary/5"
                          : "border-border-hairline hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isExisting}
                        onChange={() => !isExisting && toggle(code)}
                        className="accent-primary shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-primary truncate">{preset.name}</div>
                        <div className="text-[10px] text-muted-foreground opacity-60">{code}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex flex-col gap-3 pt-2">
          <Button
            className="w-full rounded-full text-[10px] font-black uppercase tracking-widest"
            onClick={handleAdd}
            disabled={isSaving || selected.size === 0}
          >
            {isSaving ? "Adding..." : `Add ${selected.size > 0 ? selected.size : ""} Subject${selected.size !== 1 ? "s" : ""}`}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSaving}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 hover:opacity-80 transition-opacity"
          >
            Skip — I'll add subjects manually
          </button>
        </div>
      </div>
    </Modal>
  );
}
