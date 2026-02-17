import { type FormEvent, useState } from "react";
import type { Subject } from "../types";
import { getSubjectGradientStyle } from "../utils/subjectStyles";

interface SettingsPageProps {
  subjects: Subject[];
  setSubjects: (value: Subject[] | ((prev: Subject[]) => Subject[])) => void;
}

interface SubjectDraft {
  name: string;
  shortCode: string;
  baseColor: string;
}

function createSubjectId(shortCode: string): string {
  return shortCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function SettingsPage({ subjects, setSubjects }: SettingsPageProps) {
  const [newSubject, setNewSubject] = useState<SubjectDraft>({
    name: "",
    shortCode: "",
    baseColor: "#3b82f6",
  });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<SubjectDraft>({
    name: "",
    shortCode: "",
    baseColor: "#3b82f6",
  });
  const [error, setError] = useState<string | null>(null);

  function validateDraft(draft: SubjectDraft): string | null {
    if (!draft.name.trim() || !draft.shortCode.trim()) {
      return "Name and short code are required.";
    }
    if (draft.shortCode.trim().length > 5) {
      return "Short code should be 3-5 characters.";
    }
    return null;
  }

  function handleAddSubject(event: FormEvent): void {
    event.preventDefault();
    const validationError = validateDraft(newSubject);
    if (validationError) {
      setError(validationError);
      return;
    }

    const shortCode = newSubject.shortCode.trim().toUpperCase();
    const newItem: Subject = {
      id: createSubjectId(shortCode) || `subject-${Date.now()}`,
      name: newSubject.name.trim(),
      shortCode,
      baseColor: newSubject.baseColor,
    };

    setSubjects((prev) => [...prev, newItem]);
    setNewSubject({ name: "", shortCode: "", baseColor: "#3b82f6" });
    setError(null);
  }

  function startEdit(subject: Subject): void {
    setEditingSubjectId(subject.id);
    setEditingDraft({
      name: subject.name,
      shortCode: subject.shortCode,
      baseColor: subject.baseColor,
    });
    setError(null);
  }

  function saveEdit(): void {
    if (!editingSubjectId) {
      return;
    }
    const validationError = validateDraft(editingDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === editingSubjectId
          ? {
              ...subject,
              name: editingDraft.name.trim(),
              shortCode: editingDraft.shortCode.trim().toUpperCase(),
              baseColor: editingDraft.baseColor,
            }
          : subject
      )
    );

    setEditingSubjectId(null);
    setError(null);
  }

  function handleDeleteSubject(subjectId: string): void {
    const confirmed = window.confirm(
      "Delete this subject? Existing planner and log entries will show as Unknown Subject."
    );
    if (!confirmed) {
      return;
    }
    setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId));
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Settings - Subjects</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage the subjects shared by planner and past paper tracking.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Subject list</h3>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              style={getSubjectGradientStyle(subject)}
              className="rounded-xl border border-slate-200 p-3"
            >
              {editingSubjectId === subject.id ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <input
                    type="text"
                    className="rounded border border-slate-300 bg-white px-2 py-2 text-sm"
                    value={editingDraft.name}
                    onChange={(event) =>
                      setEditingDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="rounded border border-slate-300 bg-white px-2 py-2 text-sm"
                    value={editingDraft.shortCode}
                    onChange={(event) =>
                      setEditingDraft((prev) => ({ ...prev, shortCode: event.target.value }))
                    }
                  />
                  <input
                    type="color"
                    className="h-10 w-full rounded border border-slate-300 bg-white px-1 py-1"
                    value={editingDraft.baseColor}
                    onChange={(event) =>
                      setEditingDraft((prev) => ({ ...prev, baseColor: event.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-xs"
                      onClick={() => setEditingSubjectId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
                    <p className="text-xs text-slate-600">{subject.shortCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full border border-slate-300"
                      style={{ backgroundColor: subject.baseColor }}
                    />
                    <button
                      type="button"
                      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      onClick={() => startEdit(subject)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-700"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Add new subject</h3>
        <form onSubmit={handleAddSubject} className="grid gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Name"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={newSubject.name}
            onChange={(event) => setNewSubject((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Short code"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase"
            value={newSubject.shortCode}
            onChange={(event) =>
              setNewSubject((prev) => ({ ...prev, shortCode: event.target.value.toUpperCase() }))
            }
          />
          <input
            type="color"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-1 py-1"
            value={newSubject.baseColor}
            onChange={(event) =>
              setNewSubject((prev) => ({ ...prev, baseColor: event.target.value }))
            }
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Add Subject
          </button>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
      </div>
    </section>
  );
}
