"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (text: string, textSize: number) => void;
}

export default function AddLineModal({ isOpen, onClose, onAdd }: AddLineModalProps) {
  const [text, setText] = useState("");
  const [textSize, setTextSize] = useState(0);

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim(), textSize);
      setText("");
      setTextSize(0);
      onClose();
    }
  };

  const handleCancel = () => {
    setText("");
    setTextSize(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Line</DialogTitle>
          <DialogDescription>Configure text content and size for the new line</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && text.trim()) {
                  handleAdd();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              placeholder="Enter text"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="textSize">Text Size (mm)</Label>
            <Input
              id="textSize"
              type="number"
              value={textSize}
              onChange={(e) => setTextSize(parseFloat(e.target.value) || 0)}
              min="0.1"
              step="0.1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!text.trim()}>Add Line</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
