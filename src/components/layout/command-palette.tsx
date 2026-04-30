'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, User, Users, Tag, ArrowRight } from 'lucide-react';
import { getCommandPaletteItems } from '@/application/actions/navigation.actions';
import styles from './command-palette.module.css';

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
      className={styles.dialog}
    >
      <div className={styles.container}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <Command.Input
            placeholder="Tìm kiếm tài khoản, nhóm hoặc tag..."
            className={styles.input}
          />
        </div>

        <Command.List className={styles.list}>
          <Command.Empty className={styles.empty}>Không tìm thấy kết quả.</Command.Empty>

          {items?.accounts && items.accounts.length > 0 && (
            <Command.Group heading="Tài khoản" className={styles.group}>
              {items.accounts.map((account) => (
                <Command.Item
                  key={account.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/inbox?account=${account.id}`))}
                  onPointerEnter={() => router.prefetch(`/dashboard/inbox?account=${account.id}`)}
                  className={styles.item}
                >
                  <User size={16} />
                  <span>{account.name}</span>
                  <span className={styles.badge}>{account.platform}</span>
                  <ArrowRight className={styles.arrow} size={14} />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {items?.groups && items.groups.length > 0 && (
            <Command.Group heading="Nhóm" className={styles.group}>
              {items.groups.map((group) => (
                <Command.Item
                  key={group.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/inbox?group=${group.id}`))}
                  onPointerEnter={() => router.prefetch(`/dashboard/inbox?group=${group.id}`)}
                  className={styles.item}
                >
                  <Users size={16} />
                  <span>{group.name}</span>
                  <ArrowRight className={styles.arrow} size={14} />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {items?.tags && items.tags.length > 0 && (
            <Command.Group heading="Tags" className={styles.group}>
              {items.tags.map((tag) => (
                <Command.Item
                  key={tag.name}
                  onSelect={() => runCommand(() => router.push(`/dashboard/inbox?tag=${tag.name}`))}
                  onPointerEnter={() => router.prefetch(`/dashboard/inbox?tag=${tag.name}`)}
                  className={styles.item}
                >
                  <Tag size={16} />
                  <span>{tag.name}</span>
                  <ArrowRight className={styles.arrow} size={14} />
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
