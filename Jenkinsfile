pipeline {
  agent any

  environment {
    ANSIBLE_HOST_KEY_CHECKING = "False"
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
        script {
          if (isUnix()) {
            sh '''
              python3 -m venv .venv
              . .venv/bin/activate
              pip install --upgrade pip
              pip install "ansible-core==2.17.*"
              chmod +x scripts/*.sh
            '''
          } else {
            bat '''
              @echo off
              for /f "delims=" %%i in ('wsl wslpath "%WORKSPACE%"') do set "WSL_WORKSPACE=%%i"
              wsl bash -lc "cd '$WSL_WORKSPACE' && python3 -m venv .venv && source .venv/bin/activate && pip install --upgrade pip && pip install 'ansible-core==2.17.*' && chmod +x scripts/*.sh"
            '''
          }
        }
      }
    }

    stage('Deploy with Ansible') {
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'laptop2-ssh-key', keyFileVariable: 'SSH_KEY_FILE'),
          string(credentialsId: 'laptop2-sudo-password', variable: 'SUDO_PASSWORD')
        ]) {
          script {
            if (isUnix()) {
              sh '''
                . .venv/bin/activate
                export SSH_KEY_PATH="$SSH_KEY_FILE"
                ./scripts/ci_deploy.sh
              '''
            } else {
              bat '''
                @echo off
                for /f "delims=" %%i in ('wsl wslpath "%WORKSPACE%"') do set "WSL_WORKSPACE=%%i"
                for /f "delims=" %%i in ('wsl wslpath "%SSH_KEY_FILE%"') do set "WSL_SSH_KEY=%%i"
                wsl bash -lc "cd '$WSL_WORKSPACE' && source .venv/bin/activate && export SSH_KEY_PATH='$WSL_SSH_KEY' && export SUDO_PASSWORD='%SUDO_PASSWORD%' && ./scripts/ci_deploy.sh"
              '''
            }
          }
        }
      }
    }
  }
}
