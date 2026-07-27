#!/bin/bash
set -e

cd /srv/nodeapp

echo "Stopping app..."
./pm2 stop tecla-zoho

echo "Updating code..."
cd /srv/nodeapp/tecla-zoho
git fetch origin
git reset --hard origin/main

echo "Installing dependencies..."
npm ci

echo "Reloading PM2..."
cd /srv/nodeapp
./pm2 reload ecosystem.config.yml

echo "Deployment completed successfully."
