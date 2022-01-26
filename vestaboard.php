<?php

#
# barebones "take ?characters=... and hit the Vestaboard API" script
# https://docs.vestaboard.com/methods
#

#
# firstly, check the data.
#

if (!isset($_GET["characters"])) exit;

$characters = $_GET["characters"];

#
# expected characters: [], and 0-9 - exit if any other characters are found.
# note: this is more of a sanity, vs. security check. ;)
#

if (preg_match('/[^0-9\[\],]/', $characters)) exit;

#
# fetch credentials from “top-secret” .JSON file, which you promise
# never to commit or expose publicly if using any sort of CGI, right? ;)
# (N.B.: this should also be guarded by `.htaccess`.)
#

$file = "credentials.json";

if (!file_exists($file)) {
  echo "Credentials file not found? See " . $file . ".example file for reference.";
  exit;
}

$creds_string = file_get_contents($file);
$creds = json_decode($creds_string, true);

if (isset($_GET["is_dev"])) {

  echo "dev / virtual device: ";

  $credentials_type = "dev";

} else {

  echo "production / real hardware: ";

  $credentials_type = "prod";

}

#
# get the goods, based on type
#

$api_key = $creds[$credentials_type]['api_key'];
$api_secret = $creds[$credentials_type]['api_secret'];
$subscription_id = $creds[$credentials_type]['subscription_id'];

#
# barf if any of these things are empty.
#

if (!$api_key) echo "No API key?\n";
if (!$api_secret) echo "No API secret? \n";
if (!$subscription_id) echo "No subscription ID?\n";

if (!$api_key || !$api_secret || !$subscription_id) exit;

$url = "https://platform.vestaboard.com/subscriptions/" . $subscription_id . "/message";

#
# just in case things are slow
#

$timeout = 5;

$curl = curl_init($url);

curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, $timeout);

$headers = array(
  "X-Vestaboard-Api-Key: " . $api_key,
  "X-Vestaboard-Api-Secret: " . $api_secret
);

curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

$payload = '{"characters":' . $characters . '}';

curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);

#
# go go go!
#

$resp = curl_exec($curl);

curl_close($curl);

#
# echo back whatever we get. ¯\_(ツ)_/¯
#

var_dump($resp);

?>