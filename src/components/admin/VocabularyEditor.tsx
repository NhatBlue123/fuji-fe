import React, { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
}

interface VocabularyEditorProps {
  value: string; // JSON string
  onChange: (jsonString: string) => void;
}

export function VocabularyEditor({ value, onChange }: VocabularyEditorProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newReading, setNewReading] = useState("");
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
  const updateParent = (newItems: VocabularyItem[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const addItem = () => {
    if (!newWord.trim() || !newMeaning.trim()) {
      alert(t("admin.vocab.alert.empty"));
      return;
    }
    const newItem: VocabularyItem = {
      word: newWord.trim(),
      reading: newReading.trim() || newWord.trim(),
      meaning: newMeaning.trim(),
    };
    updateParent([...items, newItem]);
    setNewWord("");
    setNewReading("");
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
      <Label>{t("admin.vocab.label.vocab")}</Label>

      {/* Input section */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder={t("admin.vocab.placeholder.word")}
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Input
            placeholder={t("admin.vocab.placeholder.reading")}
            value={newReading}
            onChange={(e) => setNewReading(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Input
            placeholder={t("admin.vocab.placeholder.meaning")}
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
        </div>
        <Button type="button" size="sm" onClick={addItem} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.vocab.btn.add")}
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-bold">
                    {item.word}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.reading}
                  </span>
                </div>
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
            {items.length} {t("admin.vocab.count")}
          </p>
        </div>
      )}
    </div>
  );
}
