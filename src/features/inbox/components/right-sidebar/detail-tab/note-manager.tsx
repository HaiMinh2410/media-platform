import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NoteManagerProps {
  conversationId: string;
}

export function NoteManager({ conversationId }: NoteManagerProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const fetchNotes = async () => {
    if (!conversationId) return;
    setIsLoadingNotes(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`);
      const json = await res.json();
      if (json.data) {
        setNotes(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [conversationId]);

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteContent('');
        setIsAddingNote(false);
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingNoteContent }),
      });
      if (res.ok) {
        setEditingNoteId(null);
        setEditingNoteContent('');
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const formatNoteDate = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) {
      const distance = formatDistanceToNow(d, { addSuffix: true, locale: vi });
      return distance.replace('dưới 1 phút trước', 'vài giây trước');
    }
    return format(d, 'HH:mm dd/MM/yyyy');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider">Ghi chú</h3>
        <span className="text-xs text-accent-primary cursor-pointer hover:underline" onClick={() => setIsAddingNote(!isAddingNote)}>
          {isAddingNote ? 'Hủy' : 'Thêm ghi chú'}
        </span>
      </div>
      
      {isAddingNote && (
        <div className="flex flex-col gap-3 mt-2">
          <textarea 
            className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-foreground text-sm min-height-[80px] resize-vertical outline-none focus:border-accent-primary"
            placeholder="Nhập nội dung ghi chú..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <button 
            className="bg-accent-primary text-white border-none p-2 rounded-lg text-sm font-semibold cursor-pointer w-fit self-end transition-all hover:opacity-90"
            onClick={handleSaveNote}
          >
            Lưu ghi chú
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-3">
        {isLoadingNotes ? (
          <div className="flex items-center justify-center gap-2 py-5 text-foreground-tertiary text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>Đang tải ghi chú...</span>
          </div>
        ) : notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
              <div className="flex justify-between items-center text-xs text-foreground-tertiary mb-2">
                <span>{formatNoteDate(note.createdAt)}</span>
                <div className="flex gap-3">
                  {editingNoteId === note.id ? (
                    <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => setEditingNoteId(null)}>Hủy</span>
                  ) : (
                    <>
                      <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => {
                        setEditingNoteId(note.id);
                        setEditingNoteContent(note.content);
                      }}>Chỉnh sửa</span>
                      <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => handleDeleteNote(note.id)}>Xóa</span>
                    </>
                  )}
                </div>
              </div>
              
              {editingNoteId === note.id ? (
                <div className="flex flex-col gap-3">
                  <textarea 
                    className="w-full bg-black/20 border border-white/10 p-3 rounded-lg text-foreground text-sm min-height-[80px] resize-vertical outline-none focus:border-accent-primary"
                    value={editingNoteContent}
                    onChange={(e) => setEditingNoteContent(e.target.value)}
                    autoFocus
                  />
                  <button 
                    className="bg-accent-primary text-white border-none p-2 rounded-lg text-sm font-semibold cursor-pointer w-fit self-end transition-all hover:opacity-90"
                    onClick={() => handleUpdateNote(note.id)}
                  >
                    Cập nhật
                  </button>
                </div>
              ) : (
                <p className="text-sm text-foreground leading-normal m-0">{note.content}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-foreground-tertiary italic text-center py-4 m-0">Chưa có ghi chú nào.</p>
        )}
      </div>
    </div>
  );
}
