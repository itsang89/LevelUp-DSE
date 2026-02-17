import { type FormEvent, useState } from "react";
import type { Subject } from "../types";
import { getSubjectGradientStyle } from "../utils/subjectStyles";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

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
    <section className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">Configuration</h3>
        <p className="text-3xl font-light text-foreground tracking-tight mb-2">Study Preferences</p>
        <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl">
          Customize your study environment by managing your subjects and preferences.
        </p>
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

            {/* Add New Subject Card */}
            <Card variant="hairline" padding="sm" className="border-dashed bg-muted/20 flex flex-col items-center justify-center min-h-[180px]">
              <h4 className="text-[10px] font-black text-muted-foreground mb-6 uppercase tracking-[0.2em] opacity-40">Add New Subject</h4>
              <form onSubmit={handleAddSubject} className="w-full space-y-4">
                <Input
                  placeholder="Subject Name"
                  className="h-9 px-3 text-xs font-bold"
                  value={newSubject.name}
                  onChange={(event) => setNewSubject((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  placeholder="Short Code (e.g. ENG)"
                  className="h-9 px-3 text-xs font-black uppercase tracking-widest"
                  value={newSubject.shortCode}
                  onChange={(event) =>
                    setNewSubject((prev) => ({ ...prev, shortCode: event.target.value.toUpperCase() }))
                  }
                />
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-9 w-12 rounded-xl border border-border-hairline bg-surface cursor-pointer hairline-border"
                    value={newSubject.baseColor}
                    onChange={(event) =>
                      setNewSubject((prev) => ({ ...prev, baseColor: event.target.value }))
                    }
                  />
                  <Button type="submit" size="sm" className="flex-1 rounded-full text-[9px] font-black uppercase tracking-widest">Add</Button>
                </div>
              </form>
              {error && <p className="mt-4 text-[9px] font-black text-dot-red uppercase tracking-widest text-center">{error}</p>}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
