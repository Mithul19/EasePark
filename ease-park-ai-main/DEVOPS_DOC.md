# DevOps & Infrastructure Overview

This document summarizes the automation lifecycle of the Smart Parking System using Continuous Integration/Continuous Deployment (CI/CD) and Infrastructure as Code (IaC).

## 1. Infrastructure as Code (Terraform)
We use **Terraform** to provision the cloud infrastructure automatically, minimizing manual portal interactions.
- **`terraform/main.tf`**: Sets up the Azure Resource Group, Azure Container Registry (for storing Docker images), and Azure Kubernetes Service (AKS) for orchestration.
- **`terraform/variables.tf`**: Contains variable definitions to enable multi-environment setups (Dev, Test, Prod), overriding names as needed.

*To apply Terraform (Assuming Azure CLI is mapped):*
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

## 2. CI/CD Pipeline (GitHub Actions)
The workflow file is defined in `.github/workflows/deploy.yml` and is triggered on Pull Requests and merges to `main`.

### Stages:
1. **Build & Test (`build_and_test`)**:
   - Checks out the code.
   - Installs Node.js dependencies (`npm ci`).
   - Runs linting and automated unit tests.
   - Purpose: Ensure code quality before pushing artifacts.

2. **Docker Build & Push (`docker_build_push`)**:
   - Requires the Build & Test stage to succeed.
   - Logs into Azure Container Registry using GitHub Secrets (`AZURE_CREDENTIALS`).
   - Runs `docker build` using the multi-stage `Dockerfile` for the UI and `Dockerfile.backend` for the API.
   - Tags both images with the specific Git commit SHA (for traceability) and `latest`.
   - Pushes the frontend and backend images to the remote ACR.

3. **Deploy to AKS (`deploy_to_aks`)**:
   - Requires previous stage completion.
   - Logs into Azure and retrieves the `kubeconfig` sequence associated with the AKS cluster.
   - Creates/uses the `ease-park-backend-secret` for `AZURE_STORAGE_CONNECTION_STRING`.
   - Runs `kubectl apply` against `kubernetes/backend-configmap.yaml`, `kubernetes/backend-deployment.yaml`, `kubernetes/backend-service.yaml`, `kubernetes/deployment.yaml`, and `kubernetes/service.yaml`.
   - Forces pod restarts to ensure the newest frontend and backend images get orchestrated across the cluster nodes.

## Secrets Required in GitHub Repository
To securely deploy the application, the `AZURE_CREDENTIALS` JSON object must be generated via Azure CLI (using `az ad sp create-for-rbac`) and stored in GitHub repository secrets.

## Azure Blob Storage Secret
The backend API requires `AZURE_STORAGE_CONNECTION_STRING` to be stored as a Kubernetes Secret named `ease-park-backend-secret`. Use `kubernetes/backend-secret.example.yaml` as the template, or create it manually with `kubectl create secret generic`.
