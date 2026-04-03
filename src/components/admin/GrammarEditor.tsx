import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

interface GrammarItem {
  pattern: string;
  meaning: string;
}

interface GrammarEditorProps {
  value: string; // JSON string
  onChange: (jsonString: string) => void;
}

export function GrammarEditor({ value, onChange }: GrammarEditorProps) {
  const [items, setItems] = useState<GrammarItem[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [newMeaning, setNewMeaning] = useState("");

  // Parse JSON on mount and when value changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, [value]);

  // Update parent whenever items change
  const updateParent = (newItems: GrammarItem[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const addItem = () => {
    if (!newPattern.trim()) {
      alert("Vui lòng điền mẫu ngữ pháp");
      return;
    }
    const newItem: GrammarItem = {
      pattern: newPattern.trim(),
      meaning: newMeaning.trim() || newPattern.trim(),
    };
    updateParent([...items, newItem]);
    setNewPattern("");
    setNewMeaning("");
  };

  const removeItem = (index: number) => {
    updateParent(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Ngữ pháp</Label>

      {/* Input section */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Mẫu *"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Input
            placeholder="Nghĩa (tùy)"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
        </div>
        <Button type="button" size="sm" onClick={addItem} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Thêm ngữ pháp
        </Button>
      </div>

      {/* List section */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-2 p-2 rounded border"
            >
              <div className="flex-1 space-y-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {item.pattern}
                </Badge>
                <p className="text-sm">{item.meaning}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeItem(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {items.length} mục ngữ pháp
          </p>
        </div>
      )}
    </div>
  );
}
