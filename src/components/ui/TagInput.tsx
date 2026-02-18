import { useState, type KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ tags, onChange, placeholder, className = "" }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = inputValue.trim();
      if (value && !tags.includes(value)) {
        onChange([...tags, value]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border border-border-hairline bg-background/50 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all ${className}`}>
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary animate-in fade-in zoom-in-95 duration-200"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="hover:text-dot-red transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none px-2 py-1 text-xs font-bold placeholder:text-muted-foreground/40 placeholder:font-normal"
      />
    </div>
  );
}
