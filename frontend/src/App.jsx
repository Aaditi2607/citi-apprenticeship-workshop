import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Grid,
  Card,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  Paper,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Work as WorkIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

const drawerWidth = 250;
const cardShadow = '0 18px 45px rgba(15, 23, 42, 0.08)';
const subtleBorder = '1px solid rgba(148, 163, 184, 0.22)';
const demoRoles = ['HR Admin', 'Manager', 'Employee'];

const fallbackEmployees = [
  {
    employee_id: 1,
    first_name: 'Avery',
    last_name: 'Johnson',
    role: 'Senior Product Manager',
    performance_score: 4.7,
    email: 'avery.johnson@acme.com',
    skill_gap: 'Analytics Automation',
    development_plan: 'Complete advanced analytics bootcamp',
    status: 'Promotion Ready'
  },
  {
    employee_id: 2,
    first_name: 'Mia',
    last_name: 'Chen',
    role: 'UX Designer',
    performance_score: 4.2,
    email: 'mia.chen@acme.com',
    skill_gap: 'Design Systems',
    development_plan: 'Join the design system training program',
    status: 'High Achiever'
  },
  {
    employee_id: 3,
    first_name: 'Noah',
    last_name: 'Patel',
    role: 'Data Engineer',
    performance_score: 3.9,
    email: 'noah.patel@acme.com',
    skill_gap: 'Cloud Infrastructure',
    development_plan: 'Attend AWS certification course',
    status: 'Needs Training'
  }
];

const fallbackAnalytics = {
  total_employees: 32,
  average_performance: 4.1,
  promotion_ready: 9,
  needs_training: 7,
  performance_distribution: [
    { name: '1-2', count: 4 },
    { name: '2-3', count: 7 },
    { name: '3-4', count: 12 },
    { name: '4-5', count: 9 }
  ],
  status_breakdown: [
    { name: 'Promotion Ready', value: 9, color: '#4caf50' },
    { name: 'High Achiever', value: 16, color: '#2196f3' },
    { name: 'Needs Training', value: 7, color: '#dc2626' }
  ],
  performance_trend: [
    { month: 'Jan', average: 3.9 },
    { month: 'Feb', average: 4.0 },
    { month: 'Mar', average: 4.1 },
    { month: 'Apr', average: 4.2 },
    { month: 'May', average: 4.3 },
    { month: 'Jun', average: 4.1 }
  ]
};

const normalizeEmployee = emp => {
  const sourceName = emp.name ?? emp.employee_name ?? '';
  const firstName = emp.first_name ?? sourceName.split(' ')[0] ?? 'Unknown';
  const lastName = emp.last_name ?? sourceName.split(' ').slice(1).join(' ') ?? '';
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const performanceScore = Number(emp.performance_score);
  return {
    employee_id: emp.employee_id ?? emp.id ?? `${fullName}-fallback`,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: emp.email ?? emp.employee_email ?? 'unknown@acme.com',
    role: emp.role ?? emp.position ?? 'Team Member',
    performance_score: Number.isFinite(performanceScore) ? performanceScore : 0,
    skill_gap: emp.skill_gap ?? emp.gap_area ?? 'General Development',
    development_plan: emp.development_plan ?? emp.plan ?? 'Continue growth plan',
    status: emp.status?.trim() || 'Active',
    joining_date: emp.joining_date ?? ''
  };
};

const isFallbackEmployeeList = list =>
  list.length === fallbackEmployees.length
  && list.every((employee, index) => employee.email === fallbackEmployees[index].email);

const getEmployeesFromApi = async () => {
  const response = await fetch('http://localhost:3001/api/python-service/employees');
  if (!response.ok) {
    throw new Error(`Employee request failed with status ${response.status}`);
  }
  const json = await response.json();
  const payload = json?.data ?? json ?? [];
  return Array.isArray(payload) && payload.length > 0
    ? payload.map(normalizeEmployee)
    : fallbackEmployees.map(normalizeEmployee);
};

export default function App() {
  const [authRole, setAuthRole] = useState('');
  const [selectedLoginRole, setSelectedLoginRole] = useState('HR Admin');
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    performance_score: '',
    skill_gap: '',
    development_plan: '',
    status: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1d4ed8'
      },
      secondary: {
        main: '#0f766e'
      },
      background: {
        default: '#f6f8fb',
        paper: '#ffffff'
      },
      text: {
        primary: '#0f172a',
        secondary: '#64748b'
      }
    },
    typography: {
      fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      h4: {
        fontWeight: 800,
        letterSpacing: 0
      },
      h5: {
        fontWeight: 800,
        letterSpacing: 0
      },
      h6: {
        fontWeight: 750,
        letterSpacing: 0
      }
    },
    shape: {
      borderRadius: 10
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: subtleBorder,
            boxShadow: cardShadow
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 700
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: '#f8fafc',
            color: '#475569',
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 700
          }
        }
      }
    }
  });

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dashboardRef = useRef(null);
  const snapshotRef = useRef(null);
  const analyticsRef = useRef(null);
  const insightsRef = useRef(null);
  const employeesRef = useRef(null);
  const panelSx = {
    borderRadius: 2,
    border: subtleBorder,
    boxShadow: cardShadow,
    background: '#ffffff'
  };
  const chartContainerSx = {
    height: { xs: 250, md: 280, lg: 300 },
    minWidth: 0
  };

  const loadEmployees = async () => {
    try {
      setEmployees(await getEmployeesFromApi());
    } catch (fetchError) {
      console.error(fetchError);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/python-service/analytics/dashboard');
      const json = response.ok ? await response.json() : null;
      const analyticsPayload = json?.data ?? json ?? {};
      const normalizedAnalytics = {
        total_employees: typeof analyticsPayload.total_employees === 'number' 
          ? analyticsPayload.total_employees 
          : (typeof analyticsPayload.total_staff === 'number' ? analyticsPayload.total_staff : fallbackAnalytics.total_employees),
        average_performance: typeof analyticsPayload.average_performance === 'number'
          ? analyticsPayload.average_performance
          : (typeof analyticsPayload.average_rating === 'number' ? analyticsPayload.average_rating : fallbackAnalytics.average_performance),
        promotion_ready: typeof analyticsPayload.promotion_ready_employees === 'number'
          ? analyticsPayload.promotion_ready_employees
          : (typeof analyticsPayload.promotion_ready === 'number' ? analyticsPayload.promotion_ready : fallbackAnalytics.promotion_ready),
        needs_training: typeof analyticsPayload.high_risk_employees === 'number'
          ? analyticsPayload.high_risk_employees
          : (typeof analyticsPayload.needs_training === 'number' ? analyticsPayload.needs_training : fallbackAnalytics.needs_training),
        performance_distribution: Array.isArray(analyticsPayload.performance_distribution) && analyticsPayload.performance_distribution.length > 0
          ? analyticsPayload.performance_distribution
          : fallbackAnalytics.performance_distribution,
        status_breakdown: Array.isArray(analyticsPayload.status_breakdown) && analyticsPayload.status_breakdown.length > 0
          ? analyticsPayload.status_breakdown.map(entry => ({
              ...entry,
              color: entry.color ?? (entry.name === 'Promotion Ready' ? '#4caf50' : entry.name === 'High Achiever' ? '#2196f3' : '#dc2626')
            }))
          : fallbackAnalytics.status_breakdown,
        performance_trend: Array.isArray(analyticsPayload.performance_trend) && analyticsPayload.performance_trend.length > 0
          ? analyticsPayload.performance_trend
          : fallbackAnalytics.performance_trend
      };
      setAnalytics(normalizedAnalytics);
    } catch (fetchError) {
      console.error(fetchError);
    }
  };

  const handleOpenDialog = () => setDialogOpen(true);
  const handleLogin = () => setAuthRole(selectedLoginRole);
  const handleLogout = () => {
    setAuthRole('');
    setSidebarOpen(false);
    setDialogOpen(false);
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
  };
  const sectionRefs = {
    dashboard: dashboardRef,
    snapshot: snapshotRef,
    analytics: analyticsRef,
    insights: insightsRef,
    employees: employeesRef
  };
  const handleSectionScroll = section => {
    sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      role: '',
      performance_score: '',
      skill_gap: '',
      development_plan: '',
      status: ''
    });
  };

  const handleFormChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleAddEmployee = async () => {
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const today = new Date().toISOString().split('T')[0];

    const parsedScore = parseFloat(formData.performance_score);
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: formData.email,
      role: formData.role,
      performance_score: Number.isFinite(parsedScore) ? parsedScore : 0,
      skill_gap: formData.skill_gap,
      development_plan: formData.development_plan,
      status: formData.status?.trim() ?? '',
      joining_date: today
    };

    try {
      const response = await fetch('http://localhost:3001/api/python-service/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Request failed with status ${response.status}`);
      }

      const json = await response.json();
      const createdEmployee = normalizeEmployee(json?.data ?? payload);
      setEmployees(prev => {
        const nextEmployees = isFallbackEmployeeList(prev)
          ? []
          : prev.filter(emp => emp.employee_id !== createdEmployee.employee_id);
        return [...nextEmployees, createdEmployee];
      });
      setSnackbar({ open: true, message: 'Employee added successfully.', severity: 'success' });
      handleCloseDialog();
      await loadEmployees();
      await loadAnalytics();
    } catch (postError) {
      setSnackbar({ open: true, message: postError.message || 'Unable to add employee.', severity: 'error' });
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        setEmployees(await getEmployeesFromApi());
        await loadAnalytics();
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statusOptions = useMemo(() => (
    [...new Set(employees.map(emp => emp.status).filter(Boolean))].sort()
  ), [employees]);

  const roleOptions = useMemo(() => (
    [...new Set(employees.map(emp => emp.role).filter(Boolean))].sort()
  ), [employees]);

  const filteredEmployees = employees.filter(emp => {
    const fullName = emp.full_name ?? emp.name ?? '';
    const email = emp.email ?? '';
    const role = emp.role ?? '';
    const status = emp.status ?? '';
    const term = search.trim().toLowerCase();
    const matchesSearch = !term
      || fullName.toLowerCase().includes(term)
      || email.toLowerCase().includes(term)
      || role.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const skillDistribution = useMemo(() => {
    const skillCounts = employees.reduce((counts, emp) => {
      const skill = emp.skill_gap?.trim() || 'General Development';
      counts[skill] = (counts[skill] || 0) + 1;
      return counts;
    }, {});

    return Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
      .slice(0, 5);
  }, [employees]);

  const maxSkillCount = Math.max(...skillDistribution.map(item => item.count), 1);

  const attritionRiskEmployees = useMemo(() => (
    employees
      .filter(emp => emp.status === 'Needs Training' && emp.performance_score >= 4)
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 4)
  ), [employees]);

  const promotionReadyEmployees = useMemo(() => (
    employees
      .filter(emp => emp.status === 'Promotion Ready')
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 4)
  ), [employees]);

  const isHrAdmin = authRole === 'HR Admin';
  const isManager = authRole === 'Manager';
  const isEmployee = authRole === 'Employee';
  const activeEmployee = employees[0] ?? normalizeEmployee(fallbackEmployees[0]);

  const chartColors = ['#2563eb', '#0f766e', '#f59e0b', '#7c3aed'];
  const snapshotCards = [
    {
      label: 'Total Employees',
      value: analytics?.total_employees ?? fallbackAnalytics.total_employees,
      caption: 'Employees tracked',
      color: '#2563eb',
      icon: <PeopleIcon />
    },
    {
      label: 'Avg Rating',
      value: (analytics?.average_performance ?? fallbackAnalytics.average_performance).toFixed(1),
      caption: 'Overall score',
      color: '#0f766e',
      icon: <TrendingUpIcon />
    },
    {
      label: 'Promotion Ready',
      value: analytics?.promotion_ready ?? fallbackAnalytics.promotion_ready,
      caption: 'Ready now',
      color: '#16a34a',
      icon: <AssessmentIcon />
    },
    {
      label: 'Needs Training',
      value: analytics?.needs_training ?? fallbackAnalytics.needs_training,
      caption: 'Action needed',
      color: '#f59e0b',
      icon: <WorkIcon />
    }
  ];
  const visibleSnapshotCards = isManager
    ? snapshotCards.filter(card => card.label !== 'Total Employees')
    : snapshotCards;
  const navigationItems = isEmployee
    ? [
        { label: 'Dashboard', icon: <DashboardIcon />, section: 'dashboard' },
        { label: 'Workforce Snapshot', icon: <BadgeIcon />, section: 'snapshot' },
        { label: 'Insights', icon: <WorkIcon />, section: 'insights' }
      ]
    : [
        { label: 'Dashboard', icon: <DashboardIcon />, section: 'dashboard' },
        { label: 'Workforce Snapshot', icon: <PeopleIcon />, section: 'snapshot' },
        { label: 'Analytics', icon: <AssessmentIcon />, section: 'analytics' },
        { label: 'Insights', icon: <BarChartIcon />, section: 'insights' },
        { label: 'Employees', icon: <WorkIcon />, section: 'employees' }
      ];

  if (!authRole) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            px: 2,
            py: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 45%, #f1f5f9 100%)'
          }}
        >
          <Card elevation={0} sx={{ ...panelSx, width: '100%', maxWidth: 520, p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', background: '#2563eb', color: '#ffffff' }}>
                <DashboardIcon />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.08em' }}>
                  TalentOps Demo
                </Typography>
                <Typography variant="h5" sx={{ lineHeight: 1.1 }}>
                  Workforce Analytics Login
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a demo role to preview the dashboard experience for HR, managers, or employees.
            </Typography>
            <TextField
              select
              fullWidth
              label="Demo role"
              value={selectedLoginRole}
              onChange={event => setSelectedLoginRole(event.target.value)}
              sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2, background: '#ffffff' } }}
            >
              {demoRoles.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </TextField>
            <Button fullWidth variant="contained" size="large" onClick={handleLogin} sx={{ height: 48 }}>
              Continue as {selectedLoginRole}
            </Button>
            <Box sx={{ mt: 2.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {demoRoles.map(role => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  color={selectedLoginRole === role ? 'primary' : 'default'}
                  variant={selectedLoginRole === role ? 'filled' : 'outlined'}
                  onClick={() => setSelectedLoginRole(role)}
                />
              ))}
            </Box>
          </Card>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%)' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            color: 'text.primary',
            borderBottom: subtleBorder
          }}
        >
          <Toolbar sx={{ gap: 2, minHeight: { xs: 68, md: 76 } }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.08em' }}>
                Workforce Intelligence
              </Typography>
              <Typography variant="h5" noWrap sx={{ lineHeight: 1.15 }}>
                Employee Performance Dashboard
              </Typography>
            </Box>
            <Chip label={authRole} color="primary" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ height: 38 }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? sidebarOpen : true}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: subtleBorder,
              background: '#0f172a',
              color: '#e2e8f0'
            }
          }}
        >
          <Toolbar />
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', background: '#2563eb' }}>
                <DashboardIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff' }}>
                  TalentOps
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ borderColor: 'rgba(148,163,184,0.2)', mb: 2 }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Navigation
            </Typography>
          </Box>
          <List sx={{ px: 1.5 }}>
            {navigationItems.map(item => (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleSectionScroll(item.section)}
                  sx={{
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: '#cbd5e1',
                    '&:hover': { background: 'rgba(37, 99, 235, 0.18)', color: '#ffffff' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 1.75, sm: 2.25, lg: 2.5 },
            py: { xs: 1.5, md: 2 },
            width: { md: `calc(100% - ${drawerWidth}px)` }
          }}
        >
          <Toolbar />
          <Box sx={{ width: '100%' }}>
            <Box ref={dashboardRef} sx={{ my: { xs: 1.5, md: 1.75 }, scrollMarginTop: 96, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 0.75 }}>
                  {isEmployee ? 'My Workforce Dashboard' : isManager ? 'Manager Team Analytics' : 'Workforce Analytics'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {isEmployee
                    ? 'Personal performance, development focus, and readiness overview.'
                    : isManager
                    ? 'Team-level performance signals, retention watch, and employee visibility.'
                    : 'Executive view of talent readiness, performance movement, and development priorities.'}
                </Typography>
              </Box>
            </Box>

            {isEmployee ? (
              <Grid ref={snapshotRef} container spacing={2.5} alignItems="stretch" sx={{ scrollMarginTop: 96 }}>
                <Grid item xs={12} md={5}>
                  <Card elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 3 }, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 3 }}>
                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                          Personal Snapshot
                        </Typography>
                        <Typography variant="h5">
                          {activeEmployee.full_name ?? activeEmployee.name ?? 'Employee'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activeEmployee.role}
                        </Typography>
                      </Box>
                      <Chip
                        label={activeEmployee.status}
                        color={activeEmployee.status === 'Promotion Ready' ? 'success' : activeEmployee.status === 'Needs Training' ? 'warning' : 'primary'}
                        variant="outlined"
                      />
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                            Performance
                          </Typography>
                          <Typography variant="h4">{activeEmployee.performance_score.toFixed(1)}</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                            Readiness
                          </Typography>
                          <Typography variant="h6" sx={{ mt: 0.65 }}>{activeEmployee.status === 'Promotion Ready' ? 'Ready' : 'Developing'}</Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
                <Grid ref={insightsRef} item xs={12} md={7} sx={{ scrollMarginTop: 96 }}>
                  <Card elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 3 }, height: '100%' }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Growth Plan
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Development Focus
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                          Skill Gap
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{activeEmployee.skill_gap}</Typography>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                          Recommended Plan
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{activeEmployee.development_plan}</Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            ) : (
            <>
            <Grid ref={snapshotRef} container spacing={3} alignItems="stretch" sx={{ scrollMarginTop: 96 }}>
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  ...panelSx,
                  p: { xs: 2, md: 2.5 },
                  height: '100%'
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5">
                    Workforce Snapshot
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Real-time performance indicators.
                  </Typography>
                </Box>
                <Grid container spacing={1.5} alignItems="stretch">
                  {visibleSnapshotCards.map(card => (
                    <Grid item xs={12} sm={6} lg={3} key={card.label} sx={{ display: 'flex' }}>
                      <Card
                        elevation={0}
                        sx={{
                          p: 2,
                          width: '100%',
                          minHeight: 124,
                          borderRadius: 2,
                          border: '1px solid #e2e8f0',
                          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                          boxShadow: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800 }}>
                            {card.label}
                          </Typography>
                          <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', color: card.color, background: `${card.color}14` }}>
                            {card.icon}
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="h4" sx={{ color: '#0f172a', lineHeight: 1 }}>
                            {card.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {card.caption}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>

            </Grid>

            <Grid ref={analyticsRef} container spacing={2.5} sx={{ mt: 2.25, scrollMarginTop: 96 }} alignItems="stretch">
            <Grid item xs={12} lg={4} xl={4}>
              <Card elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 2.5 }, height: '100%' }}>
                <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Team Performance
                    </Typography>
                    <Typography variant="h6">
                      Status Mix
                    </Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', background: '#eff6ff', color: 'primary.main' }}>
                    <PieChartIcon />
                  </Box>
                </Box>
                <Box sx={chartContainerSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.status_breakdown ?? fallbackAnalytics.status_breakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="78%"
                        innerRadius="45%"
                        paddingAngle={3}
                        labelLine={false}
                      >
                        {(analytics?.status_breakdown ?? fallbackAnalytics.status_breakdown).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color ?? chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: cardShadow }} />
                      <Legend
                        verticalAlign="bottom"
                        height={52}
                        iconSize={8}
                        wrapperStyle={{
                          fontSize: 11,
                          lineHeight: '16px',
                          paddingTop: 8,
                          whiteSpace: 'normal'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            {isHrAdmin && (
            <Grid item xs={12} lg={5} xl={5}>
              <Card elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 3 }, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      Performance Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track rating progress over the last six months.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={chartContainerSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.performance_trend ?? fallbackAnalytics.performance_trend} margin={{ top: 8, right: 20, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[0, 5]} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: cardShadow }} />
                      <Legend />
                      <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
            )}

            <Grid item xs={12} lg={3} xl={3}>
              <Card elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 3 }, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Performance Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Employee counts by score range.
                </Typography>
                <Box sx={chartContainerSx}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.performance_distribution ?? fallbackAnalytics.performance_distribution} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: cardShadow }} />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
          </Grid>

          <Grid ref={insightsRef} container spacing={2.5} sx={{ mt: 2.25, scrollMarginTop: 96 }} alignItems="stretch">
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.25 }, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Capability Signals
                    </Typography>
                    <Typography variant="h6">
                      Skill Distribution
                    </Typography>
                  </Box>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', background: '#eef2ff', color: '#4f46e5' }}>
                    <BarChartIcon fontSize="small" />
                  </Box>
                </Box>
                <Box sx={{ display: 'grid', gap: 1.35 }}>
                  {skillDistribution.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No skill data available.</Typography>
                  ) : (
                    skillDistribution.map(item => (
                      <Box key={item.skill}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                            {item.skill}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                            {item.count}
                          </Typography>
                        </Box>
                        <Box sx={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.max((item.count / maxSkillCount) * 100, 8)}%`, height: '100%', borderRadius: 999, background: '#2563eb' }} />
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.25 }, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Retention Watch
                    </Typography>
                    <Typography variant="h6">
                      Attrition Risk
                    </Typography>
                  </Box>
                  <Chip
                    label={`${attritionRiskEmployees.length} elevated`}
                    size="small"
                    color={attritionRiskEmployees.length > 0 ? 'error' : 'success'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  High performers marked Needs Training are flagged for manager follow-up.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attritionRiskEmployees.length === 0 ? (
                    <Chip label="No elevated concerns" size="small" color="success" variant="outlined" />
                  ) : (
                    attritionRiskEmployees.map(emp => (
                      <Chip
                        key={emp.employee_id}
                        label={`${emp.full_name ?? emp.name ?? 'Employee'} - ${emp.performance_score.toFixed(1)}`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    ))
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.25 }, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Mobility Pipeline
                    </Typography>
                    <Typography variant="h6">
                      Promotion Readiness
                    </Typography>
                  </Box>
                  <Chip
                    label={`${promotionReadyEmployees.length} ready`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Employees already tagged Promotion Ready, ranked by performance.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {promotionReadyEmployees.length === 0 ? (
                    <Chip label="No ready employees" size="small" variant="outlined" />
                  ) : (
                    promotionReadyEmployees.map(emp => (
                      <Chip
                        key={emp.employee_id}
                        label={`${emp.full_name ?? emp.name ?? 'Employee'} - ${emp.performance_score.toFixed(1)}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ))
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>

          <Card ref={employeesRef} elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 3 }, mt: 2.5, scrollMarginTop: 96 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}>
              <Box>
                <Typography variant="h6">
                  Employee Performance Table
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search, review, and compare employee quality metrics at a glance.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
                {isHrAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenDialog}
                  startIcon={<AddIcon />}
                  sx={{ height: 42, px: 2.25, width: { xs: '100%', sm: 'auto' } }}
                >
                  Add Employee
                </Button>
                )}
              </Box>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 1fr) 220px 220px' },
                gap: 1.5,
                alignItems: 'center',
                mb: 2.5
              }}
            >
              <TextField
                size="small"
                placeholder="Search name, email, or role"
                value={search}
                onChange={event => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, background: '#ffffff' } }}
              />
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, background: '#ffffff' } }}
              >
                <MenuItem value="all">All statuses</MenuItem>
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Role"
                value={roleFilter}
                onChange={event => setRoleFilter(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, background: '#ffffff' } }}
              >
                <MenuItem value="all">All roles</MenuItem>
                {roleOptions.map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </TextField>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: 2, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Performance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Skill Gap</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Development Plan</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No employees match your search or filters.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map(emp => (
                        <TableRow
                          key={emp.employee_id}
                          hover
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                            '&:hover': { backgroundColor: '#f8fafc' }
                          }}
                        >
                          <TableCell sx={{ minWidth: 180 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {emp.full_name ?? emp.name ?? 'Unknown Employee'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{emp.email}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{emp.role}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontWeight: 700 }}>{emp.performance_score.toFixed(1)}</Typography>
                              <Chip
                                label={`${Math.round(emp.performance_score * 20)}%`}
                                size="small"
                                color={emp.performance_score >= 4 ? 'success' : emp.performance_score >= 3 ? 'primary' : 'warning'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{emp.skill_gap}</TableCell>
                          <TableCell sx={{ maxWidth: 280, color: 'text.secondary' }}>{emp.development_plan}</TableCell>
                          <TableCell>
                            <Chip
                              label={emp.status}
                              color={
                                emp.status === 'Promotion Ready'
                                  ? 'success'
                                  : emp.status === 'Needs Training'
                                  ? 'warning'
                                  : 'primary'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
          </>
            )}

          {error && (
            <Box sx={{ mt: 3, p: 3, borderRadius: 2, border: subtleBorder, backgroundColor: '#ffffff' }}>
              <Typography color="error" sx={{ fontWeight: 700 }}>
                Unable to load live data.
              </Typography>
              <Typography color="text.secondary">{error}</Typography>
            </Box>
          )}

          <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
            <DialogTitle>Add Employee</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Performance Score"
                name="performance_score"
                type="number"
                value={formData.performance_score}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Skill Gap"
                name="skill_gap"
                value={formData.skill_gap}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Development Plan"
                name="development_plan"
                value={formData.development_plan}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                margin="dense"
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleAddEmployee} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
