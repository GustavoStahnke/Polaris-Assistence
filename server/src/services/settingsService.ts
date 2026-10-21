import { profileSchema, type Profile } from '@polaris/shared';
import { parseInput } from '../lib/http';
import { getSetting, setSetting } from '../repositories/settingsRepository';

const DEFAULT_PROFILE: Profile = { name: '', callName: '', city: '' };

export function getProfile(): Profile {
  const stored = profileSchema.safeParse(getSetting('profile'));
  return stored.success ? stored.data : DEFAULT_PROFILE;
}

export function updateProfile(input: unknown): Profile {
  const profile = parseInput(profileSchema, input);
  setSetting('profile', profile);
  return profile;
}
