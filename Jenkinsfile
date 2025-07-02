pipeline {
    agent none

    stages {
        stage('Build & Test') {
            agent {
                docker {
                    image 'node:18'
                }
            }
            stages {
                stage('Checkout') {
                    steps {
                        checkout scm
                    }
                }
                stage('Install dependencies') {
                    steps {
                        sh 'npm install'
                    }
                }
                stage('Test') {
                    steps {
                        sh 'npm run test'
                    }
                }
                stage('Build') {
                    steps {
                        sh 'npm run build'
                    }
                }
            }
        }
        stage('Docker Build') {
            agent any
            steps {
                sh 'docker build -t life_insurance_back .'
            }
        }
    }
} 