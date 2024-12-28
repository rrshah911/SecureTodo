import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Link,
} from '@mui/material'
import { auth } from '../../services/auth'

export default function ConfirmSignUp() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email is required. Please go back to sign up.')
      return
    }

    try {
      setIsLoading(true)
      await auth.confirmSignUp(email, code)
      navigate('/login', { state: { message: 'Email verified successfully. Please sign in.' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      // Note: You'll need to implement resendCode in auth service
      await auth.resendCode(email)
      setError('Verification code has been resent to your email.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }

  if (!email) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            No email provided
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/signup')}
            sx={{ mt: 2 }}
          >
            Go to Sign Up
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Verify Your Email
        </Typography>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          We've sent a verification code to:
          <br />
          <strong>{email}</strong>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="code"
            label="Verification Code"
            name="code"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={handleResendCode}
              sx={{ textDecoration: 'none' }}
            >
              Resend verification code
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  )
} 