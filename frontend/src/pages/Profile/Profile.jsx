import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { useToast } from '../../components/Toast/ToastContext.jsx'
import Avatar from '../../components/Avatar.jsx'
import './Profile.css'

const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024
const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function formatDate(date) {
  if (!date) return 'Not provided'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`))
}

export default function Profile() {
  const { user, changePassword, updateProfileImage } = useAuth()
  const { addAuditLog } = useTasks()
  const { toast } = useToast()
  const imageInput = useRef(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [firstName, ...lastNameParts] = (user?.name || '').split(' ')
  const lastName = lastNameParts.join(' ')
  const dashboardPath = user?.role === 'administrator'
    ? '/administrator'
    : user?.role === 'manager' ? '/manager' : '/staff'

  function handleProfileImageChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('Choose a JPG, PNG, WebP or GIF image.')
      return
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setPhotoError('Your profile photo must be smaller than 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = updateProfileImage(reader.result)
      if (result.error) {
        setPhotoError(result.error)
        return
      }
      setPhotoError('')
      addAuditLog({
        actor: user.name,
        action: 'Updated profile photo',
        item: 'Profile photo',
        assigneeId: user.id
      })
      toast('Profile photo updated.')
    }
    reader.onerror = () => setPhotoError('The selected photo could not be read. Please try another image.')
    reader.readAsDataURL(file)
  }

  function handleRemoveProfileImage() {
    const result = updateProfileImage(null)
    if (result.error) {
      setPhotoError(result.error)
      return
    }
    setPhotoError('')
    addAuditLog({
      actor: user.name,
      action: 'Removed profile photo',
      item: 'Profile photo',
      assigneeId: user.id
    })
    toast('Profile photo removed.')
  }

  function handleChangePassword(event) {
    event.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Your new passwords do not match.')
      return
    }

    const result = changePassword(currentPassword, newPassword)
    if (result.error) {
      setPasswordError(result.error)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast('Password updated successfully.')
  }

  return (
    <div className="profile-page">
      <div className="profile-page-heading">
        <Link className="btn btn-ghost" to={dashboardPath}>Back to dashboard</Link>
      </div>

      <section className="card profile-photo-card" aria-labelledby="profile-photo-title">
        <Avatar
          name={user.name}
          color={user.color}
          image={user.profileImage}
          size={76}
        />
        <div className="profile-photo-info">
          <h2 id="profile-photo-title">Profile photo</h2>
          <p>Upload or update the photo shown with your account.</p>
          <div className="profile-photo-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => imageInput.current?.click()}
            >
              {user.profileImage ? 'Change photo' : 'Upload photo'}
            </button>
            {user.profileImage && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRemoveProfileImage}
              >
                Remove photo
              </button>
            )}
            <input
              ref={imageInput}
              className="profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleProfileImageChange}
              aria-label="Choose a profile photo"
            />
          </div>
          {photoError && <p className="profile-password-error" role="alert">{photoError}</p>}
        </div>
      </section>

      <section className="card profile-details" aria-labelledby="profile-details-title">
        <div className="profile-section-heading">
          <div>
            <h2 id="profile-details-title">Personal information</h2>
            <p>These details are managed by your organisation and cannot be edited here.</p>
          </div>
        </div>
        <dl className="profile-details-grid">
          <div className="profile-detail">
            <dt>First name</dt>
            <dd>{firstName || 'Not provided'}</dd>
          </div>
          <div className="profile-detail">
            <dt>Last name</dt>
            <dd>{lastName || 'Not provided'}</dd>
          </div>
          <div className="profile-detail">
            <dt>Date of birth</dt>
            <dd>{formatDate(user?.dateOfBirth)}</dd>
          </div>
          <div className="profile-detail">
            <dt>Email address</dt>
            <dd>{user?.email || 'Not provided'}</dd>
          </div>
          <div className="profile-detail">
            <dt>Job title</dt>
            <dd>{user?.title || 'Not provided'}</dd>
          </div>
          <div className="profile-detail">
            <dt>Account type</dt>
            <dd>{user?.role ? `${user.role[0].toUpperCase()}${user.role.slice(1)}` : 'Not provided'}</dd>
          </div>
        </dl>
      </section>

      <section className="card profile-password" aria-labelledby="profile-password-title">
        <div className="profile-section-heading">
          <div>
            <h2 id="profile-password-title">Change password</h2>
            <p>Choose a new password with at least 8 characters.</p>
          </div>
        </div>
        <form className="profile-password-form" onSubmit={handleChangePassword}>
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              className="input"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              className="input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {passwordError && <p className="profile-password-error" role="alert">{passwordError}</p>}
          <div className="profile-password-actions">
            <button type="submit" className="btn btn-primary">Update password</button>
          </div>
        </form>
      </section>
    </div>
  )
}
