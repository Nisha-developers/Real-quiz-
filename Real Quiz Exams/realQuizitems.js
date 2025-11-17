// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase
const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

// Make supabase accessible globally
window.supabase = supabase;

// Getting The Elements for Quiz
const toggleEl = document.querySelector('.toggle');
const timerEl = document.querySelector('.timer');
const mainEl = document.querySelector('main');
const alertEl = document.querySelector('.alert');
const uniqueEl = document.querySelector('.uniqueid');
const welcomeMessage = document.querySelector('.welcome-message');
const questionContainer = document.querySelector('.question-answers-display-option');
const optionA = document.getElementById('A');
const optionB = document.getElementById('B');
const optionC = document.getElementById('C');
const optionD = document.getElementById('D');
const questions = document.querySelector('.questions');
const aItem = document.querySelector('label[for="A"]');
const bItem = document.querySelector('label[for="B"]');
const cItem = document.querySelector('label[for="C"]');
const dItem = document.querySelector('label[for="D"]');
const prevEl = document.querySelector('.prev');
const nextEl = document.querySelector('.next');
const headerTitle = document.querySelector('main h2');
const generateNumbers = document.querySelector('.generate-total-numer');
const optiondiv = document.querySelectorAll('div.option');
const option1 = document.querySelector('.option1');
const option2 = document.querySelector('.option2');
const option3 = document.querySelector('.option3');
const option4 = document.querySelector('.option4');
const optionAll = document.querySelectorAll('.option');

// Global variables
let totalQuestion = 0;
let questionSetToStudent = 0;
let secs = 0;
let hour, minutes, seconds;
let timerInterval;
let dangerTime = 0;
let warningTime = 0;
let questionSet = [];
let configExam = {};
let imageSet = 0;
let score = 0;
let index = 0;
let studentInformation = {};
let answeredStatus = [];
let viewedStatus = [];
let userAnswers = [];
let randomQuestions = [];
let openExam;


// Error handling function
function errorhandlinginweb(message) {
    mainEl.style.display = 'none';
    alertEl.style.display = 'block';
    alertEl.textContent = message;
    timerEl.style.display = 'none';
    uniqueEl.style.display = 'none';
    welcomeMessage.textContent = `${studentInformation.firstName  || `Guest`}, Error loading exam...`;
}

// Check if quiz is already completed in Supabase
async function isQuizAlreadyCompleted(uniqueId, subject) {
    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .select('id, completed_at, percentage')
            .eq('unique_id', uniqueId)
            .eq('subject', subject)
            .eq('is_completed', true);

        if (error) {
            console.error('Error checking quiz completion:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking quiz completion:', error);
        return false;
    }
}

// Handle when quiz is already completed
function handleCompletedQuiz() {
    console.log('Quiz already completed for this student');
    mainEl.style.display = 'none';
    alertEl.style.display = 'block';
    alertEl.innerHTML = `
        <h3>Quiz Already Completed</h3>
        <p>You have already completed this quiz and cannot retake it.</p>
        <p>If you need to review your results, please contact your instructor.</p>
    `;
    alertEl.style.color = '#ff6b6b';
    alertEl.style.textAlign = 'center';
    alertEl.style.padding = '20px';
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

// Initialize student information and validation
async function initializeStudentInfo() {
    // Get student information from session storage
    const studentInfoSession = sessionStorage.getItem('studentInfo') || sessionStorage.getItem('currentStudentSession');
    
    if (!studentInfoSession) {
        errorhandlinginweb('You did not log in. Please make sure you login before you continue');
        return false;
    }

    try {
        studentInformation = JSON.parse(studentInfoSession);
        console.log(studentInformation);
        
        // Set welcome message and unique ID
        uniqueEl.textContent = `Unique Id: ${studentInformation.uniqueId}`;
        welcomeMessage.textContent = `Welcome ${studentInformation.firstName} ${studentInformation.lastName}`;
        const titles = `Student ${studentInformation.subject} Examination for ${studentInformation.class}`;
        document.title = titles;

        
        // Check if quiz is already completed in Supabase
        const isCompleted = await isQuizAlreadyCompleted(studentInformation.uniqueId, studentInformation.subject);
        if (isCompleted) {
            handleCompletedQuiz();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error parsing student info:', error);
        errorhandlinginweb('Invalid student information. Please log in again.');
        return false;
    }
}


// Get exam configuration from Supabase
async function getExamConfig() {
    try {
        const { data: filteredConfigs, error: fetchError } = await supabase
            .from('exam_configs')
            .select('*')
            .eq('classes_student', studentInformation.questionClaass || studentInformation.class)
            .eq('subject_selected', studentInformation.subject);

        if (fetchError) {
            console.error("Error fetching filtered configs:", fetchError);
            errorhandlinginweb('Error loading exam configuration. Please try again.');
            return false;
        }

        if (filteredConfigs.length === 0) {
            errorhandlinginweb(`No examination setting found for ${studentInformation.subject} in ${studentInformation.questionClaass || studentInformation.class}`);
            return false;
        }

        configExam = filteredConfigs[0];
        totalQuestion = configExam.total_score;
        questionSetToStudent = configExam.questions_shown_to_student;
        secs = configExam.seconds_quiz * 60;
        imageSet = configExam.image_set;
        
        // Calculate warning and danger times
        dangerTime = Math.floor(10/100 * secs);
        warningTime = Math.floor(25/100 * secs);
        
        // Set header title
        if (headerTitle) {
            headerTitle.textContent = `Welcome to ${studentInformation.subject} Examination for ${studentInformation.questionClaass || studentInformation.class} student`;
        }

        return true;
    } catch (error) {
        console.error('Error getting exam config:', error);
        errorhandlinginweb('Error loading exam configuration. Please try again.');
        return false;
    }
}

// Get questions from Supabase
async function getFilteredQuestions() {
    try {
        const { data, error } = await supabase
            .from('examQuestions')
            .select('*')
            .eq('subject', studentInformation.subject)
            .eq('classes_student', studentInformation.questionClaass || studentInformation.class);

        if (error) {
            console.error('Error fetching filtered questions:', error.message);
            errorhandlinginweb('Error loading questions. Please try again.');
            return false;
        }

        if (!data || data.length === 0) {
            errorhandlinginweb('No questions found for this subject and class.');
            return false;
        }

        questionSet = data;
        console.log('Questions fetched successfully:', questionSet);

        // Validate question count
        if (questionSet.length < totalQuestion) {
           errorhandlinginweb('Insufficient questions available. Contact your administrator.');
           return false;
        }

        // Validate image questions if required
        if (imageSet > 0 && questionSet.filter(q => q.has_image === true).length < imageSet) {
           errorhandlinginweb('Insufficient image questions available. Contact your administrator.');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error fetching questions:', error);
        errorhandlinginweb('Error loading questions. Please try again.');
        return false;
    }
}

// Prepare random questions for the quiz
function prepareQuizQuestions() {
    // Shuffle questions
    const shuffledQuestions = [...questionSet];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }

    // Select required number of questions
    randomQuestions = shuffledQuestions.slice(0, questionSetToStudent);
    
    // Initialize arrays
    answeredStatus = Array(randomQuestions.length).fill(false);
    viewedStatus = Array(randomQuestions.length).fill(false);
    userAnswers = Array(randomQuestions.length).fill(null);
}

// Load saved progress from localStorage (keeping for session continuity)
function loadSavedProgress() {
    const savedData = localStorage.getItem(`quiz_${studentInformation.uniqueId}_${studentInformation.subject}`);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            index = data.index || 0;
            score = data.score || 0;
            secs = data.timeRemaining || secs;
            
            if (data.userAnswers) {
                data.userAnswers.forEach((answer, i) => {
                    if (answer !== null && i < userAnswers.length) {
                        userAnswers[i] = answer;
                    }
                });
            }
            
            if (data.answeredStatus) {
                data.answeredStatus.forEach((status, i) => {
                    if (i < answeredStatus.length) {
                        answeredStatus[i] = status;
                    }
                });
            }
            
            if (data.viewedStatus) {
                data.viewedStatus.forEach((status, i) => {
                    if (i < viewedStatus.length) {
                        viewedStatus[i] = status;
                    }
                });
            }
            
            console.log('Progress loaded successfully');
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
    }
}

// Save progress to localStorage (keeping for session continuity)
function saveProgress() {
    const progressData = {
        uniqueId: studentInformation.uniqueId,
        subject: studentInformation.subject,
        index: index,
        score: score,
        timeRemaining: secs,
        userAnswers: userAnswers,
        answeredStatus: answeredStatus,
        viewedStatus: viewedStatus,
        timestamp: Date.now()
    };
    localStorage.setItem(`quiz_${studentInformation.uniqueId}_${studentInformation.subject}`, JSON.stringify(progressData));
}

// Save final results to Supabase
async function saveFinalResults() {
    const percentage = Math.round((score / questionSetToStudent) * 100);
    
    try {
        // Save results to Supabase
        const { data, error } = await supabase
            .from('quiz_results')
            .insert([
                {
                    unique_id: studentInformation.uniqueId,
                    subject: studentInformation.subject,
                    score: score,
                    total_questions: questionSetToStudent,
                    percentage: percentage,
                    completed_at: new Date().toISOString(),
                    is_completed: true,
                    student_class: studentInformation.class
                }
            ])
            .select();

        if (error) {
            console.error('Error saving results to Supabase:', error);
            // Fallback to localStorage if Supabase fails
            const resultsData = {
                uniqueId: studentInformation.uniqueId,
                subject: studentInformation.subject,
                score: score,
                totalQuestions: questionSetToStudent,
                percentage: percentage,
                completedAt: new Date().toISOString(),
                isCompleted: true,
                savedToSupabase: false,
                student_class: studentInformation.class
            };
            localStorage.setItem(`results_${studentInformation.uniqueId}_${studentInformation.subject}`, JSON.stringify(resultsData));
            console.log('Results saved to localStorage as fallback');
        } else {
            console.log('Results saved to Supabase successfully:', data);
            
            // Also save to localStorage for immediate access (optional)
            const resultsData = {
                uniqueId: studentInformation.uniqueId,
                subject: studentInformation.subject,
                score: score,
                totalQuestions: questionSetToStudent,
                percentage: percentage,
                completedAt: new Date().toISOString(),
                isCompleted: true,
                savedToSupabase: true,
                supabaseId: data[0].id,
                student_class: studentInformation.class
            };
            localStorage.setItem(`results_${studentInformation.uniqueId}_${studentInformation.subject}`, JSON.stringify(resultsData));
        }
        
        // Remove progress data since quiz is completed
        localStorage.removeItem(`quiz_${studentInformation.uniqueId}_${studentInformation.subject}`);
        
        console.log('Quiz completed and results saved. Progress data cleared.');
        
    } catch (error) {
        console.error('Error saving final results:', error);
        // Fallback to localStorage
        const resultsData = {
            uniqueId: studentInformation.uniqueId,
            subject: studentInformation.subject,
            score: score,
            totalQuestions: questionSetToStudent,
            percentage: percentage,
            completedAt: new Date().toISOString(),
            isCompleted: true,
            savedToSupabase: false,
            student_class: studentInformation.class
        };
        localStorage.setItem(`results_${studentInformation.uniqueId}_${studentInformation.subject}`, JSON.stringify(resultsData));
        console.log('Results saved to localStorage as fallback due to error');
    }
}

async function openandCloseExamination() {
    await initializeStudentInfo();
    try {
        const { data, error } = await supabase
            .from('exam_configs')
            .select('is_open, date_exam, time_exam')
            .eq('classes_student', studentInformation.questionClaass || studentInformation.class)
            .eq('subject_selected', studentInformation.subject)
            .single();

        if (error) throw error;
        return data; // { is_open, date_exam, time_exam }
    } catch (err) {
        console.error('Error fetching exam status:', err);
        return null;
    }
}

(async () => {
    const resultDate = await openandCloseExamination();
    if (!resultDate) return;

    const { is_open: isOpen, date_exam: dateExam, time_exam: timeExam } = resultDate;
    let openExam = false;

    if (isOpen === false) {
        const today = new Date();
        const currentDate = today.toISOString().split('T')[0]; // yyyy-mm-dd

        // Check if today's date matches exam date
        if (dateExam !== currentDate) {
            errorhandlinginweb('The date has not reached or passed. Please contact the admin to open the exam');
            
            
            return;
        }

        // Compare time
        const examDateTime = new Date(`${dateExam}T${timeExam}`);
        const thirtyMinutesBefore = new Date(examDateTime.getTime() - 30 * 60 * 1000);
        const threeHoursAfter = new Date(examDateTime.getTime() + 3 * 60 * 60 * 1000);

        if (today >= thirtyMinutesBefore && today <= threeHoursAfter) {
            openExam = true;
        } else {
            errorhandlinginweb('You can only login 30 minutes before and up to 3 hours after the exam time.');
            
            return;
        }
    } else {
        openExam = true;
    }

    if (openExam) {
        console.log('Exam is open for student!');
        // Continue with exam process
    }
})();

// Get student's quiz results from Supabase
async function getStudentResults(uniqueId, subject = null) {
    try {
        let query = supabase
            .from('quiz_results')
            .select('*')
            .eq('unique_id', uniqueId)
            .order('completed_at', { ascending: false });
        
        if (subject) {
            query = query.eq('subject', subject);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching student results:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching student results:', error);
        return null;
    }
}

// Enhanced Display current question function with image support
function displayQuestion() {
    if (randomQuestions[index]) {
        const currentQuestion = randomQuestions[index];
        
        // Display question text
        questions.textContent = currentQuestion.question_text;
        
        // Handle question image if it exists
        handleQuestionImage(currentQuestion);
        
        // Display options
        aItem.textContent = currentQuestion.optionA || currentQuestion.options?.[0] || '';
        bItem.textContent = currentQuestion.optionB || currentQuestion.options?.[1] || '';
        cItem.textContent = currentQuestion.optionC || currentQuestion.options?.[2] || '';
        dItem.textContent = currentQuestion.optionD || currentQuestion.options?.[3] || '';
        
        // Update button text
        if (index === randomQuestions.length - 1) {
            nextEl.textContent = 'Submit';
        } else {
            nextEl.textContent = 'Next';
        }
        
        // Mark as viewed
        viewedStatus[index] = true;
        updateQuestionStatus();
        saveProgress();
    }
}


// Function to handle question images
function handleQuestionImage(question) {
    // Remove any existing question image
    const existingImage = document.querySelector('.question-image');
    if (existingImage) {
        existingImage.remove();
    }
    
    // Check if question has an image
    if (question.has_image && question.image_url) {
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'question-image';
        imageContainer.style.cssText = `
            margin: 15px 0;
            text-align: center;
            max-width: 100%;
        `;
        
        // Create image element
        const imageElement = document.createElement('img');
        imageElement.src = question.image_url;
        imageElement.alt = 'Question Image';
        imageElement.style.cssText = `
            max-width: 100%;
            max-height: 300px;
            height: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        
        // Add hover effect
        imageElement.addEventListener('mouseenter', () => {
            imageElement.style.transform = 'scale(1.02)';
        });
        
        imageElement.addEventListener('mouseleave', () => {
            imageElement.style.transform = 'scale(1)';
        });
        
        // Handle image loading errors
        imageElement.addEventListener('error', () => {
            imageContainer.innerHTML = `
                <div style="
                    padding: 20px;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    color: #666;
                    text-align: center;
                ">
                    <p>⚠️ Image could not be loaded</p>
                    <small>Please check your internet connection</small>
                </div>
            `;
        });
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'image-loading';
        loadingIndicator.style.cssText = `
            padding: 20px;
            text-align: center;
            color: #666;
        `;
        loadingIndicator.innerHTML = '📷 Loading image...';
        
        imageContainer.appendChild(loadingIndicator);
        
        // Replace loading indicator with image when loaded
        imageElement.addEventListener('load', () => {
            loadingIndicator.remove();
            imageContainer.appendChild(imageElement);
        });
        
        // Insert image container after the question text
        questions.parentNode.insertBefore(imageContainer, questions.nextSibling);
    }
}

// Mark results
function markResult() {
    let totalScore = 0;
    for (let i = 0; i < randomQuestions.length; i++) {
        if (userAnswers[i] !== null) {
            const question = randomQuestions[i];
            let correctAnswerIndex = -1;
            
            // Handle different question formats
            if (question.correct_answer) {
                // If correct_answer is A, B, C, or D
                const answerMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                correctAnswerIndex = question.correct_answer;
            } else if (question.answer && question.options) {
                // If answer is the text and options is an array
                correctAnswerIndex = question.options.indexOf(question.answer);
            }
            
            if (userAnswers[i] === correctAnswerIndex) {
                totalScore++;
            }
        }
    }
    score = totalScore;
    return score;
}

// Save user selection
function saveSelection() {
    let selectedIndex = -1;
    if (optionA.checked) selectedIndex = 0;
    if (optionB.checked) selectedIndex = 1;
    if (optionC.checked) selectedIndex = 2;
    if (optionD.checked) selectedIndex = 3;

    userAnswers[index] = selectedIndex;
    answeredStatus[index] = selectedIndex !== -1;
    saveProgress();
}

// Restore user selection
function restoreSelection() {
    clearSelection();
    const savedIndex = userAnswers[index];

    if (savedIndex === 0) optionA.checked = true;
    if (savedIndex === 1) optionB.checked = true;
    if (savedIndex === 2) optionC.checked = true;
    if (savedIndex === 3) optionD.checked = true;
}

// Clear selection
function clearSelection() {
    optionA.checked = false;
    optionB.checked = false;
    optionC.checked = false;
    optionD.checked = false;
    
    // Remove active class from all options
    [option1, option2, option3, option4].forEach(el => {
        if (el) el.classList.remove('active');
    });
}

// Finish quiz behavior
function finishBehaviour() {
    mainEl.style.display = 'none';
    alertEl.style.display = 'block';
    alertEl.innerHTML = `
        <h3>Quiz Completed Successfully!</h3>
        <p>You have successfully completed the exam.</p>
        <p>You may now leave the hall.</p>
    `;
    alertEl.style.color = '#28a745';
    alertEl.style.textAlign = 'center';
    alertEl.style.padding = '20px';
}

// Timer functionality
function startCountdown() {
    timerInterval = setInterval(() => {
        hour = Math.floor(secs / 3600);
        minutes = Math.floor((secs % 3600) / 60);
        seconds = Math.floor(secs % 60);
        
        hour = (hour >= 10) ? hour : `0${hour}`;  
        minutes = (minutes >= 10) ? minutes : `0${minutes}`;
        seconds = (seconds >= 10) ? seconds : `0${seconds}`;  
        
        timerEl.textContent = `${hour}:${minutes}:${seconds}`;
        
        secs--;
        
        if (secs < 0) {
            alert('Time is up! Quiz will be submitted automatically.');
            saveSelection();
            markResult();
            saveFinalResults();
            clearInterval(timerInterval);
            finishBehaviour();
        } else if (secs <= dangerTime) {
            timerEl.style.backgroundColor = 'red';
            questionContainer.classList.remove('warningSign');
            questionContainer.classList.add('dangerSign');
        } else if (secs <= warningTime) {
            timerEl.style.backgroundColor = 'yellow';
            timerEl.style.color = 'black';
            questionContainer.classList.remove('dangerSign');
            questionContainer.classList.add('warningSign');
        } else {
            timerEl.style.backgroundColor = 'var(--blue-tourch-design)';
            questionContainer.classList.remove('dangerSign');
            questionContainer.classList.remove('warningSign');
        }
        
        // Save progress every minute
        if (secs % 60 === 0) {
            saveProgress();
        }
    }, 1000);
}

// Generate question numbers
function generateQuestionNumbers() {
    generateNumbers.innerHTML = '';
    for (let i = 0; i < questionSetToStudent; i++) {
        generateNumbers.innerHTML += `<div class="q-num" data-index="${i}">${i + 1}</div>`;
    }
    
    // Add click listeners to question numbers
    document.querySelectorAll('.q-num').forEach((el) => {
        el.addEventListener('click', () => {
            saveSelection();
            index = parseInt(el.dataset.index);
            displayQuestion();
            restoreSelection();
        });
    });
}

// Update question status colors
function updateQuestionStatus() {
    const allBoxes = document.querySelectorAll('.q-num');

    allBoxes.forEach((el, i) => {
        el.classList.remove('answered', 'viewed', 'current', 'not-attempted', 'attempted-not-answered');

        if (i === index) {
            el.classList.add('current');
        } else if (answeredStatus[i]) {
            el.classList.add('answered');
        } else if (viewedStatus[i]) {
            el.classList.add('attempted-not-answered');
        } else {
            el.classList.add('not-attempted');
        }
    });
}

// Keyboard selection
document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();

    switch (key) {
        case 'A':
            optionA.checked = true;
            highlightLabel(option1, optionA);
            break;
        case 'B':
            optionB.checked = true;
            highlightLabel(option2, optionB);
            break;
        case 'C':
            optionC.checked = true;
            highlightLabel(option3, optionC);
            break;
        case 'D':
            optionD.checked = true;
            highlightLabel(option4, optionD);
            break;
    }
});

// Change-based selection
[optionA, optionB, optionC, optionD].forEach((option, index) => {
    option.addEventListener('change', () => {
        highlightLabel([option1, option2, option3, option4][index], option);
        saveSelection();
        updateQuestionStatus();
    });
});

// Highlight logic
function highlightLabel(label, option) {
    [option1, option2, option3, option4].forEach(l => {
        if (l) l.classList.remove('active');
    });

    if (option.checked && label) {
        label.classList.add('active');
    }
}

// Option click handlers
const inputAll = [optionA, optionB, optionC, optionD];
const labelAll = [option1, option2, option3, option4];

optionAll.forEach((el, index) => {
    el.addEventListener('click', () => {
        if (inputAll[index]) {
            inputAll[index].checked = true;
            highlightLabel(labelAll[index], inputAll[index]);
            saveSelection();
            updateQuestionStatus();
        }
    });
});

// Navigation event listeners
async function handleNextAction() {
    saveSelection();
    
    if (index === randomQuestions.length - 1) {
        let confirmQuiz = confirm('Are you sure you want to submit the quiz?');
        if (confirmQuiz) {
            markResult();
            await saveFinalResults();
            clearInterval(timerInterval);
            finishBehaviour();
        }
        return;
    }
    
    index++;
    displayQuestion();
    restoreSelection();
}

nextEl.addEventListener('click', handleNextAction);

document.addEventListener('keydown', (e) => {
    // Trigger Next button on Enter or Right Arrow
    if (e.key === 'Enter' || e.key === 'ArrowRight'  ||  e.key.toLowerCase === 'n') {
        handleNextAction();
    }
});

function goToPreviousQuestion() {
    saveSelection();

    if (index > 0) {
        index--;
        displayQuestion();
        restoreSelection();
    }
}

// Click Event
prevEl.addEventListener('click', goToPreviousQuestion);

// Keydown Event
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft'  || e.key.toLowerCase === 'p') {
        goToPreviousQuestion();
    }
});


// Auto-save before page unload
window.addEventListener('beforeunload', async (e) => {
    if (secs > 0) {
        const isCompleted = await isQuizAlreadyCompleted(studentInformation.uniqueId, studentInformation.subject);
        if (!isCompleted) {
            saveSelection();
            saveProgress();
        }
    }
});

// Main initialization function
async function initializeQuiz() {
    try {
        // Initialize student information
        const studentInfoValid = await initializeStudentInfo();
        if (!studentInfoValid) return;
        
        // Get exam configuration
        const configValid = await getExamConfig();
        if (!configValid) return;
        
        // Get questions from Supabase
        const questionsValid = await getFilteredQuestions();
        if (!questionsValid) return;
        
        // Prepare quiz questions
        prepareQuizQuestions();
        
        // Load saved progress
        loadSavedProgress();
        
        // Generate question numbers
        generateQuestionNumbers();
        
        // Display first question
        displayQuestion();
        
        // Restore selection
        restoreSelection();
        
        // Start timer
        startCountdown();
        
        // Auto-save periodically
        const autoSaveInterval = setInterval(async () => {
            if (secs > 0) {
                const isCompleted = await isQuizAlreadyCompleted(studentInformation.uniqueId, studentInformation.subject);
                if (!isCompleted) {
                    saveSelection();
                    saveProgress();
                } else {
                    clearInterval(autoSaveInterval);
                }
            } else {
                clearInterval(autoSaveInterval);
            }
        }, 30000);
        
        console.log('Quiz initialized successfully');
        
    } catch (error) {
        console.error('Error initializing quiz:', error);
        errorhandlinginweb('Error initializing quiz. Please refresh and try again.');
    }
}

// Start the quiz when page loads
document.addEventListener('DOMContentLoaded', initializeQuiz);
