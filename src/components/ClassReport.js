import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reportAPI, classAPI } from '../services/api';
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

const ClassReport = () => {
  const { classId } = useParams();
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classComparison, setClassComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [comparisonMode, setComparisonMode] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (classId) {
      fetchReports();
    }
  }, [classId]);

  useEffect(() => {
    if (selectedClasses.length > 0) {
      fetchClassComparison();
    } else {
      setClassComparison([]);
      setComparisonMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClasses]);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getActive();
      setClasses(response.data);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const response = await reportAPI.getClassReport(
        classId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setReports(response.data);
      setComparisonMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassComparison = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const promises = selectedClasses.map(id =>
        reportAPI.getClassReport(
          id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      );

      const responses = await Promise.all(promises);
      const comparisonData = selectedClasses.map((id, index) => {
        const classData = classes.find(c => c.id === id);
        const reportsData = responses[index].data;
        
        const avgAttendance = reportsData.length > 0
          ? reportsData.reduce((sum, r) => sum + r.attendanceReport.averageAttendance, 0) / reportsData.length
          : 0;
        
        const avgPerformance = reportsData.length > 0
          ? reportsData.reduce((sum, r) => sum + r.academicReport.overallAverage, 0) / reportsData.length
          : 0;

        const totalCompleted = reportsData.reduce((sum, r) => sum + r.taskReport.completedTasks, 0);
        const totalPending = reportsData.reduce((sum, r) => sum + r.taskReport.pendingTasks, 0);
        const completionRate = (totalCompleted + totalPending) > 0
          ? (totalCompleted / (totalCompleted + totalPending)) * 100
          : 0;

        return {
          id,
          name: classData ? `${classData.name} ${classData.division || ''}` : `Class ${id}`,
          avgAttendance: avgAttendance.toFixed(2),
          avgPerformance: avgPerformance.toFixed(2),
          totalStudents: reportsData.length,
          completionRate: completionRate.toFixed(2),
          totalCompleted,
          totalPending
        };
      });

      setClassComparison(comparisonData);
      setComparisonMode(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClassSelection = (event) => {
    setSelectedClasses(event.target.value);
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress />
    </Box>
  );
  
  if (error) return <Typography color="error">{error}</Typography>;

  // Prepare data for charts
  const attendanceData = !comparisonMode && reports.length > 0
    ? reports.map(report => ({
        name: report.studentName,
        attendance: report.attendanceReport.averageAttendance
      }))
    : [];

  const academicData = !comparisonMode && reports.length > 0
    ? reports.map(report => ({
        name: report.studentName,
        performance: report.academicReport.overallAverage
      }))
    : [];

  return (
    <Container maxWidth="lg">
      <style>{`
        @media print {
          .no-print, button, .MuiTablePagination-root {
            display: none !important;
          }
          .MuiPaper-root {
            box-shadow: none;
          }
        }
      `}</style>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {comparisonMode ? 'Class Comparison Report' : 'Class Performance Report'}
          </Typography>
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

      {/* Class Comparison Selector */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }} className="no-print">
        <Typography variant="h6" gutterBottom>
          Compare Classes
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Select Classes to Compare</InputLabel>
          <Select
            multiple
            value={selectedClasses}
            onChange={handleClassSelection}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const cls = classes.find(c => c.id === value);
                  return (
                    <Chip
                      key={value}
                      label={cls ? `${cls.name} ${cls.division || ''}` : `Class ${value}`}
                    />
                  );
                })}
              </Box>
            )}
          >
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name} {cls.division ? `- ${cls.division}` : ''} ({cls.academicYear})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Select multiple classes to compare their performance metrics
        </Typography>
      </Paper>

      {/* Class Comparison Charts */}
      {comparisonMode && classComparison.length > 0 && (
        <>
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Attendance by Class
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={800}
                height={300}
                data={classComparison}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgAttendance" fill="#8884d8" name="Avg Attendance %" />
              </BarChart>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Academic Performance by Class
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={800}
                height={300}
                data={classComparison}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgPerformance" fill="#82ca9d" name="Avg Performance %" />
              </BarChart>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Completion Rate by Class
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={800}
                height={300}
                data={classComparison}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completionRate" fill="#ffc658" name="Completion Rate %" />
              </BarChart>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Class Comparison Summary
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell align="right">Total Students</TableCell>
                    <TableCell align="right">Avg Attendance %</TableCell>
                    <TableCell align="right">Avg Performance %</TableCell>
                    <TableCell align="right">Tasks Completed</TableCell>
                    <TableCell align="right">Tasks Pending</TableCell>
                    <TableCell align="right">Completion Rate %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classComparison.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell component="th" scope="row">
                        {cls.name}
                      </TableCell>
                      <TableCell align="right">{cls.totalStudents}</TableCell>
                      <TableCell align="right">{cls.avgAttendance}%</TableCell>
                      <TableCell align="right">{cls.avgPerformance}%</TableCell>
                      <TableCell align="right">{cls.totalCompleted}</TableCell>
                      <TableCell align="right">{cls.totalPending}</TableCell>
                      <TableCell align="right">{cls.completionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Individual Class Charts */}
      {!comparisonMode && attendanceData.length > 0 && (
        <>
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Class Attendance Overview
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={800}
                height={300}
                data={attendanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#8884d8" name="Attendance %" />
              </BarChart>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Academic Performance Overview
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                width={800}
                height={300}
                data={academicData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="performance" fill="#82ca9d" name="Academic Performance %" />
              </BarChart>
            </Box>
          </Paper>
        </>
      )}

      {/* Detailed Table - Only for non-comparison mode */}
      {!comparisonMode && reports.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Student Reports
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell align="right">Attendance %</TableCell>
                  <TableCell align="right">Academic Performance %</TableCell>
                  <TableCell align="right">Tasks Completed</TableCell>
                  <TableCell align="right">Tasks Pending</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {report.studentName}
                      </TableCell>
                      <TableCell align="right">
                        {report.attendanceReport.averageAttendance.toFixed(2)}%
                      </TableCell>
                      <TableCell align="right">
                        {report.academicReport.overallAverage.toFixed(2)}%
                      </TableCell>
                      <TableCell align="right">
                        {report.taskReport.completedTasks}
                      </TableCell>
                      <TableCell align="right">
                        {report.taskReport.pendingTasks}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={reports.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {!comparisonMode && reports.length === 0 && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography align="center" color="text.secondary">
            No report data available for this class
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ClassReport;