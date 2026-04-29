# 🚗 Ease Park AI - Advanced Smart Parking System

Welcome to the Ease Park AI enterprise repository. This project validates advanced infrastructure requirements mapping DevOps, GenAI, and Kubernetes workflows within a cohesive React/Vite SaaS application.

## 🏗️ Architecture Overview
The system relies on a strictly scalable environment:
1. **Frontend:** React + Vite + TailwindCSS.
2. **Containerization:** Multi-stage Docker definitions relying on NGINX for optimized delivery.
3. **Orchestration:** Azure Kubernetes Service (AKS) defined via Terraform, backed with HorizontalPodAutoscaler scaling logic.
4. **AI Layer:** "AIHelper.tsx" integrates deep conversational assistance mapped to Azure OpenAI endpoints simulating parking optimization logic.
5. **Image Storage:** Parked vehicle images are uploaded to Azure Blob Storage through the Python API, with browser local cache fallback.

## 🚀 Setup Instructions
### Local Execution:
1. Copy `.env.example` to `.env` and fill in Azure values.
2. Ensure frontend points to the backend API using `VITE_API_BASE_URL` (default `http://localhost:8000`).
3. For backend blob support, set `AZURE_STORAGE_CONNECTION_STRING` and optionally `AZURE_STORAGE_CONTAINER`.
4. Ensure you have Node 20+ installed.
5. Run `npm install` followed by `npm run dev` to access the application on `http://localhost:8080/`.

### Backend API:
1. Install Python dependencies with `pip install -r requirements.txt`.
2. Set `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER` in your environment.
3. Run `python run.py` to start the FastAPI service on port `8000`.

### AKS Deployment:
1. Build and push both frontend and API images through `.github/workflows/deploy.yml`.
2. Create the backend secret from `kubernetes/backend-secret.example.yaml` or with `kubectl create secret`.
3. Apply `kubernetes/backend-configmap.yaml`, `kubernetes/backend-deployment.yaml`, `kubernetes/backend-service.yaml`, `kubernetes/deployment.yaml`, and `kubernetes/service.yaml`.

### Docker Execution:
```bash
docker build -t ease-park-ui .
docker run -p 8080:80 ease-park-ui
```

## 🔄 CI/CD CI Explanation
We execute rapid, secure deliveries via GitHub Actions (`.github/workflows/deploy.yml`):
- **Build/Test:** Checks code formatting, lints, and unit tests.
- **Terraform Validate:** Enforces proper configuration block structure securely.
- **ACR Push:** Logs into the Azure Container Registry exclusively with repository secrets, builds the multi-stage image, tags to commit SHA, and pushes.
- **AKS Deploy:** Applies configurations locally overriding older deployments transparently inside the Kubernetes instance.

---

## 📸 STEP 7: PROOF FOR EVALUATION
In order to demonstrate full satisfaction to reviewers, please prepare screenshots of the following execution contexts:

1. **Terraform Apply Logs**: Screenshot the output of `cd terraform && terraform apply` confirming the deployment of Resource Groups, ACR, and AKS.
2. **Pipeline Success**: Screenshot the GitHub Actions "Build, Test, and Deploy to AKS" workflow displaying all green checks.
3. **ACR Image Registration**: Screenshot the Azure Portal Container Registries page showing `ease-park-ui` loaded with specific SHA tagging.
4. **AKS Deployment**: Screenshot the Azure AKS Services page running pods dynamically based on `kubernetes/deployment.yaml` & `hpa.yaml`.
5. **GenAI Park Car Interface**: Extract a screenshot portraying the `Park Car` flow seamlessly navigating grid paths next to the floating "AI Assistant" summarizing contextual conditions.
