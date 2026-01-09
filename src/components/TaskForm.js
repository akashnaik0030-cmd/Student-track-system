import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { taskAPI, userAPI, classAPI } from '../services/api';
import { toast } from 'react-toastify';

const TaskForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    classId: '',
    startDate: '',
    dueDate: ''
  });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getActive();
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadStudents = async () => {
    try {
      const response = await userAPI.getStudents();
      setAllStudents(response.data);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    if (formData.classId) {
      const filteredStudents = allStudents.filter(
        student => student.classEntity?.id === parseInt(formData.classId)
      );
      setStudents(filteredStudents);
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setStudents(allStudents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.classId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      const newSelection = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
      setSelectAll(newSelection.length === students.length);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(students.map(s => s.id));
      setSelectAll(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      setLoading(false);
      return;
    }

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        classId: formData.classId ? parseInt(formData.classId) : null,
        assignedToIds: selectedStudents,
        assignedToId: selectedStudents[0], // Keep for backward compatibility
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString().slice(0, 19)
          : null,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString().slice(0, 19)
          : null
      };

      await taskAPI.create(taskData);
      
      const message = selectedStudents.length === 1
        ? 'Task created successfully!'
        : `Task created successfully for ${selectedStudents.length} students!`;
      
      toast.success(message);
      navigate('/tasks');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Create New Task</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter task title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Enter task description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Mathematics, Physics, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Class (Optional)</Form.Label>
              <Form.Select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.division ? `- ${cls.division}` : ''} ({cls.academicYear})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Select a class to filter students, or leave as "All Classes"
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assign To Students</Form.Label>
              <div style={{
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
                padding: '1rem',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#f8f9fa'
              }}>
                <Form.Check
                  type="checkbox"
                  label={<strong>Select All Students</strong>}
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="mb-3"
                />
                <hr className="my-2" />
                {students.length === 0 ? (
                  <p className="text-muted">No students available</p>
                ) : (
                  students.map((student) => (
                    <Form.Check
                      key={student.id}
                      type="checkbox"
                      id={`student-${student.id}`}
                      label={student.fullName}
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="mb-2"
                    />
                  ))
                )}
              </div>
              {selectedStudents.length > 0 && (
                <small className="text-muted">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </small>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    When students can start working on the task
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date (End Date)</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Submissions after this will be marked as LATE
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tasks')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TaskForm;