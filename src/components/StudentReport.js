import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reportAPI } from '../services/api';
import {
  Container,
  Card,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StudentReport = () => {
  const { studentId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // Last 30 days

        const response = await reportAPI.getStudentReport(
          studentId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        setReport(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [studentId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!report) return <Typography>No report data available</Typography>;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Safe access to nested properties with defaults
  const attendanceReport = report?.attendanceReport || {};
  const statusCounts = attendanceReport?.statusCounts || {};
  const academicReport = report?.academicReport || {};
  const taskReport = report?.taskReport || {};

  return (
    <Container maxWidth="lg">
      <style>{`
        @media print {
          .no-print, .MuiTabs-root, button {
            display: none !important;
          }
          .MuiPaper-root {
            box-shadow: none;
          }
        }
      `}</style>
      <Box sx={{ width: '100%', bgcolor: 'background.paper', mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4">Student Report</Typography>
            <Typography variant="caption" color="text.secondary">
              Report Generated On: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            className="no-print"
          >
            Print Report
          </Button>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Attendance" />
          <Tab label="Academic Performance" />
          <Tab label="Task Progress" />
        </Tabs>

        {/* Attendance Tab */}
        {tabValue === 0 && (
          <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Overview
            </Typography>
            {Object.keys(statusCounts).length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={Object.entries(statusCounts).map(([key, value]) => ({
                        name: key,
                        value: value
                      }))}
                      cx={200}
                      cy={150}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(statusCounts).map((entry, index) => (
                        <Cell key={entry[0]} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      Average Attendance: {(attendanceReport?.averageAttendance || 0).toFixed(2)}%
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography>No attendance data available</Typography>
            )}
          </Paper>
        )}

        {/* Academic Performance Tab */}
        {tabValue === 1 && (
          <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Academic Performance
            </Typography>
            {academicReport?.subjectPerformance && Object.keys(academicReport.subjectPerformance).length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <LineChart
                    width={800}
                    height={300}
                    data={Object.entries(academicReport.subjectPerformance).map(([subject, data]) => ({
                      subject,
                      percentage: data?.averagePercentage || 0
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="percentage" stroke="#8884d8" />
                  </LineChart>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      Overall Average: {(academicReport?.overallAverage || 0).toFixed(2)}%
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography>No academic performance data available</Typography>
            )}
          </Paper>
        )}

        {/* Task Progress Tab */}
        {tabValue === 2 && (
          <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Progress
            </Typography>
            {taskReport && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={[
                        { name: 'Completed', value: taskReport?.completedTasks || 0 },
                        { name: 'Pending', value: taskReport?.pendingTasks || 0 },
                        { name: 'Late', value: taskReport?.lateTasks || 0 }
                      ]}
                      cx={200}
                      cy={150}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      Task Completion Rate: {(taskReport?.completionRate || 0).toFixed(2)}%
                    </Typography>
                    <Typography variant="subtitle1">
                      Total Tasks: {taskReport?.totalTasks || 0}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}
            {!taskReport && <Typography>No task data available</Typography>}
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default StudentReport;