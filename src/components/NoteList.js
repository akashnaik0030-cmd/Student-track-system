import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Row, Col, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { noteAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const NoteList = () => {
  const { user, hasRole } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      let response;
      
      if (hasRole('ROLE_FACULTY') || hasRole('ROLE_HOD')) {
        // Faculty/HOD can see their sent notes
        response = await noteAPI.getCreatedByMe();
      } else {
        // Students see their received notes and public notes
        response = await noteAPI.getMyNotes();
      }
      
      // Handle both JSON string and object responses
      let notesData = response.data;
      if (typeof notesData === 'string') {
        try {
          notesData = JSON.parse(notesData);
        } catch (_) {
          notesData = [];
        }
      }
      setNotes(notesData || []);
    } catch (error) {
      setError('Failed to load notes');
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteAPI.delete(noteId);
        toast.success('Note deleted successfully');
        loadNotes();
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleDownload = async (noteId, fileName) => {
    try {
      const response = await noteAPI.downloadFile(noteId);
      
      // Determine MIME type from file extension
      let mimeType = 'application/octet-stream';
      if (fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        const mimeTypes = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png'
        };
        mimeType = mimeTypes[ext] || mimeType;
      }
      
      // Create a blob from the response with proper MIME type
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
      console.error('Download error:', error);
    }
  };

  const handleShowNote = async (note) => {
    // Show note in modal
    setSelectedNote(note);
    setShowModal(true);
    
    // If note has a file attachment, fetch it for preview in modal
    if (note.fileName || note.filePath) {
      try {
        const response = await noteAPI.downloadFile(note.id);
        
        // Determine MIME type from file extension
        let mimeType = 'application/pdf';
        if (note.fileName) {
          const ext = note.fileName.toLowerCase().split('.').pop();
          const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png'
          };
          mimeType = mimeTypes[ext] || 'application/pdf';
        }
        
        const blob = new Blob([response.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        setSelectedNote({ ...note, filePreviewUrl: url, fileMimeType: mimeType });
      } catch (error) {
        console.error('Failed to load file preview:', error);
        toast.error('Failed to load file preview');
      }
    }
  };

  const handleCloseModal = () => {
    // Clean up blob URL
    if (selectedNote?.filePreviewUrl) {
      window.URL.revokeObjectURL(selectedNote.filePreviewUrl);
    }
    setShowModal(false);
    setSelectedNote(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const valid = !isNaN(date.getTime());
    return valid ? date.toLocaleString() : '-';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Group notes by faculty for students
  const groupNotesByFaculty = (notes) => {
    if (!hasRole('ROLE_STUDENT')) return { 'All Notes': notes };
    
    const grouped = {};
    notes.forEach(note => {
      const facultyName = note.createdByName || 'Unknown Faculty';
      if (!grouped[facultyName]) {
        grouped[facultyName] = [];
      }
      grouped[facultyName].push(note);
    });
    
    // Sort faculty names alphabetically
    const sortedGroups = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGroups[key] = grouped[key];
    });
    
    return sortedGroups;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const groupedNotes = groupNotesByFaculty(notes);

  return (
    <div className="main-content">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Notes</h2>
            {(hasRole('ROLE_FACULTY') || hasRole('ROLE_HOD')) && (
              <Button variant="primary" as={Link} to="/notes/new">
                Create New Note
              </Button>
            )}
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {notes.length === 0 ? (
            <Alert variant="info">
              No notes available
              {(hasRole('ROLE_FACULTY') || hasRole('ROLE_HOD')) && (
                <div className="mt-2">
                  <Button variant="primary" as={Link} to="/notes/new">
                    Create Your First Note
                  </Button>
                </div>
              )}
            </Alert>
          ) : (
            <div>
              {Object.entries(groupedNotes).map(([facultyName, facultyNotes], index) => (
                <Card key={facultyName} className="mb-4" style={{ borderLeft: `4px solid ${index % 2 === 0 ? '#007bff' : '#28a745'}` }}>
                  <Card.Header style={{ backgroundColor: index % 2 === 0 ? '#e7f3ff' : '#e8f5e9' }}>
                    <h5 className="mb-0">
                      <strong>Section {index + 1}: {facultyName}</strong>
                      <Badge bg="secondary" className="ms-2">{facultyNotes.length} Note{facultyNotes.length !== 1 ? 's' : ''}</Badge>
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {facultyNotes.map((note) => (
                        <Col md={6} key={note.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <Card.Title>{note.title}</Card.Title>
                                  <Card.Text className="text-muted">
                                    {note.content}
                                  </Card.Text>
                              {(note.fileName || note.filePath) && (
                                    <div className="mt-2 mb-2">
                                      <Badge bg="secondary">
                                    📎 {note.fileName || 'Attachment'}
                                      </Badge>
                                      {note.fileSize && (
                                        <span className="text-muted ms-2">
                                          ({formatFileSize(note.fileSize)})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-3">
                                    {(note.isPublic || note.assignedToName === 'All Students' || (note.content && note.content.includes('[Sent to'))) ? (
                                      <Badge bg="success">To: All Students</Badge>
                                    ) : (
                                      <Badge bg="info">
                                        To: {note.assignedToName || 'Specific Student'}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <small className="text-muted">
                                      From: {note.createdByName}
                                    </small>
                                    <br />
                                    <small className="text-muted">
                                      {formatDate(note.createdAt)}
                                    </small>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 d-flex gap-2 flex-wrap">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleShowNote(note)}
                                >
                                  👁️ Show
                                </Button>
                                {(note.fileName || note.filePath) && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleDownload(note.id, note.fileName)}
                                  >
                                    📥 Download
                                  </Button>
                                )}
                                {(hasRole('ROLE_FACULTY') || hasRole('ROLE_HOD')) && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(note.id)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Note Detail Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedNote?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6 className="text-muted">Content:</h6>
            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedNote?.content}</p>
          </div>

          {(selectedNote?.fileName || selectedNote?.filePath) && (
            <div className="mb-3">
              <h6 className="text-muted">Attachment:</h6>
              <Badge bg="secondary">
                📎 {selectedNote?.fileName || 'Attachment'}
              </Badge>
              {selectedNote?.fileSize && (
                <span className="text-muted ms-2">
                  ({formatFileSize(selectedNote?.fileSize)})
                </span>
              )}
              
              {/* File Preview */}
              {selectedNote?.filePreviewUrl && (
                <div className="mt-3">
                  {/* PDF Preview */}
                  {selectedNote?.fileMimeType === 'application/pdf' && (
                    <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', overflow: 'hidden', height: '70vh' }}>
                      <iframe
                        src={selectedNote.filePreviewUrl}
                        width="100%"
                        height="100%"
                        title="PDF Preview"
                        style={{ border: 'none' }}
                      />
                    </div>
                  )}
                  
                  {/* Image Preview */}
                  {selectedNote?.fileMimeType?.startsWith('image/') && (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={selectedNote.filePreviewUrl}
                        alt={selectedNote.fileName}
                        style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '4px' }}
                      />
                    </div>
                  )}
                  
                  {/* Text Preview */}
                  {selectedNote?.fileMimeType === 'text/plain' && (
                    <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '15px', maxHeight: '600px', overflow: 'auto', backgroundColor: '#f8f9fa' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                        {/* Text content will be loaded */}
                        Loading text content...
                      </pre>
                    </div>
                  )}
                  
                  {/* Document formats - show info */}
                  {(selectedNote?.fileMimeType?.includes('word') || 
                    selectedNote?.fileMimeType?.includes('excel') || 
                    selectedNote?.fileMimeType?.includes('powerpoint')) && (
                    <Alert variant="info">
                      <p className="mb-0">
                        📄 Document preview not available. Click "Download Attachment" to view the file.
                      </p>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mb-3">
            <h6 className="text-muted">Details:</h6>
            <div>
              <strong>From:</strong> {selectedNote?.createdByName || 'Unknown'}
            </div>
            <div>
              <strong>To:</strong> {
                (selectedNote?.isPublic || selectedNote?.assignedToName === 'All Students' || (selectedNote?.content && selectedNote?.content.includes('[Sent to')))
                  ? 'All Students'
                  : (selectedNote?.assignedToName || 'Specific Student')
              }
            </div>
            <div>
              <strong>Created:</strong> {formatDate(selectedNote?.createdAt)}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {(selectedNote?.fileName || selectedNote?.filePath) && (
            <Button
              variant="success"
              onClick={() => {
                handleDownload(selectedNote.id, selectedNote.fileName);
              }}
            >
              📥 Download Attachment
            </Button>
          )}
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NoteList;
