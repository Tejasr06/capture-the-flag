import { participantAvatars, resolveParticipantAvatarId } from '../utils/participantAvatars'

interface ParticipantAvatarProps {
  uid: string
  avatarId?: string
  size?: 'sm' | 'md' | 'lg'
}

function ParticipantAvatar({ uid, avatarId, size = 'md' }: ParticipantAvatarProps) {
  const avatar = participantAvatars.find(
    (candidate) => candidate.id === resolveParticipantAvatarId(uid, avatarId),
  )!
  const sizeClass =
    size === 'sm' ? 'size-9 text-xl' : size === 'lg' ? 'size-14 text-3xl' : 'size-11 text-2xl'

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-xl ${sizeClass} ${avatar.style}`}
    >
      {avatar.character}
    </span>
  )
}

export default ParticipantAvatar
