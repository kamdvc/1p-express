pipeline {
  agent any

  environment {
    ANSIBLE_HOST_KEY_CHECKING = "False"
    TARGET_HOST = "192.168.0.109"
    TARGET_PORT = "2222"
    TARGET_USER = "user"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare Tools') {
      steps {
        sh '''
          python3 -m venv .venv
          . .venv/bin/activate
          pip install --upgrade pip
          pip install "ansible-core==2.17.*"
          chmod +x scripts/*.sh
        '''
      }
    }

    stage('Deploy with Ansible') {
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'laptop2-ssh-key', keyFileVariable: 'SSH_KEY_FILE'),
          string(credentialsId: 'laptop2-sudo-password', variable: 'SUDO_PASSWORD')
        ]) {
          sh '''
            . .venv/bin/activate
            export SSH_KEY_PATH="$SSH_KEY_FILE"
            ./scripts/ci_deploy.sh
          '''
        }
      }
    }
  }
}
