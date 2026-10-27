import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'
import AppBar from '@mui/material/AppBar'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { authPaths } from '@/features/auth'
import { useSignOut } from '@/features/auth/hooks/use-auth'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { PageLoader } from '@/shared/components/PageLoader'

const DRAWER_WIDTH = 240

const NAV_ITEMS = [
  {
    labelKey: 'navigation.dashboard',
    path: '/app',
    icon: <HomeOutlinedIcon />,
  },
  {
    labelKey: 'navigation.applications',
    path: '/app/applications',
    icon: <WorkOutlineRoundedIcon />,
  },
  {
    labelKey: 'navigation.calendar',
    path: '/app/calendar',
    icon: <CalendarTodayOutlinedIcon />,
  },
  {
    labelKey: 'navigation.settings',
    path: '/app/settings',
    icon: <SettingsOutlinedIcon />,
  },
] as const

/**
 * Returns the index of the nav item that best matches the current path.
 *
 * Matching happens on path-segment boundaries and the longest match wins, so
 * `/app` does not stay highlighted on `/app/applications`.
 *
 * @param pathname - Current location pathname.
 */
function getActiveIndex(pathname: string): number {
  let activeIndex = 0
  let longestMatch = 0

  NAV_ITEMS.forEach((item, index) => {
    const matches =
      pathname === item.path || pathname.startsWith(`${item.path}/`)

    if (matches && item.path.length > longestMatch) {
      activeIndex = index
      longestMatch = item.path.length
    }
  })

  return activeIndex
}

/**
 * Authenticated application shell.
 *
 * Renders a permanent sidebar on md+ screens and a bottom navigation on
 * xs/sm, redirecting unauthenticated users to the login route.
 */
export function AppLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeIndex = getActiveIndex(pathname)
  const signOutMutation = useSignOut()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to={authPaths.login} replace state={{ from: pathname }} />
  }

  async function handleSignOut() {
    await signOutMutation.mutateAsync()
    void navigate(authPaths.login)
  }

  return (
    <Box sx={{ display: 'flex', height: '100dvh' }}>
      {/* Persistent sidebar on md+ */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Job Tracker
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ pt: 1, flexGrow: 1 }}>
          {NAV_ITEMS.map((item, index) => (
            <ListItemButton
              key={item.path}
              selected={activeIndex === index}
              onClick={() => navigate(item.path)}
              sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ px: 1, py: 1.5 }}>
          <LanguageSwitcher />
        </Box>
        <List sx={{ pb: 1 }}>
          <ListItemButton
            onClick={handleSignOut}
            disabled={signOutMutation.isPending}
            sx={{ borderRadius: 2, mx: 1, mt: 0.5, color: 'error.main' }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <LogoutOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                signOutMutation.isPending
                  ? t('session.signingOut')
                  : t('session.signOut')
              }
            />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main content area */}
      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pb: { xs: 7, md: 0 },
        }}
      >
        {/* Top app bar on mobile */}
        <AppBar
          position="static"
          elevation={0}
          color="transparent"
          sx={{
            display: { xs: 'flex', md: 'none' },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Job Tracker
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Bottom navigation on xs/sm */}
      <Paper
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={activeIndex}
          onChange={(_, value: number) => {
            void navigate(NAV_ITEMS[value].path)
          }}
          showLabels
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={t(item.labelKey)}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
