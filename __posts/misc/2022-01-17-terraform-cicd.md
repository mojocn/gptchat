---
layout: post
title: "Notes004:Terraform CI/CD 自动化能力"
category: Misc
tags: Linux
keywords: "terraform, ci, cd,自动化能力,自动化审批部署"
description: "terraform ci/cd 自动化能力,自动化审批"
coverage: terraform_with_cicd.png
permalink: /misc/:title
date: 2022-01-17T16:23:45+08:00
---

## 1. Terraform 介绍

Terraform是一个开源的IT基础设施编排管理工具，Terraform支持使用配置文件描述单个应用或整个数据中心.

![](/assets/image/terraform-process-flow-chart.jpg)

- ***将基础结构部署到多个云*** - Terraform适用于多云方案，将相类似的基础结构部署到华为云、其他云提供商或者本地数据中心. 开发人员能够使用相同的工具和相似的配置文件同时管理不同云提供商的资源.
- ***自动化管理基础结构*** - Terraform能够创建配置文件的模板，以可重复、可预测的方式定义、预配和配置ECS资源，减少因人为因素导致的部署和管理错误.能够多次部署同一模板，创建相同的开发、测试和生产环境.
- ***基础架构即代码（Infrastructure as Code）*** - 可以用代码来管理维护资源.允许保存基础设施状态，从而使您能够跟踪对系统（基础设施即代码）中不同组件所做的更改，并与其他人共享这些配置 .

### 1.1 Terraform Provider

Terraform是一个高度可扩展的工具，通过Provider来支持新的基础架构.您可以使用Terraform来创建、修改、删除ECS、VPC、RDS、SLB等多种资源.

#### 1.1.1 [金山云 Provider](https://docs.ksyun.com/documents/27646)

当前金山云***部分产品线***Terraform providers已经开发完成，且正在与Terraform官方进行认证，认证完成以前需要用户手动完成插件安装配置.

#### 1.1.2 [华为云 Provider](https://registry.terraform.io/providers/huaweicloud/huaweicloud/latest/docs)

华为 terraform 支持大概64种云资源, 包括云服务器、云硬盘、云网络、云存储、云负载均衡、VPC、ELB、云计算、云数据库等.

### 1.2 Terraform 优势

- ***基础设施即代码***:
  基础设施可以使用高级配置语法进行描述，使得基础设施能够被代码化和版本化，从而可以进行共享和重复使用.

- ***执行计划***:
  Terraform有一个 "计划 "步骤，在这个步骤中，它会生成一个执行计划.执行计划显示了当你调用apply时，Terraform会做什么，这让你在Terraform操作基础设施时避免任何意外.

- ***资源图***:
  Terraform建立了一个所有资源的图，并行创建和修改任何非依赖性资源.从而使得Terraform可以尽可能高效地构建基础设施，操作人员可以深入了解基础设施中的依赖性.

- ***变更自动化***:
  复杂的变更集可以应用于您的基础设施，而只需最少的人工干预.有了前面提到的执行计划和资源图，您就可以准确地知道Terraform将改变什么，以及改变的顺序，从而避免了许多可能的人为错误.

## 2. Terraform 快速入门

### 2.1 安装 terraform 可执行二进制文件

Terraform是以二进制可执行文件发布，您只需下载terraform，然后将terraform可执行文件所在目录添加到系统环境变量PATH中即可. [Terraform官网下载](https://www.terraform.io/downloads.html).

### 2.2 认证与鉴权(提供云厂AK,SK)

#### 静态凭证（Static credentials）

静态凭证即在Terraform配置文件中添加AK/SK信息，如下所示.

```go
provider "huaweicloud" {
  region     = "cn-north-4"
  access_key = "my-access-key"
  secret_key = "my-secret-key"
}
```

#### 环境变量（Environment variables）

您可以将如下信息添加到环境变量中进行认证鉴权.

```shell
$ export HW_REGION_NAME="cn-north-1"
$ export HW_ACCESS_KEY="my-access-key"
$ export HW_SECRET_KEY="my-secret-key"
```

### 2.3 编写 terraform .tf 代码

#### 2.3.1 在工作目录下创建 "versions.tf" 文件

指定华为云Provider的registry源和版本，文件内容如下：

```go
terraform {
  required_providers {
    huaweicloud = {
      source = "huaweicloud/huaweicloud"
      version = ">= 1.20.0"
    }
  }
}
```

#### 2.3.2 创建“main.tf”文件

配置华为云Provider并创建一个VPC

```go
# Configure the HuaweiCloud Provider
provider "huaweicloud" {
  region     = "cn-north-1"
  access_key = "my-access-key"
  secret_key = "my-secret-key"
}

# Create a VPC
resource "huaweicloud_vpc" "example" {
  name = "terraform_vpc"
  cidr = "192.168.0.0/16"
}
```

### 2.4 执行 terraform init 初始化 Provider

回显如下，首次执行时会下载HuaweiCloud Provider并安装.

```go
$ terraform init

Initializing the backend...

Initializing provider plugins...
- Finding latest version of huaweicloud/huaweicloud
- Installing huaweicloud/huaweicloud v1.20.0...
...
Terraform has been successfully initialized!

```

### 2.5 执行: terraform plan 效果预览

执行 `terraform plan` 命令查看要创建的资源. 执行结果如下:

```go
...
An execution plan has been generated and is shown below.
Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # huaweicloud_vpc.example will be created
  + resource "huaweicloud_vpc" "example" {
      + cidr   = "192.168.0.0/16"
      + id     = (known after apply)
      + name   = "terraform_vpc"
      + region = (known after apply)
      + routes = (known after apply)
      + shared = (known after apply)
      + status = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.
...

```

### 2.6 执行 terraform apply 确认

如果 `terraform plan` 执行的结果是你期望的, 请执行 `terraform apply` 再次确认,创建你的资源

```go
An execution plan has been generated and is shown below.
Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # huaweicloud_vpc.example will be created
  + resource "huaweicloud_vpc" "example" {
      + cidr   = "192.168.0.0/16"
      + id     = (known after apply)
      + name   = "terraform_vpc"
      + region = (known after apply)
      + routes = (known after apply)
      + shared = (known after apply)
      + status = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

huaweicloud_vpc.example: Creating...
huaweicloud_vpc.example: Creation complete after 7s [id=ceab8267-38e5-4a4c-8065-12967ad9eb31]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

``` 

## 3. Terraform 自动化审批(CI/CD)

![](/assets/image/terraform_with_cicd.png)

1. 使用gitlab 管理团队的 terraform的代码
2. 配置gitlab cicd 在 merge request 创建的时候 处罚 `terraform plan` 命令, 审查执行结果.
3. 团队负责人审批,merge request, 如果同意则执行 `terrafrom apply` 在云端创建资源. 否则 devops 开发者代码不被合并执行, 需要重新修改代码在提交merge request 审核.

## 4. 结论

1. terraform 国内provider(云厂) 功能覆盖率相对于云厂提供的SDK覆盖较低, 一部分功能缺失.
2. terraform 擅长代码表达强大简洁, 但是不擅长和前端一起提供图形化能力.
3. terraform 适合于使用在devops代码仓库 + merge request + CICD 场景. 不适和于使用公司内部云平台 和 前端化工单自动化审批系统建设.