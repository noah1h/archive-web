<?php
// contact_handler.php - Secure contact form handler with PHPMailer
require 'vendor/autoload.php'; // Install: composer require phpmailer/phpmailer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Start session for CSRF and rate limiting
session_start();

// Set security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS - UPDATE THIS TO YOUR DOMAIN
$allowed_origin = 'https://yourdomain.com'; // Change this!
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header("Access-Control-Allow-Origin: {$allowed_origin}");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ========================================
// CONFIGURATION - USE ENVIRONMENT VARIABLES
// ========================================
$config = [
    'to_email' => getenv('CONTACT_TO_EMAIL') ?: 'your-email@example.com',
    'to_name' => getenv('CONTACT_TO_NAME') ?: 'Your Name',
    'from_email' => getenv('CONTACT_FROM_EMAIL') ?: 'noreply@yourdomain.com',
    'from_name' => getenv('CONTACT_FROM_NAME') ?: 'Website Contact Form',
    'site_name' => getenv('SITE_NAME') ?: 'Your Website',
    
    // SMTP Settings (use environment variables)
    'smtp_host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'smtp_port' => getenv('SMTP_PORT') ?: 587,
    'smtp_username' => getenv('SMTP_USERNAME') ?: 'your-gmail@gmail.com',
    'smtp_password' => getenv('SMTP_PASSWORD') ?: 'your-app-password',
    'smtp_secure' => PHPMailer::ENCRYPTION_STARTTLS,
    
    // Rate limiting
    'rate_limit_file' => sys_get_temp_dir() . '/contact_rate_limit.json',
    'rate_limit_seconds' => 60,
    'rate_limit_max_attempts' => 3,
];

// ========================================
// CSRF TOKEN VALIDATION
// ========================================
function validateCSRFToken($token) {
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

// Get CSRF token from headers or POST data
$input = json_decode(file_get_contents('php://input'), true);
$csrf_token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $input['csrf_token'] ?? '';

// Skip CSRF check for token generation request
if (!isset($input['get_token'])) {
    if (empty($csrf_token) || !validateCSRFToken($csrf_token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Invalid security token']);
        exit;
    }
}

// Handle token generation request
if (isset($input['get_token']) && $input['get_token'] === true) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    echo json_encode(['success' => true, 'csrf_token' => $_SESSION['csrf_token']]);
    exit;
}

// ========================================
// RATE LIMITING (IP-based with file storage)
// ========================================
function getRateLimitData($file) {
    if (!file_exists($file)) {
        return [];
    }
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function saveRateLimitData($file, $data) {
    file_put_contents($file, json_encode($data), LOCK_EX);
}

function cleanOldEntries(&$data, $timeout) {
    $current_time = time();
    foreach ($data as $ip => $timestamps) {
        $data[$ip] = array_filter($timestamps, function($timestamp) use ($current_time, $timeout) {
            return ($current_time - $timestamp) < $timeout;
        });
        if (empty($data[$ip])) {
            unset($data[$ip]);
        }
    }
}

function isRateLimited($config) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rate_data = getRateLimitData($config['rate_limit_file']);
    
    // Clean old entries
    cleanOldEntries($rate_data, $config['rate_limit_seconds']);
    
    // Check rate limit
    $attempts = $rate_data[$ip] ?? [];
    if (count($attempts) >= $config['rate_limit_max_attempts']) {
        return true;
    }
    
    // Add current attempt
    $attempts[] = time();
    $rate_data[$ip] = $attempts;
    saveRateLimitData($config['rate_limit_file'], $rate_data);
    
    return false;
}

if (isRateLimited($config)) {
    http_response_code(429);
    echo json_encode([
        'success' => false, 
        'message' => 'Too many requests. Please wait before submitting again.'
    ]);
    exit;
}

// ========================================
// GET AND VALIDATE INPUT
// ========================================
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Sanitize and validate inputs
$first_name = htmlspecialchars(trim($input['firstName'] ?? ''), ENT_QUOTES, 'UTF-8');
$last_name = htmlspecialchars(trim($input['lastName'] ?? ''), ENT_QUOTES, 'UTF-8');
$email = filter_var(trim($input['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$subject = htmlspecialchars(trim($input['subject'] ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($input['message'] ?? ''), ENT_QUOTES, 'UTF-8');

// Honeypot field (should be empty)
$honeypot = $input['website'] ?? '';

// Validation
$errors = [];
if (empty($first_name)) {
    $errors[] = 'First name is required';
} elseif (strlen($first_name) > 50) {
    $errors[] = 'First name is too long';
}

if (empty($last_name)) {
    $errors[] = 'Last name is required';
} elseif (strlen($last_name) > 50) {
    $errors[] = 'Last name is too long';
}

if (!$email) {
    $errors[] = 'Valid email is required';
} elseif (strlen($email) > 100) {
    $errors[] = 'Email is too long';
}

if (empty($subject)) {
    $errors[] = 'Subject is required';
} elseif (strlen($subject) > 200) {
    $errors[] = 'Subject is too long';
}

if (empty($message)) {
    $errors[] = 'Message is required';
} elseif (strlen($message) < 10) {
    $errors[] = 'Message must be at least 10 characters';
} elseif (strlen($message) > 5000) {
    $errors[] = 'Message is too long (max 5000 characters)';
}

// Honeypot check - log and silently fail for bots
if (!empty($honeypot)) {
    error_log("Contact form bot detected from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    echo json_encode(['success' => true, 'message' => 'Thank you! Your message has been sent.']);
    exit;
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Additional security checks
$suspicious_patterns = [
    'content-type:',
    'bcc:',
    'cc:',
    'to:',
    '\r',
    '\n',
];

foreach ([$email, $first_name, $last_name, $subject] as $field) {
    foreach ($suspicious_patterns as $pattern) {
        if (stripos($field, $pattern) !== false) {
            error_log("Suspicious contact form submission from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid input detected']);
            exit;
        }
    }
}

// ========================================
// PREPARE EMAIL
// ========================================
$full_name = $first_name . ' ' . $last_name;
$email_subject = "[{$config['site_name']}] {$subject}";
$ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Plain text email body
$text_body = "New Contact Form Submission\n\n";
$text_body .= "From: {$full_name}\n";
$text_body .= "Email: {$email}\n";
$text_body .= "Subject: {$subject}\n\n";
$text_body .= "Message:\n{$message}\n\n";
$text_body .= "---\n";
$text_body .= "Submitted: " . date('F j, Y \a\t g:i A T') . "\n";
$text_body .= "IP Address: {$ip_address}\n";

// ========================================
// SEND EMAIL WITH PHPMAILER
// ========================================
try {
    $mail = new PHPMailer(true);
    
    // Server settings
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_username'];
    $mail->Password = $config['smtp_password'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->Port = $config['smtp_port'];
    $mail->CharSet = 'UTF-8';
    $mail->SMTPDebug = 0; // Disable debug output in production
    
    // Recipients
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email'], $config['to_name']);
    $mail->addReplyTo($email, $full_name);
    
    // Content
    $mail->isHTML(false); // Plain text email
    $mail->Subject = $email_subject;
    $mail->Body = $text_body;
    
    // Send
    $mail->send();
    
    // Log successful submission
    error_log("Contact form submission from: {$email} (IP: {$ip_address})");
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your message has been sent successfully.'
    ]);
    
} catch (Exception $e) {
    error_log("Contact form error: {$mail->ErrorInfo} (IP: {$ip_address})");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, there was an error sending your message. Please try again later.'
    ]);
}
?>