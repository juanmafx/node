#!/bin/sh
# Generates a short-lived, localhost-only development certificate in the gitignored .certs directory.
set -eu
directory="$(dirname "$0")/../.certs"
mkdir -p "$directory"
chmod 700 "$directory"
umask 077
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout "$directory/key.pem" -out "$directory/cert.pem" -days 30 \
  -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
printf 'TLS_KEY_PATH=.certs/key.pem\nTLS_CERT_PATH=.certs/cert.pem\n'
