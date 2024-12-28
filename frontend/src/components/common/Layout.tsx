import { ReactNode } from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/auth';
import { useQueryClient } from '@tanstack/react-query';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  onSignOut?: () => void;
}

export default function Layout({ children, showHeader = true, onSignOut }: LayoutProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    auth.signOut();
    queryClient.clear();
    onSignOut?.();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'grey.50',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    }}>
      {showHeader && (
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'primary.main', width: '100%' }}>
          <Container maxWidth="lg">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                SecureToDo
              </Typography>
              <Button color="inherit" onClick={handleSignOut}>
                Sign Out
              </Button>
            </Toolbar>
          </Container>
        </AppBar>
      )}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4,
          height: showHeader ? 'calc(100vh - 64px)' : '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>
    </Box>
  );
} 