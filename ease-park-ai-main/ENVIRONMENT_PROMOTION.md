# Environment Promotion Strategy (Dev → Test → Prod)

This document outlines the CI/CD environment promotion strategy for the Smart Parking System using GitHub Actions, Azure Container Registry (ACR), and Azure Kubernetes Service (AKS).

## 1. Development Environment (Dev)
- **Triggers**: Commit or push to feature branches or `develop` branch.
- **Process**:
  - Automatically runs unit tests, lints the codebase, and checks for vulnerabilities.
  - Builds a Docker image tagged with `dev-<commit-sha>` and pushes to ACR.
  - Deploys automatically to the **Dev namespace** in AKS for developer verification.
- **Purpose**: Rapid iteration, early bug detection.

## 2. Testing / Staging Environment (Test)
- **Triggers**: Pull Request merged into the `main` or `release` branch.
- **Process**:
  - Image is re-tagged with `test-<commit-sha>` or release version (e.g., `v1.0.0-rc`).
  - Automated integration, E2E (Playwright), and performance testing runs.
  - Deploys automatically to the **Test namespace** in AKS.
- **Purpose**: Validating business logic, QA sign-off, simulating production workloads.

## 3. Production Environment (Prod)
- **Triggers**: Manual Approval in GitHub Actions pipeline / Azure DevOps after successful Test deployment or upon GitHub Release creation.
- **Process**:
  - Docker image from staging is promoted and tagged with `latest` and a stable version `vX.Y.Z`.
  - Manual review and sign-off by a repository admin.
  - Deploys to the **Prod namespace** (or dedicated Prod AKS cluster) using Rolling Updates to ensure zero downtime.
- **Purpose**: Reliable, scalable, and highly available system delivery for end-users.

## Key Principles
- **Immutable Artifacts**: The exact same Docker image built in Dev is promoted to Test and Prod. Only environment variables and configs change.
- **Automation**: Minimal human intervention up to Staging.
- **Security Checkpoints**: Approvals and active security scans before hitting Production.
