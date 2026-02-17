import { type FormEvent, useState } from "react";
import type { Subject } from "../types";
import { getSubjectGradientStyle } from "../utils/subjectStyles";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    setIsAddModalOpen(false);
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
    <section className="space-y-16 pt-6 lg:pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        <div>
          <p className="text-3xl font-light text-primary tracking-tight">Study Preferences</p>
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
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 rounded-xl border border-border-hairline bg-surface cursor-pointer hairline-border"
                        value={editingDraft.baseColor}
                        onChange={(event) =>
                          setEditingDraft((prev) => ({ ...prev, baseColor: event.target.value }))
                        }
                      />
                      <Button size="sm" className="flex-1 rounded-full text-[9px]" onClick={saveEdit}>Save</Button>
                      <Button size="sm" variant="outline" className="rounded-full text-[9px]" onClick={() => setEditingSubjectId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full min-h-[140px]">
                    <div className="flex items-start justify-between mb-6">
                      <div 
                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-border-hairline"
                        style={{ color: subject.baseColor, backgroundColor: `${subject.baseColor}10` }}
                      >
                        {subject.shortCode}
                      </div>
                      <div 
                        className="h-3 w-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: subject.baseColor }}
                      />
                    </div>
                    <h4 className="text-lg font-medium text-foreground tracking-tight leading-none mb-1">{subject.name}</h4>
                    
                    <div className="mt-auto pt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">Color Theme</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  className="h-12 w-20 rounded-2xl border border-border-hairline bg-surface cursor-pointer hairline-border"
                  value={newSubject.baseColor}
                  onChange={(event) =>
                    setNewSubject((prev) => ({ ...prev, baseColor: event.target.value }))
                  }
                />
                <div className="flex-1 p-4 rounded-2xl border border-border-hairline bg-muted/5 flex items-center gap-3">
                   <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: newSubject.baseColor }}
                  />
                  <span className="text-xs font-bold text-muted-foreground tracking-tight">Theme Color</span>
                </div>
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
