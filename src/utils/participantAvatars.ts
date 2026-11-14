export const participantAvatars = [
  { id: 'fox', character: '🦊', style: 'bg-orange-200 text-orange-900' },
  { id: 'panda', character: '🐼', style: 'bg-slate-200 text-slate-900' },
  { id: 'frog', character: '🐸', style: 'bg-lime-200 text-lime-900' },
  { id: 'monkey', character: '🐵', style: 'bg-amber-200 text-amber-900' },
  { id: 'cat', character: '🐱', style: 'bg-pink-200 text-pink-900' },
  { id: 'penguin', character: '🐧', style: 'bg-sky-200 text-sky-900' },
  { id: 'unicorn', character: '🦄', style: 'bg-fuchsia-200 text-fuchsia-900' },
  { id: 'tiger', character: '🐯', style: 'bg-yellow-200 text-yellow-900' },
  { id: 'rabbit', character: '🐰', style: 'bg-rose-200 text-rose-900' },
  { id: 'octopus', character: '🐙', style: 'bg-violet-200 text-violet-900' },
  { id: 'bear', character: '🐻', style: 'bg-stone-200 text-stone-900' },
  { id: 'lion', character: '🦁', style: 'bg-orange-100 text-orange-900' },
] as const

export type ParticipantAvatarId = (typeof participantAvatars)[number]['id']

export function isParticipantAvatarId(value: unknown): value is ParticipantAvatarId {
  return (
    typeof value === 'string' &&
    participantAvatars.some((avatar) => avatar.id === value)
  )
}

export function getRandomParticipantAvatarId(): ParticipantAvatarId {
  const index = Math.floor(Math.random() * participantAvatars.length)
  return participantAvatars[index].id
}

export function getStableParticipantAvatarId(uid: string): ParticipantAvatarId {
  let hash = 0
  for (let index = 0; index < uid.length; index += 1) {
    hash = (hash * 31 + uid.charCodeAt(index)) >>> 0
  }
  return participantAvatars[hash % participantAvatars.length].id
}

export function resolveParticipantAvatarId(
  uid: string,
  avatarId: unknown,
): ParticipantAvatarId {
  return isParticipantAvatarId(avatarId)
    ? avatarId
    : getStableParticipantAvatarId(uid)
}
