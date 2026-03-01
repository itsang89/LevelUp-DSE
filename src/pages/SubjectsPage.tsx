import { type FormEvent, useState } from "react";
import type { Subject } from "../types";
import { getSubjectGradientStyle } from "../utils/subjectStyles";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { TagInput } from "../components/ui/TagInput";
import { createSubject, deleteSubject, updateSubject } from "../lib/api/subjectsApi";

interface SubjectsPageProps {
  userId: string;
  subjects: Subject[];
  setSubjects: (value: Subject[] | ((prev: Subject[]) => Subject[])) => void;
}

interface SubjectDraft {
  name: string;
  shortCode: string;
  baseColor: string;
  paperLabels: string[];
}

function createSubjectId(shortCode: string): string {
  return shortCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const PRESET_COLORS = [
  "#ef4444", // Rose/Red
  "#f59e0b", // Amber/Orange
  "#10b981", // Emerald/Green
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#64748b", // Slate/Gray
  "#0ea5e9", // Cyan
];

export function SubjectsPage({ userId, subjects, setSubjects }: SubjectsPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState<SubjectDraft>({
    name: "",
    shortCode: "",
    baseColor: "#3b82f6",
    paperLabels: ["Paper 1", "Paper 2"],
  });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<SubjectDraft>({
    name: "",
    shortCode: "",
    baseColor: "#3b82f6",
    paperLabels: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function validateDraft(draft: SubjectDraft): string | null {
    if (!draft.name.trim() || !draft.shortCode.trim()) {
      return "Name and short code are required.";
    }
    if (draft.shortCode.trim().length > 5) {
      return "Short code should be 3-5 characters.";
    }
    return null;
  }

  async function handleAddSubject(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (isSaving) {
      return;
    }
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
      paperLabels: newSubject.paperLabels,
    };

    try {
      setIsSaving(true);
      await createSubject(userId, newItem);
      setSubjects((prev) => [...prev, newItem]);
      setNewSubject({ name: "", shortCode: "", baseColor: "#3b82f6", paperLabels: ["Paper 1", "Paper 2"] });
      setIsAddModalOpen(false);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add subject.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(subject: Subject): void {
    setEditingSubjectId(subject.id);
    setEditingDraft({
      name: subject.name,
      shortCode: subject.shortCode,
      baseColor: subject.baseColor,
      paperLabels: subject.paperLabels || [],
    });
    setError(null);
  }

  async function saveEdit(): Promise<void> {
    if (!editingSubjectId) {
      return;
    }
    if (isSaving) {
      return;
    }
    const validationError = validateDraft(editingDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    const nextSubject: Subject = {
      id: editingSubjectId,
      name: editingDraft.name.trim(),
      shortCode: editingDraft.shortCode.trim().toUpperCase(),
      baseColor: editingDraft.baseColor,
      paperLabels: editingDraft.paperLabels,
    };

    try {
      setIsSaving(true);
      await updateSubject(userId, editingSubjectId, nextSubject);
      setSubjects((prev) =>
        prev.map((subject) => (subject.id === editingSubjectId ? nextSubject : subject))
      );
      setEditingSubjectId(null);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update subject.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSubject(subjectId: string): Promise<void> {
    const confirmed = window.confirm(
      "Delete this subject? Existing planner and log entries will show as Unknown Subject."
    );
    if (!confirmed || isSaving) {
      return;
    }
    try {
      setIsSaving(true);
      await deleteSubject(userId, subjectId);
      setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete subject.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-16 pt-6 lg:pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        <div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Subjects</h3>
          <p className="text-3xl font-light text-primary tracking-tight">Manage Curriculum</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full px-8 text-[11px] font-black uppercase tracking-widest shadow-soft h-11"
        >
          Add Subject
        </Button>
      </div>

      <div className="grid gap-8">
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40 ml-1">Subject Management</h4>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                variant="hairline" 
                padding="sm"
                style={getSubjectGradientStyle(subject)}
                className="group relative transition-all duration-300 hover:bg-white hover:shadow-soft"
              >
                {editingSubjectId === subject.id ? (
                  <div className="space-y-4">
                    <Input
                      className="h-9 px-3 text-xs font-bold"
                      value={editingDraft.name}
                      onChange={(event) =>
                        setEditingDraft((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                    <Input
                      className="h-9 px-3 text-xs font-black uppercase tracking-widest"
                      value={editingDraft.shortCode}
                      onChange={(event) =>
                        setEditingDraft((prev) => ({ ...prev, shortCode: event.target.value }))
                      }
                    />
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Paper Labels</label>
                      <TagInput
                        tags={editingDraft.paperLabels}
                        onChange={(tags) =>
                          setEditingDraft((prev) => ({ ...prev, paperLabels: tags }))
                        }
                        placeholder="e.g. Paper 1, Enter"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditingDraft((prev) => ({ ...prev, baseColor: color }))}
                            className={`h-6 w-6 rounded-full border-2 transition-all ${
                              editingDraft.baseColor === color ? "border-primary scale-110 shadow-sm" : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 rounded-full text-[9px]" onClick={saveEdit}>Save</Button>
                        <Button size="sm" variant="outline" className="rounded-full text-[9px]" onClick={() => setEditingSubjectId(null)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full min-h-[140px]">
                    <div className="flex items-start justify-between mb-6">
                      <div 
                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-border-hairline"
                        style={{ color: subject.baseColor, backgroundColor: `${subject.baseColor}30` }}
                      >
                        {subject.shortCode}
                      </div>
                      <div 
                        className="h-3 w-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: subject.baseColor }}
                      />
                    </div>
                    <h4 className="text-lg font-medium text-foreground tracking-tight leading-none mb-1">{subject.name}</h4>
                    
                    {subject.paperLabels && subject.paperLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {subject.paperLabels.map((label) => (
                          <div 
                            key={label}
                            className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-white/50 border border-border-hairline text-muted-foreground shadow-sm"
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-auto pt-6 flex gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(subject)}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-dot-red transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Subject"
        description="Add a new subject to track in your planner."
      >
        <form onSubmit={handleAddSubject} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">Subject Name</label>
              <Input
                placeholder="e.g. Mathematics"
                className="h-11 px-4 text-sm font-bold"
                value={newSubject.name}
                onChange={(event) => setNewSubject((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">Short Code</label>
              <Input
                placeholder="e.g. MATH"
                className="h-11 px-4 text-sm font-black uppercase tracking-widest"
                value={newSubject.shortCode}
                onChange={(event) =>
                  setNewSubject((prev) => ({ ...prev, shortCode: event.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">Paper Labels (Type & Enter)</label>
              <TagInput
                placeholder="e.g. Paper 1, Paper 2"
                tags={newSubject.paperLabels}
                onChange={(tags) =>
                  setNewSubject((prev) => ({ ...prev, paperLabels: tags }))
                }
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">Color Theme</label>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewSubject((prev) => ({ ...prev, baseColor: color }))}
                    className={`h-10 w-10 rounded-2xl border-2 transition-all duration-200 ${
                      newSubject.baseColor === color 
                        ? "border-primary scale-110 shadow-soft" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-dot-red/10 border border-dot-red/20 text-[10px] font-black uppercase tracking-widest text-dot-red text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-12"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-[2] rounded-full text-[10px] font-black uppercase tracking-widest h-12"
            >
              Add Subject
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
