<?php
// Example endpoint: POST /api/save.php  (NOT wired into the front end by default - the site says
// "nothing is saved", so enable only with a privacy notice + login.)
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header("Content-Security-Policy: default-src 'none'");

// --- CSRF: token issued to the page in the session, sent back in a header (compare in constant time)
$sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $sent)) { http_response_code(403); exit('{"error":"csrf"}'); }
if (empty($_SESSION['user_id']) || $_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(401); exit('{"error":"auth"}'); }

// --- Rate limit (simple per-session; use Redis / nginx limit_req in production)
$_SESSION['hits'] = array_filter($_SESSION['hits'] ?? [], fn($t) => $t > time() - 60);
if (count($_SESSION['hits']) >= 10) { http_response_code(429); exit('{"error":"slow down"}'); }
$_SESSION['hits'][] = time();

// --- Validation: whitelist fields, cast, clamp to the same ranges as the SQL CHECKs
$limits = ['waste'=>[0,10],'vehicle'=>[0,120],'electricity'=>[0,600],'lpg'=>[0,4],'meat'=>[0,21],'transit'=>[0,700],'flight'=>[0,200]];
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) { http_response_code(400); exit('{"error":"bad json"}'); }
$v = [];
foreach ($limits as $k => [$min, $max]) {
  $x = filter_var($in[$k] ?? null, FILTER_VALIDATE_FLOAT);
  if ($x === false || $x < $min || $x > $max) { http_response_code(422); exit(json_encode(['error'=>"invalid $k"])); }
  $v[$k] = $x;
}

// --- Prepared statement: user input is never concatenated into SQL
$pdo = new PDO('mysql:host=localhost;dbname=carbontrack;charset=utf8mb4', getenv('DB_USER'), getenv('DB_PASS'),
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
$st = $pdo->prepare('INSERT INTO assessments (user_id,waste_kg_day,vehicle_km_day,electricity_units_month,lpg_cylinders_month,meat_meals_week,transit_km_week,flight_hours_year) VALUES (?,?,?,?,?,?,?,?)');
$st->execute([$_SESSION['user_id'], $v['waste'], $v['vehicle'], $v['electricity'], $v['lpg'], (int)$v['meat'], $v['transit'], $v['flight']]);
echo json_encode(['id' => (int)$pdo->lastInsertId()]);   // JSON output is encoded; escape with htmlspecialchars() when rendering in HTML
