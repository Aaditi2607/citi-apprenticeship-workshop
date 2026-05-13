import React, { useState, useEffect } from 'react';
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
  CardContent,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Work as WorkIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon
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

const fallbackEmployees = [
  {
    employee_id: 1,
    name: 'Avery Johnson',
    role: 'Senior Product Manager',
    performance_score: 4.7,
    email: 'avery.johnson@acme.com',
    skill_gap: 'Analytics Automation',
    development_plan: 'Complete advanced analytics bootcamp',
    status: 'Promotion Ready'
  },
  {
    employee_id: 2,
    name: 'Mia Chen',
    role: 'UX Designer',
    performance_score: 4.2,
    email: 'mia.chen@acme.com',
    skill_gap: 'Design Systems',
    development_plan: 'Join the design system training program',
    status: 'High Achiever'
  },
  {
    employee_id: 3,
    name: 'Noah Patel',
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
    { name: 'Needs Training', value: 7, color: '#ff9800' }
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

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2'
      },
      secondary: {
        main: '#ff7f50'
      },
      background: {
        default: darkMode ? '#111827' : '#f3f6fb',
        paper: darkMode ? '#1f2937' : '#ffffff'
      }
    },
    typography: {
      fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(',')
    }
  });

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [employeeResponse, analyticsResponse] = await Promise.all([
          fetch('http://localhost:3001/api/python-service/employees'),
          fetch('http://localhost:3001/api/python-service/analytics/dashboard')
        ]);

        const employeeJson = employeeResponse.ok ? await employeeResponse.json() : null;
        const analyticsJson = analyticsResponse.ok ? await analyticsResponse.json() : null;

        const employeePayload = employeeJson?.data ?? employeeJson ?? [];
        const normalizedEmployees = Array.isArray(employeePayload) && employeePayload.length > 0
          ? employeePayload.map(emp => ({
              employee_id: emp.employee_id ?? emp.id ?? `${emp.name ?? emp.employee_name ?? 'Unknown'}-fallback`,
              name: emp.name ?? emp.employee_name ?? 'Unknown Employee',
              email: emp.email ?? emp.employee_email ?? 'unknown@acme.com',
              role: emp.role ?? emp.position ?? 'Team Member',
              performance_score: typeof emp.performance_score === 'number' ? emp.performance_score : Number(emp.performance_score) || 0,
              skill_gap: emp.skill_gap ?? emp.gap_area ?? 'General Development',
              development_plan: emp.development_plan ?? emp.plan ?? 'Continue growth plan',
              status: emp.status ?? 'Active'
            }))
          : fallbackEmployees;

        const analyticsPayload = analyticsJson?.data ?? analyticsJson ?? {};
        const normalizedAnalytics = {
          total_employees: analyticsPayload.total_employees ?? analyticsPayload.total_staff ?? fallbackAnalytics.total_employees,
          average_performance: analyticsPayload.average_rating ?? analyticsPayload.average_performance ?? fallbackAnalytics.average_performance,
          promotion_ready: analyticsPayload.promotion_ready_employees ?? analyticsPayload.promotion_ready ?? fallbackAnalytics.promotion_ready,
          needs_training: analyticsPayload.high_risk_employees ?? analyticsPayload.needs_training ?? fallbackAnalytics.needs_training,
          performance_distribution: Array.isArray(analyticsPayload.performance_distribution) && analyticsPayload.performance_distribution.length > 0
            ? analyticsPayload.performance_distribution
            : fallbackAnalytics.performance_distribution,
          status_breakdown: Array.isArray(analyticsPayload.status_breakdown) && analyticsPayload.status_breakdown.length > 0
            ? analyticsPayload.status_breakdown.map(entry => ({
                ...entry,
                color: entry.color ?? (entry.name === 'Promotion Ready' ? '#4caf50' : entry.name === 'High Achiever' ? '#2196f3' : '#ff9800')
              }))
            : fallbackAnalytics.status_breakdown,
          performance_trend: Array.isArray(analyticsPayload.performance_trend) && analyticsPayload.performance_trend.length > 0
            ? analyticsPayload.performance_trend
            : fallbackAnalytics.performance_trend
        };

        setEmployees(normalizedEmployees);
        setAnalytics(normalizedAnalytics);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const name = emp.name ?? emp.employee_name ?? '';
    const email = emp.email ?? emp.employee_email ?? '';
    const term = search.trim().toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  const chartColors = ['#1976d2', '#388e3c', '#f57c00', '#9c27b0'];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar
          position="fixed"
          elevation={3}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            background: darkMode
              ? 'linear-gradient(90deg, rgba(30,41,59,1), rgba(17,24,39,1))'
              : 'linear-gradient(90deg, rgba(25,118,210,1), rgba(66,165,245,1))'
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                Employee Performance Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Insights, metrics, and workforce performance in one place.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  color="default"
                />
              }
              label={darkMode ? <Brightness4Icon /> : <Brightness7Icon />}
            />
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
              borderRight: 0,
              background: darkMode ? '#111827' : '#ffffff'
            }
          }}
        >
          <Toolbar />
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
              Navigation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quick access to important dashboard areas.
            </Typography>
          </Box>
          <List>
            {[
              { label: 'Overview', icon: <DashboardIcon /> },
              { label: 'Employees', icon: <PeopleIcon /> },
              { label: 'Analytics', icon: <AssessmentIcon /> },
              { label: 'Insights', icon: <BarChartIcon /> },
              { label: 'Performance', icon: <WorkIcon /> }
            ].map(item => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton sx={{ px: 3 }}>
                  <ListItemIcon sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card
                elevation={3}
                sx={{
                  background: darkMode ? '#1e293b' : '#ffffff',
                  borderRadius: 3,
                  p: 3
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                  Workforce Snapshot
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Real-time performance data with safe fallbacks for any API disruption.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      elevation={1}
                      sx={{
                        p: 2,
                        background: darkMode ? '#111827' : '#f4f8ff',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Employees
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analytics?.total_employees ?? fallbackAnalytics.total_employees}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      elevation={1}
                      sx={{ p: 2, background: darkMode ? '#111827' : '#f4f8ff', borderRadius: 2 }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Avg Rating
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {(analytics?.average_performance ?? fallbackAnalytics.average_performance).toFixed(1)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      elevation={1}
                      sx={{ p: 2, background: darkMode ? '#111827' : '#f4f8ff', borderRadius: 2 }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Promotion Ready
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analytics?.promotion_ready ?? fallbackAnalytics.promotion_ready}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      elevation={1}
                      sx={{ p: 2, background: darkMode ? '#111827' : '#f4f8ff', borderRadius: 2 }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Needs Training
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analytics?.needs_training ?? fallbackAnalytics.needs_training}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Team Performance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Quick Insights
                    </Typography>
                  </Box>
                  <PieChartIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                </Box>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics?.status_breakdown ?? fallbackAnalytics.status_breakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                    >
                      {(analytics?.status_breakdown ?? fallbackAnalytics.status_breakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color ?? chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} lg={8}>
              <Card elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Performance Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track rating progress over the last six months.
                    </Typography>
                  </Box>
                </Box>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={analytics?.performance_trend ?? fallbackAnalytics.performance_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e0e7ff'} />
                    <XAxis dataKey="month" stroke={darkMode ? '#e2e8f0' : '#334155'} />
                    <YAxis stroke={darkMode ? '#e2e8f0' : '#334155'} domain={[0, 5]} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#111827' : '#ffffff', borderRadius: 12 }} />
                    <Legend />
                    <Line type="monotone" dataKey="average" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Performance Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analytics?.performance_distribution ?? fallbackAnalytics.performance_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e7ff'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#e2e8f0' : '#334155'} />
                    <YAxis stroke={darkMode ? '#e2e8f0' : '#334155'} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#111827' : '#ffffff', borderRadius: 12 }} />
                    <Bar dataKey="count" fill="#1976d2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>

          <Card elevation={3} sx={{ p: 3, mt: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Employee Performance Table
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search, review, and compare employee quality metrics at a glance.
                </Typography>
              </Box>
              <TextField
                size="small"
                placeholder="Search by name or email"
                value={search}
                onChange={event => setSearch(event.target.value)}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Performance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Skill Gap</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No employees match your search.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map(emp => (
                        <TableRow key={emp.employee_id} hover>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {emp.name ?? emp.employee_name ?? 'Unknown Employee'}
                            </Typography>
                          </TableCell>
                          <TableCell>{emp.email ?? emp.employee_email ?? 'unknown@acme.com'}</TableCell>
                          <TableCell>{emp.role ?? 'Team Member'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontWeight: 700 }}>{emp.performance_score?.toFixed(1) ?? '0.0'}</Typography>
                              <Chip
                                label={`${Math.round((emp.performance_score ?? 0) * 20)}%`}
                                size="small"
                                color={emp.performance_score >= 4 ? 'success' : emp.performance_score >= 3 ? 'primary' : 'warning'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{emp.skill_gap ?? 'General Development'}</TableCell>
                          <TableCell>
                            <Chip
                              label={emp.status ?? 'Active'}
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

          {error && (
            <Box sx={{ mt: 3, p: 3, borderRadius: 3, backgroundColor: darkMode ? '#111827' : '#f8fafc' }}>
              <Typography color="error" sx={{ fontWeight: 700 }}>
                Unable to load live data.
              </Typography>
              <Typography color="text.secondary">{error}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
