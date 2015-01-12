#!/bin/bash
#Adapted from
#https://github.com/coolaj86/nodejs-self-signed-certificate-example/blob/
#9719dc3dcd1d8f84ca9872400337594f44a19dc1/make-root-ca-and-certificates.sh
FQDN='localhost'

# make directories to work from
mkdir -p certs

# Create your very own Root Certificate Authority
openssl genrsa \
  -out certs/my-root-ca.key.pem \
  2048

# Self-sign your Root Certificate Authority
# Since this is private, the details can be as bogus as you like
openssl req \
  -x509 \
  -new \
  -nodes \
  -key certs/my-root-ca.key.pem \
  -days 1024 \
  -out certs/my-root-ca.crt.pem \
  -subj "/C=US/ST=Utah/L=Provo/O=ACME Signing Authority Inc/CN=example.com"

# Create a Device Certificate for each domain,
# such as example.com, *.example.com, awesome.example.com
# NOTE: You MUST match CN to the domain name or ip address you want to use
openssl genrsa \
  -out certs/my-server.key.pem \
  2048

# Create a request from your Device, which your Root CA will sign
openssl req -new \
  -key certs/my-server.key.pem \
  -out certs/my-server.csr.pem \
  -subj "/C=US/ST=Utah/L=Provo/O=ACME Tech Inc/CN=${FQDN}"

# Sign the request from Device with your Root CA
# -CAserial certs/ca/my-root-ca.srl
openssl x509 \
  -req -in certs/my-server.csr.pem \
  -CA certs/my-root-ca.crt.pem \
  -CAkey certs/my-root-ca.key.pem \
  -CAcreateserial \
  -out certs/my-server.crt.pem \
  -days 500

# Now create a different device cert that isn't signed by the CA.
openssl genrsa \
  -out certs/unrooted.key.pem \
  2048

openssl req -new \
  -key certs/unrooted.key.pem \
  -out certs/unrooted.csr.pem \
  -subj "/C=US/ST=Utah/L=Provo/O=ACME Tech Inc/CN=${FQDN}"

openssl x509 \
  -req -in certs/unrooted.csr.pem \
  -signkey certs/unrooted.key.pem \
  -out certs/unrooted.crt.pem \
  -days 500
