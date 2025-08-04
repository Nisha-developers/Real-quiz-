// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase
const supabaseUrl = 'https://cnnpcbtjlgnwzijmeijj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubnBjYnRqbGdud3ppam1laWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzYwNTEsImV4cCI6MjA2ODYxMjA1MX0.XUAfi5Eh3sgc4rYp7K3eOE0q6tfqUHYpXMFFze4Ev0w';
const supabase = createClient(supabaseUrl, supabaseKey);

// Make supabase accessible globally
window.supabase = supabase;

// Student data and subjects
 let allStudents = [];
 let studentInfos = {};
let allSubjects = ['Mathematics', 'English', 'Basic Science', 'Basic tech', 'Business studies', 'Agric Science', 'French', 'Home Economics', 'History', 'Physical and health Education', 'National value', 'CCA Art', 'CCA Drama', 'CCA Music', 'Christian Religious studies', 'Yoruba', 'Igbo', 'Computer', 'Cisco', 'Guidance and Councelling'];

// Get URL parameters to determine the class
const urlParams = new URLSearchParams(window.location.search);
const selectedClass = urlParams.get('class');


// Validate class parameter
const validClasses = [];
const jssBranches = ['agu', 'ayam', 'barama', 'damisa', 'ekpe', 'ekun'];
const ssBranches = ['agu', 'ayam', 'barama', 'damisa', 'ekpe'];
let questionclass;

switch (true) {
    case selectedClass.startsWith('JSS1'):
        questionclass = 'jss1';
        break;
    case selectedClass.startsWith('JSS2'):
        questionclass = 'jss2';
        break;
    case selectedClass.startsWith('JSS3'):
        questionclass = 'jss3';
        break;
    case ['SSS1AGU', 'SSS1AYAM', 'SSS1BARAMA'].includes(selectedClass):
        questionclass = 'ss1Science';
        break;
    case ['SSS2AGU', 'SSS2AYAM', 'SSS2BARAMA'].includes(selectedClass):
        questionclass = 'ss2Science';
        break;
    case ['SSS3AGU', 'SSS3AYAM', 'SSS3BARAMA'].includes(selectedClass):
        questionclass = 'ss3Science';
        break;
    case selectedClass === 'SSS1DAMISA':
        questionclass = 'ss1Commercial';
        break;
    case selectedClass === 'SSS2DAMISA':
        questionclass = 'ss2Commercial';
        break;
    case selectedClass === 'SSS3DAMISA':
        questionclass = 'ss3Commercial';
        break;
    case selectedClass === 'SSS1EKPE':
        questionclass = 'ss1Art';
        break;
    case selectedClass === 'SSS2EKPE':
        questionclass = 'ss2Art';
        break;
    case selectedClass === 'SSS3EKPE':
        questionclass = 'ss3Art';
        break;
    default:
        console.error('Invalid selectedClass:', selectedClass);
}

// Add JSS1 to JSS3 with all 6 branches
for (let i = 1; i <= 3; i++) {
  jssBranches.forEach(branch => {
    validClasses.push(`JSS${i}${branch.toUpperCase()}`);
  });
}

// Add SS1 to SS3 with only 5 branches (excluding ekun)
for (let i = 1; i <= 3; i++) {
  ssBranches.forEach(branch => {
    validClasses.push(`SSS${i}${branch.toUpperCase()}`);
  });
}
console.log(validClasses)
// Redirect to error page if class is invalid
if (!selectedClass || !validClasses.includes(selectedClass)) {
     window.location.href = '/Error Page/ErrorPage.html';
}
else if(selectedClass.includes('EKPE')){
    allSubjects = [ "Mathematics", "English", "Literature in English", "Christian Religious Studies",
  "Economics", "Government", "History", "Data Processing", "Marketing",
  "Printing and Decoration", "Visual Art", "Home Management", "Food and Nutrition",
  "Civic Education", "Yoruba", "Igbo", "French", "Biology", "Cisco"]
}
else if(selectedClass.includes('DAMISA')){
    allSubjects = [  "Mathematics", "English Language", "Commerce", "Financial Accounting",
  "Government", "Economics", "Further Mathematics", "Data Processing",
  "Marketing", "Painting and Decoration", "Cisco", "Civic Education"]
}
else if(selectedClass.includes('AGU')|| selectedClass.includes('AYAM') || selectedClass.includes('BARAMA')){
   allSubjects = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Further Mathematics", "Economics", "Computer", "Technical drawing",
  "Agricultural Science", "Animal husbandry", "Data Processing", "Marketing",
  "Painting and Decoration", "Food and nutrition", "Geography", "French", "Cisco", "Civic Education"
];
}
else{
  allSubjects = ['Mathematics', 'English', 'Basic Science', 'Basic tech', 'Business studies', 'Agric Science', 'French',
     'Home Economics', 'History', 'Physical and health Education', 'National value', 'CCA Art', 'CCA Drama', 'CCA Music',
      'Christian Religious studies', 'Yoruba', 'Igbo', 'Computer', 'Cisco', 'Guidance and Councelling'];
}

// Method 1: Get all students from Supabase for the specific class
const getStudentsByClass = async function(selectedClass) {
    try {
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('class', selectedClass);

        if (error) {
            console.error('Supabase error:', error);
            showAlert('Failed to load student data from server!', 'error');
            return [];
        }

        // Transform data to match expected format
        allStudents = students.map(student => ({
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            UniqueId: student.unique_id,
            class: student.class,
            subjects: student.subjects || []
        }));

        console.log(`Students loaded for class ${selectedClass}:`, allStudents);
        console.log(students);
        // Populate subjects dropdown after loading students
        populateSubjects();
        
        return allStudents;
    } catch (error) {
        console.error('Error getting students by class:', error);
        showAlert('Failed to load student data from server!', 'error');
        return [];
    }
};

// Method 2: Get a specific student by details and class
const findStudentByDetails = async function(firstName, lastName, uniqueId, selectedClass) {
    try {
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('first_name', firstName)
            .eq('last_name', lastName)
            .eq('unique_id', uniqueId)
            .eq('class', selectedClass);

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }

        if (students && students.length > 0) {
            const student = students[0];
            return {
                id: student.id,
                firstName: student.first_name,
                lastName: student.last_name,
                UniqueId: student.unique_id,
                class: student.class,
                subjects: student.subjects || []
            };
        }

        return null;
    } catch (error) {
        console.error('Error finding student:', error);
        return null;
    }
};

// Method 3: Get students by subject within a class
const getStudentsBySubjectAndClass = async function(subjectName, className) {
    try {
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('class', className)
            .contains('subjects', [subjectName]);

        if (error) {
            console.error('Supabase error:', error);
            return [];
        }

        return students.map(student => ({
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            UniqueId: student.unique_id,
            class: student.class,
            subjects: student.subjects || []
        }));
    } catch (error) {
        console.error('Error getting students by subject and class:', error);
        return [];
    }
};

// Load students for the current class
async function loadStudents() {
    if (!selectedClass) {
        showAlert('No class selected!', 'error');
        return;
    }

    try {
        await getStudentsByClass(selectedClass);
        
        if (allStudents.length === 0) {
            showAlert(`No students found for class ${selectedClass}`, 'info');
        }
        
        populateSubjects();
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Failed to load student data!', 'error');
    }
}

// Updated validation function to use Supabase and class filtering
async function validateAndStartExam() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const uniqueId = document.getElementById('uniqueId').value.trim();
    const subject = document.getElementById('subject').value.trim();
   
    // Basic validation
    if (!firstName || !lastName || !uniqueId || !subject) {
        showAlert('Please fill in all required fields!', 'error');
        return;
    }

    if (firstName.length < 2 || lastName.length < 2) {
        showAlert('First name and last name must be at least 2 characters long!', 'error');
        return;
    }

    if (!uniqueId.includes('BY')) {
        showAlert('Unique ID must contain "BY"!', 'error');
        return;
    }

    if (!selectedClass) {
        showAlert('Invalid class selection!', 'error');
        return;
    }

    // Show loading message
    showAlert('Validating student details...', 'info');

    try {
        // Check if student exists in Supabase for the specific class
        const student = await findStudentByDetails(firstName, lastName, uniqueId, selectedClass);

        if (!student) {
            showAlert(`Invalid student details for class ${selectedClass}! Please check your information and try again.`, 'error');
            return;
        }

        // Check if student is registered for the selected subject
        if (!student.subjects || !student.subjects.includes(subject)) {
            showAlert(`You are not registered for ${subject}. Please select a subject you are registered for.`, 'error');
            return;
        }
      
        // Success - student is validated
        alert(`Name: ${firstName}\nlastName:${lastName}\nClass:${selectedClass}\nSubject:${subject}\nUniqueId: ${uniqueId}\nTime of Login:${new Date().getHours() < 10 ? `0${new Date().getHours()}` : `${new Date().getHours()}`} : ${new Date().getMinutes() < 10 ? `0${new Date().getMinutes()}`:`${new Date().getMinutes()}`}\nClick Okay to start the examination.`)
        showAlert(`Examination to start ${subject} will begin shortly`, 'success');
        
        
        // Store current student session
        const studentSession = {
            firstName: firstName,
            lastName: lastName,
            uniqueId: uniqueId,
            class: selectedClass,
            subject: subject,
            loginTime: new Date().toISOString(),
            studentId: student.id,
            questionClaass: questionclass
        };
        
        // Use in-memory storage instead of sessionStorage for Claude.ai compatibility
        window.currentStudentSession = studentSession;

        sessionStorage.setItem('studentInfo', JSON.stringify(studentSession));
        // Redirect to exam page with class parameter
        setTimeout(() => {
            const examUrl = `../Real Quiz Exams/realQuizItems.html?class=${selectedClass}&subject=${subject}`;
            window.location.href = examUrl;
        }, 3000);

    } catch (error) {
        console.error('Error during validation:', error);
        showAlert('Server error during validation. Please try again.', 'error');
    }
}

// Populate subjects dropdown based on loaded students' subjects
function populateSubjects() {
    const subjectSelect = document.getElementById('subject');
    if (!subjectSelect) return;
    
    subjectSelect.innerHTML = '<option value="">Choose a subject...</option>';
    
    // Get unique subjects from all students in the class
    const availableSubjects = new Set();
    allStudents.forEach(student => {
        if (student.subjects && Array.isArray(student.subjects)) {
            student.subjects.forEach(subject => availableSubjects.add(subject));
        }
    });
    
    // If no subjects found from students, use default subjects
    const subjectsToShow = availableSubjects.size > 0 ? Array.from(availableSubjects).sort() : allSubjects;
    
    subjectsToShow.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
}

// Show alert message
function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    alertDiv.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// Update page title based on selected class
function updatePageTitle() {
    if (selectedClass) {
        const titleElement = document.querySelector('.quiz-title h2');
        if (titleElement) {
            titleElement.innerHTML = `<i class="fas fa-graduation-cap"></i> ${selectedClass} QUIZ EXAMINATION`;
        }
        
        // Update page title
        document.title = `NAVY SEC SKL ABK, ${selectedClass} QUIZ EXAM`;
    }
}

// Form submission with Enter key
document.getElementById('studentForm')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        validateAndStartExam();
    }
});

// Start exam button event listener
const buttonEl = document.querySelector('#startExamBtn');
if (buttonEl) {
    buttonEl.addEventListener('click', validateAndStartExam);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updatePageTitle();
    loadStudents();
});

// Export functions for potential use in other scripts
window.studentLoginFunctions = {
    getStudentsByClass,
    findStudentByDetails,
    getStudentsBySubjectAndClass,
    validateAndStartExam

};
