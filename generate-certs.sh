#!/bin/bash

# Skapa certs-mapp om den inte finns
mkdir -p certs

# Generera self-signed certifikat
if [ ! -f certs/key.pem ] || [ ! -f certs/cert.pem ]; then
  echo "📝 Genererar SSL-certifikat..."
  openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
    -subj "/CN=localhost" 2>/dev/null
  echo "✅ SSL-certifikat genererat!"
else
  echo "✅ SSL-certifikat finns redan"
fi
