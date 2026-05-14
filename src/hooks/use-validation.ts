import { useMemo } from 'react';
import { ValidationEngine, ValidationContext, ValidationResult } from '@/lib/validation/validation-engine';
import { Platform } from '@/lib/validation/platform-constraints';
import { PlatformAccount } from '@/domain/types/platform-account';

interface UseValidationProps {
  accounts: PlatformAccount[];
  selectedAccountIds: string[];
  content: string;
  mediaFiles: { type: 'image' | 'video' }[];
}

export function useValidation({
  accounts,
  selectedAccountIds,
  content,
  mediaFiles
}: UseValidationProps): ValidationResult {
  return useMemo(() => {
    // Map selected IDs to Platforms
    const selectedPlatforms = accounts
      .filter(a => selectedAccountIds.includes(a.id))
      .map(a => a.platform as Platform);
      
    // Deduplicate platforms so we don't calculate limits redundantly
    const uniquePlatforms = Array.from(new Set(selectedPlatforms));

    const mediaCount = mediaFiles.length;
    const mediaTypes = mediaFiles.map(f => f.type);

    const context: ValidationContext = {
      platforms: uniquePlatforms,
      content,
      mediaCount,
      mediaTypes
    };

    return ValidationEngine.validate(context);
  }, [accounts, selectedAccountIds, content, mediaFiles]);
}
