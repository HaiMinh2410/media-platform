'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, User, Users, Tag, ArrowRight } from 'lucide-react';
import { getCommandPaletteItems } from '@/application/actions/navigation.actions';
import { cn } from '@/lib/utils';

interface PaletteItem {
  id?: string;
  name: string;
  platform?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{
    accounts: PaletteItem[];
    groups: PaletteItem[];
    tags: { name: string }[];
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open && !items) {
      getCommandPaletteItems().then((res) => {
        if (res.data) setItems(res.data);
      });
    }
  }, [open, items]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] bg-[#171717]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex flex-col">
        <div className="flex items-center p-4 border-b border-white/5">
          <Search className="text-foreground-tertiary mr-3" size={18} />
          <Command.Input
            placeholder="Tìm kiếm tài khoản, nhóm hoặc tag..."
            className="flex-1 bg-transparent border-none text-foreground text-base outline-none placeholder:text-foreground-tertiary"
          />
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
          <Command.Empty className="p-6 text-center text-foreground-tertiary text-sm">Không tìm thấy kết quả.</Command.Empty>

          {items?.accounts && items.accounts.length > 0 && (
            <Command.Group 
              heading="Tài khoản" 
              className="mb-3 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-foreground-tertiary"
            >
              {items.accounts.map((account) => (
                <Command.Item
                  key={account.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/inbox?account=${account.id}`))}
                  onPointerEnter={() => router.prefetch(`/dashboard/inbox?account=${account.id}`)}
                  className="flex items-center p-[10px_12px] rounded-lg cursor-pointer gap-3 text-[#d4d4d4] text-sm transition-all duration-150 select-none aria-selected:bg-white/10 aria-selected:text-white group"
                >
                  <User size={16} />
                  <span>{account.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-[4px] text-foreground-tertiary uppercase">{account.platform}</span>
                  <ArrowRight className="ml-auto text-foreground-tertiary opacity-0 -translate-x-1 transition-all duration-150 group-aria-selected:opacity-100 group-aria-selected:translate-x-0" size={14} />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {items?.groups && items.groups.length > 0 && (
            <Command.Group 
              heading="Nhóm" 
              className="mb-3 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-foreground-tertiary"
            >
              {items.groups.map((group) => (
                <Command.Item
                  key={group.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/inbox?group=${group.id}`))}
                  onPointerEnter={() => router.prefetch(`/dashboard/inbox?group=${group.id}`)}
                  className="flex items-center p-[10px_12px] rounded-lg cursor-pointer gap-3 text-[#d4d4d4] text-sm transition-all duration-150 select-none aria-selected:bg-white/10 aria-selected:text-white group"
                >
                  <Users size={16} />
                  <span>{group.name}</span>
                  <ArrowRight className="ml-auto text-foreground-tertiary opacity-0 -translate-x-1 transition-all duration-150 group-aria-selected:opacity-100 group-aria-selected:translate-x-0" size={14} />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {items?.tags && items.tags.length > 0 && (
            <Command.Group 
              heading="Tags" 
              className="mb-3 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-foreground-tertiary"
            >
              {items.tags.map((tag) => (
                <Command.Item
                  key={tag.name}
                  onSelect={() => runCommand(() => router.push(`/dashboard/inbox?tag=${tag.name}`))}
                  onPointerEnter={() => router.prefetch(`/dashboard/inbox?tag=${tag.name}`)}
                  className="flex items-center p-[10px_12px] rounded-lg cursor-pointer gap-3 text-[#d4d4d4] text-sm transition-all duration-150 select-none aria-selected:bg-white/10 aria-selected:text-white group"
                >
                  <Tag size={16} />
                  <span>{tag.name}</span>
                  <ArrowRight className="ml-auto text-foreground-tertiary opacity-0 -translate-x-1 transition-all duration-150 group-aria-selected:opacity-100 group-aria-selected:translate-x-0" size={14} />
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
