variable "location" {
  type    = string
  default = "East US"
}

variable "resource_group_name" {
  type    = string
  default = "rg-easeparkai"
}

variable "acr_name" {
  type    = string
  default = "acreaseparkai"
}

variable "aks_name" {
  type    = string
  default = "aks-easeparkai"
}

variable "node_count" {
  type    = number
  default = 2
}
