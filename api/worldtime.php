<?php
/**
 * WorldTimeAPI CORS Proxy
 *
 * This proxy allows the frontend to access WorldTimeAPI without CORS issues.
 * Usage: /api/worldtime.php?timezone=America/New_York
 */

// Enable CORS - Allow requests from your domain
header('Access-Control-Allow-Origin: https://boraokumusoglu.net'); // * For development. In production, change to: https://boraokumusoglu.net
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, User-Agent');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use GET.']);
    exit;
}

// Get timezone parameter
$timezone = $_GET['timezone'] ?? '';

if (empty($timezone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing timezone parameter']);
    exit;
}

// Validate timezone format (basic security check)
if (!preg_match('/^[a-zA-Z_\/+-]+$/', $timezone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid timezone format']);
    exit;
}

// Build WorldTimeAPI URL
$url = "https://worldtimeapi.org/api/timezone/" . urlencode($timezone);

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'TimeConverter/1.0');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

// Handle errors
if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Failed to connect to WorldTimeAPI',
        'details' => $error
    ]);
    exit;
}

// Return the response with appropriate status code
http_response_code($httpCode);
echo $response;
?>
