# VALIDATED SECURE IDENTITIES & OUTPUTS

output "acr_login_server" {
  description = "The login server URL for the provisioned Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "kube_config" {
  description = "The Kubernetes configuration block securely fetched for the deployment context"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}
