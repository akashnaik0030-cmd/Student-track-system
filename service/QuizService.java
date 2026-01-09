package com.studenttrack.service;

import com.studenttrack.entity.*;
import com.studenttrack.repository.QuizRepository;
import com.studenttrack.dto.*;
import com.studenttrack.repository.UserRepository;
import com.studenttrack.repository.QuizAnswerRepository;
import com.studenttrack.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class QuizService {
    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.studenttrack.repository.QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private com.studenttrack.repository.QuizAnswerRepository quizAnswerRepository;

    @Transactional
    public Quiz createQuiz(Quiz quiz) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User faculty = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
    // Set faculty and createdBy (same user for now)
    quiz.setFaculty(faculty);
    quiz.setCreatedBy(faculty);

        // Wire up bidirectional relationships prior to save
        if (quiz.getQuestions() != null) {
            for (QuizQuestion q : quiz.getQuestions()) {
                q.setQuiz(quiz);
                if (q.getOptions() != null) {
                    for (QuizOption o : q.getOptions()) {
                        o.setQuestion(q);
                    }
                }
            }
        }

        // Initial save to generate IDs for options
        // Ensure subject safe default
        if (quiz.getSubject() == null) {
            quiz.setSubject("GENERAL");
        }

        Quiz saved = quizRepository.save(quiz);

        // Set correctOptionId from transient isCorrect flag
        if (saved.getQuestions() != null) {
            for (QuizQuestion q : saved.getQuestions()) {
                if (q.getOptions() != null) {
                    Long correctId = q.getOptions().stream()
                            .filter(o -> Boolean.TRUE.equals(o.getCorrect()))
                            .map(QuizOption::getId)
                            .findFirst()
                            .orElse(null);
                    q.setCorrectOptionId(correctId);
                }
            }
        }

        // Persist updates to correctOptionId
        Quiz finalQuiz = quizRepository.save(saved);
        
        // Send email notifications to all students
        List<User> students = userRepository.findAll().stream()
            .filter(u -> u.getRoles() != null && u.getRoles().stream()
                .anyMatch(r -> r.getName() != null && "ROLE_STUDENT".equals(r.getName().name())))
            .collect(java.util.stream.Collectors.toList());
        
        if (!students.isEmpty()) {
            List<String> studentEmails = students.stream()
                .filter(s -> s.getEmail() != null && !s.getEmail().isEmpty())
                .map(User::getEmail)
                .collect(java.util.stream.Collectors.toList());
            
            if (!studentEmails.isEmpty()) {
                String startTime = finalQuiz.getStartTime() != null ? finalQuiz.getStartTime().toString() : "Not specified";
                String endTime = finalQuiz.getEndTime() != null ? finalQuiz.getEndTime().toString() : "Not specified";
                boolean isGoogleForm = finalQuiz.getGoogleFormLink() != null && !finalQuiz.getGoogleFormLink().isEmpty();
                
                emailService.sendQuizNotification(studentEmails, finalQuiz.getTitle(), 
                    finalQuiz.getSubject(), faculty.getUsername(), startTime, endTime, isGoogleForm);
            }
        }
        
        return finalQuiz;
    }

    public QuizDTO getQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return convertToDTO(quiz);
    }

    public List<QuizDTO> getQuizzesByFaculty(Long facultyId) {
        List<Quiz> quizzes = quizRepository.findByFacultyId(facultyId);
        return quizzes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<QuizDTO> getAllQuizzes() {
        List<Quiz> quizzes = quizRepository.findAll();
        return quizzes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizAttemptDTO submitQuiz(Long quizId, Long studentId, List<QuizSubmission> submissions) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Check if already attempted
        if (quizAttemptRepository.existsByQuizAndStudent(quiz, student)) {
            throw new RuntimeException("You have already attempted this quiz");
        }

        int totalMarks = 0;
        
        // Save quiz attempt first
        QuizAttempt attempt = new QuizAttempt(quiz, student, 0, quiz.getTotalMarks());
        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        
        // Save individual answers and calculate score
        for (QuizSubmission submission : submissions) {
            QuizQuestion question = quiz.getQuestions().stream()
                    .filter(q -> q.getId().equals(submission.getQuestionId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            boolean isCorrect = submission.getSelectedOptionId().equals(question.getCorrectOptionId());
            if (isCorrect) {
                totalMarks += question.getMarks();
            }
            
            // Save student's answer
            QuizAnswer answer = new QuizAnswer(savedAttempt, question, submission.getSelectedOptionId(), isCorrect);
            quizAnswerRepository.save(answer);
        }
        
        // Update attempt with final score
        savedAttempt.setScore(totalMarks);
        savedAttempt = quizAttemptRepository.save(savedAttempt);

        // Send email notification with results
        emailService.sendQuizResultNotification(student.getEmail(), quiz.getTitle(), totalMarks);
        
        return convertAttemptToDTO(savedAttempt);
    }

    public boolean isQuizAvailable(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(quiz.getStartTime()) && now.isBefore(quiz.getEndTime());
    }

    public boolean hasAttempted(Long quizId, Long studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return quizAttemptRepository.existsByQuizAndStudent(quiz, student);
    }

    public QuizAttemptDTO getMyAttempt(Long quizId) {
        UserPrincipal currentUser = authService.getCurrentUser();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        QuizAttempt attempt = quizAttemptRepository.findByQuizAndStudent(quiz, student)
                .orElseThrow(() -> new RuntimeException("No attempt found for this quiz"));
        
        return convertAttemptToDTO(attempt);
    }

    public List<QuizAttemptDTO> getQuizAttempts(Long quizId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quizId);
        return attempts.stream()
                .map(this::convertAttemptToDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptDTO> getMyAttempts() {
        UserPrincipal currentUser = authService.getCurrentUser();
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(currentUser.getId());
        return attempts.stream()
                .map(this::convertAttemptToDTO)
                .collect(Collectors.toList());
    }

    private QuizDTO convertToDTO(Quiz quiz) {
        QuizDTO dto = new QuizDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setFacultyId(quiz.getFaculty() != null ? quiz.getFaculty().getId() : null);
        dto.setFacultyName(quiz.getFaculty() != null ? quiz.getFaculty().getFullName() : null);
        dto.setStartTime(quiz.getStartTime());
        dto.setEndTime(quiz.getEndTime());
        dto.setTotalMarks(quiz.getTotalMarks());
        dto.setSubject(quiz.getSubject());
        dto.setGoogleFormLink(quiz.getGoogleFormLink());
        dto.setGoogleFormResponsesLink(quiz.getGoogleFormResponsesLink());
        
        if (quiz.getQuestions() != null) {
            List<QuizQuestionDTO> questionDTOs = new ArrayList<>();
            for (QuizQuestion question : quiz.getQuestions()) {
                questionDTOs.add(convertQuestionToDTO(question));
            }
            dto.setQuestions(questionDTOs);
        }
        
        return dto;
    }

    private QuizQuestionDTO convertQuestionToDTO(QuizQuestion question) {
        QuizQuestionDTO dto = new QuizQuestionDTO();
        dto.setId(question.getId());
        dto.setQuestionText(question.getQuestionText());
        dto.setMarks(question.getMarks());
        dto.setCorrectOptionId(question.getCorrectOptionId());
        
        if (question.getOptions() != null) {
            List<QuizOptionDTO> optionDTOs = question.getOptions().stream()
                    .map(this::convertOptionToDTO)
                    .collect(Collectors.toList());
            dto.setOptions(optionDTOs);
        }
        
        return dto;
    }

    private QuizOptionDTO convertOptionToDTO(QuizOption option) {
        QuizOptionDTO dto = new QuizOptionDTO();
        dto.setId(option.getId());
        dto.setOptionText(option.getOptionText());
        dto.setIsCorrect(option.getCorrect());
        return dto;
    }

    private QuizAttemptDTO convertAttemptToDTO(QuizAttempt attempt) {
        QuizAttemptDTO dto = new QuizAttemptDTO();
        dto.setId(attempt.getId());
        dto.setQuizId(attempt.getQuiz().getId());
        dto.setQuizTitle(attempt.getQuiz().getTitle());
        dto.setStudentId(attempt.getStudent().getId());
        dto.setStudentName(attempt.getStudent().getFullName());
        dto.setStudentRollNumber(attempt.getStudent().getRollNumber());
        dto.setScore(attempt.getScore());
        dto.setTotalMarks(attempt.getTotalMarks());
        
        if (attempt.getTotalMarks() != null && attempt.getTotalMarks() > 0) {
            double percentage = (attempt.getScore() * 100.0) / attempt.getTotalMarks();
            dto.setPercentage(Math.round(percentage * 100.0) / 100.0);
        }
        
        dto.setAttemptedAt(attempt.getAttemptedAt());
        dto.setSubmittedAt(attempt.getSubmittedAt());
        dto.setStatus(attempt.getStatus());
        
        return dto;
    }

    public List<QuizAnswerDTO> getAttemptAnswers(Long attemptId) {
        List<QuizAnswer> answers = quizAnswerRepository.findByAttemptId(attemptId);
        return answers.stream()
                .map(this::convertAnswerToDTO)
                .collect(Collectors.toList());
    }

    public List<StudentQuizStatusDTO> getAllStudentsStatusForQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        // Get all students
        List<User> allStudents = userRepository.findByRoleName(ERole.ROLE_STUDENT);
        
        // Get all attempts for this quiz
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quizId);
        
        // Create status DTO for each student
        return allStudents.stream()
                .sorted((s1, s2) -> {
                    // Sort by roll number (numeric)
                    try {
                        Integer roll1 = Integer.parseInt(s1.getRollNumber());
                        Integer roll2 = Integer.parseInt(s2.getRollNumber());
                        return roll1.compareTo(roll2);
                    } catch (NumberFormatException e) {
                        // If not numeric, sort alphabetically
                        return s1.getRollNumber().compareTo(s2.getRollNumber());
                    }
                })
                .map(student -> {
                    StudentQuizStatusDTO dto = new StudentQuizStatusDTO();
                    dto.setStudentId(student.getId());
                    dto.setStudentName(student.getFullName());
                    dto.setRollNumber(student.getRollNumber());
                    
                    // Find attempt for this student
                    QuizAttempt attempt = attempts.stream()
                            .filter(a -> a.getStudent().getId().equals(student.getId()))
                            .findFirst()
                            .orElse(null);
                    
                    if (attempt != null) {
                        dto.setHasAttempted(true);
                        dto.setScore(attempt.getScore());
                        dto.setTotalMarks(attempt.getTotalMarks());
                        dto.setAttemptId(attempt.getId());
                        
                        if (attempt.getTotalMarks() != null && attempt.getTotalMarks() > 0) {
                            double percentage = (attempt.getScore() * 100.0) / attempt.getTotalMarks();
                            dto.setPercentage(Math.round(percentage * 100.0) / 100.0);
                        }
                        
                        if (attempt.getSubmittedAt() != null) {
                            dto.setSubmittedAt(attempt.getSubmittedAt().toString());
                        }
                    } else {
                        dto.setHasAttempted(false);
                        dto.setTotalMarks(quiz.getTotalMarks());
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private QuizAnswerDTO convertAnswerToDTO(QuizAnswer answer) {
        QuizAnswerDTO dto = new QuizAnswerDTO();
        dto.setId(answer.getId());
        dto.setQuestionId(answer.getQuestion().getId());
        dto.setQuestionText(answer.getQuestion().getQuestionText());
        dto.setSelectedOptionId(answer.getSelectedOptionId());
        dto.setCorrectOptionId(answer.getQuestion().getCorrectOptionId());
        dto.setIsCorrect(answer.getIsCorrect());
        dto.setMarks(answer.getQuestion().getMarks());
        
        // Get selected option text
        QuizOption selectedOption = answer.getQuestion().getOptions().stream()
                .filter(opt -> opt.getId().equals(answer.getSelectedOptionId()))
                .findFirst()
                .orElse(null);
        if (selectedOption != null) {
            dto.setSelectedOptionText(selectedOption.getOptionText());
        }
        
        // Get correct option text
        QuizOption correctOption = answer.getQuestion().getOptions().stream()
                .filter(opt -> opt.getId().equals(answer.getQuestion().getCorrectOptionId()))
                .findFirst()
                .orElse(null);
        if (correctOption != null) {
            dto.setCorrectOptionText(correctOption.getOptionText());
        }
        
        return dto;
    }
}

