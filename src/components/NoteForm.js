import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { noteAPI, userAPI, classAPI } from '../services/api';
import { toast } from 'react-toastify';

const NoteForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noteType: 'specific', // 'specific' or 'public'
    classId: ''
  });
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getActive();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await userAPI.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear selected students when switching to public or changing class
    if (name === 'noteType' && value === 'public') {
      setSelectedStudents([]);
      setSelectAll(false);
    }
    
    if (name === 'classId') {
      setSelectedStudents([]);
      setSelectAll(false);
    }
  };

  // Filter students by selected class
  const getFilteredStudents = () => {
    if (!formData.classId) {
      return students;
    }
    return students.filter(student => 
      student.classEntity?.id === parseInt(formData.classId)
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Please upload a PDF, PPT, PPTX, DOC, or DOCX file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      const newSelection = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
      const filteredStudents = getFilteredStudents();
      setSelectAll(newSelection.length === filteredStudents.length && filteredStudents.length > 0);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    const filteredStudents = getFilteredStudents();
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
      setSelectAll(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.noteType === 'specific' && selectedStudents.length === 0) {
      setError('Please select at least one student');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('isPublic', formData.noteType === 'public');
      
      if (formData.noteType === 'specific') {
        selectedStudents.forEach(id => {
          submitData.append('assignedToIds', id);
        });
      }
      
      if (file) {
        submitData.append('file', file);
      }

      await noteAPI.create(submitData);
      
      const message = formData.noteType === 'public'
        ? 'Note published successfully to all students!'
        : `Note sent successfully to ${selectedStudents.length} students!`;
      
      toast.success(message);
      navigate('/notes');
    } catch (error) {
      const errorMessage = error.response?.data || 'Failed to create note';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="form-container">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Create Note</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Note Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter note title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Enter note content"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload File (Optional)</Form.Label>
              <p className="text-muted small">
                Supported formats: PDF, PPT, PPTX, DOC, DOCX (Max 10MB)
              </p>
              {!file ? (
                <Form.Control
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                />
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    value={fileName}
                    readOnly
                  />
                  <Button variant="outline-danger" size="sm" onClick={removeFile}>
                    Remove
                  </Button>
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assign to Class (Optional)</Form.Label>
              <Form.Select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.division ? `- ${cls.division}` : ''} {cls.year ? `(${cls.year})` : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Filter students by class or leave as "All Classes"
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note Type</Form.Label>
              <Form.Select
                name="noteType"
                value={formData.noteType}
                onChange={handleChange}
                required
              >
                <option value="specific">Send to Specific Students</option>
                <option value="public">Send to All Students (Public)</option>
              </Form.Select>
            </Form.Group>

            {formData.noteType === 'specific' && (
              <Form.Group className="mb-3">
                <Form.Label>Select Students {formData.classId && '(Filtered by Class)'}</Form.Label>
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
                    label={<strong>Select All {formData.classId ? 'Class' : ''} Students</strong>}
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="mb-3"
                  />
                  <hr className="my-2" />
                  {getFilteredStudents().length === 0 ? (
                    <p className="text-muted">No students available{formData.classId ? ' in selected class' : ''}</p>
                  ) : (
                    getFilteredStudents().map((student) => (
                      <Form.Check
                        key={student.id}
                        type="checkbox"
                        id={`student-${student.id}`}
                        label={`${student.fullName}${student.rollNumber ? ` (${student.rollNumber})` : ''}`}
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
            )}

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Note'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/notes')}
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

export default NoteForm;
