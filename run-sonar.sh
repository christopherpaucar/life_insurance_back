#!/bin/bash

# Check if token is provided
if [ -z "$1" ]; then
  echo "Please provide your SonarQube token as an argument"
  echo "Usage: ./run-sonar.sh your_token_here"
  exit 1
fi

# Run SonarQube analysis with the provided token
SONAR_TOKEN=$1 npm run sonar:analyze 