---
layout: post
title: Docker教程08:使用Docker Hub
category: Docker
tags: Dockerhub Docker
keywords: docker hub 教程
date: 2018-12-26T13:19:56+08:00
description: Docker Hub是一个由Docker公司负责维护的公共注册中心,它包含了超过15,000个可用来下载和构建容器的镜像,并且还提供认证,工作组结构,工作流工具（比如webhooks）,构建触发器以及私有工具（比如私有仓库可用于存储您并不想公开分享的镜像）
---

## Docker Hub简介

您将会学到如何利用[Docker Hub](https://hub.docker.com/)简化和提高您的 `Docker`工作流程.
Docker Hub是一个由Docker公司负责维护的公共注册中心,它包含了超过15000个可用来下载和构建容器的镜像,并且还提供认证,工作组结构,工作流工具（比如webhooks）,构建触发器以及私有工具（比如私有仓库可用于存储您并不想公开分享的镜像）.

Docker Hub 有一点类似Github

![](/assets/image/docker_hub_search.png)

## Docker命令和Docker Hub

Docker通过`docer search,pull,login`和`push`等命令提供了连接Docker Hub服务的功能,本页将展示这些命令如何工作的.

### 账号注册和登陆

一般,您需要先在docker中心创建一个账户（如果您尚未有）.您可以直接在Docker Hub创建您的账户,或通过运行：

```bash
    $ sudo docker login
```

这将提示您输入用户名,这个用户名将成为您的公共存储库的命名空间名称.如果您的名字可用,docker会提示您输入一个密码和您的邮箱,然后会自动登录到Docker Hub,您现在可以提交和推送镜像到Docker
Hub的您的存储库.

注：您的身份验证凭证将被存储在您本地目录的 `.dockercfg` 文件中.

### 搜索镜像

您可以通过使用搜索接口或者通过使用命令行接口在Docker Hub中搜索,可对镜像名称,用户名或者描述等进行搜索：

    $ sudo docker search centos
    NAME           DESCRIPTION                                     STARS     OFFICIAL   TRUSTED
    centos         Official CentOS 6 Image as of 12 April 2014     88
    tianon/centos  CentOS 5 and 6, created using rinse instea...   21
    ...

这里您可以看到两个搜索的示例结果：`centos`和`tianon/centos`.第二个结果是从名为tianon/的用户仓储库搜索到的,而第一个结果centos没有用户空间这就意味着它是可信的顶级命名空间./字符分割用户镜像和存储库的名称.

当您发现您想要的镜像时,便可以用`docker pull <imagename>`来下载它.

```bash
    $ sudo docker pull centos
    Pulling repository centos
    0b443ba03958: Download complete
    539c0211cd76: Download complete
    511136ea3c5a: Download complete
    7064731afe90: Download complete
```

现在您有一个镜像,基于它您可以运行容器.

## 向Docker Hub贡献

任何人都可以从Docker Hub仓库下载镜像,但是如果您想要分享您的镜像,您就必须先注册,就像您在第一部分的docker用户指南看到的一样.

### 推送镜像到Docker Hub

为了推送到仓库的公共注册库中,您需要一个命名的镜像或者将您的容器提到为一个命名的镜像,正像这里我们所看到的.

您可以将此仓库推送到公共注册库中,并以镜像名字或者标签来对其进行标记.

```bash
$ sudo docker push yourname/newimage
```

镜像上传之后您的团队或者社区的人都可以使用它.

## Docker Hub特征

让我们再进一步看看[Docker Hub的特色](http://wiki.jikexueyuan.com/project/docker/userguide/dockerrepos.html),这里您可以看到更多的信息.

- 私有仓库
- 组织和团队
- 自动构建
- Webhooks
- 私有仓库

有时候您不想公开或者分享您的镜像,所以Docker Hub允许您有私有仓库,您可以在[这里登录](https://hub.docker.com/)设置它.

### 组织和机构

私人仓库一个较有用的地方在于您可以将仓库分享给您团队或者您的组织.Docker Hub支持创建组织,这样您可以和您的同事来管理您的私有仓库,在这里您可以学到如何创建和管理一个组织.

### 自动构建

自动构建功能会自动从Github和BitBucket直接将镜像构建或更新至Docker Hub,通过为Github或Bitbucket的仓库添加一个提交的hook来实现,当您推送提交的时候就会触发构建和更新.

### 设置一个自动化构建您需要：

1. 创建一个Docker Hub账户并且登陆
2. 通过Link Accounts菜单连接您的Github或者BitBucket
3. 配置自动化构建
4. 选择一个包含dockerfile的Github或BitBucket项目
5. 选择您想用于构建的分支（默认是master分支）
6. 给自动构建创建一个名称
7. 指定一个Docker标签来构建
8. 指定dockerfile的路径,默认是 `/`.

一旦配置好自动构建,在几分钟内就会自动触发构建,您就会在Docker Hub仓库源看到您新的构建,并且它将会和您的Github或者BitBucket保持同步更新直到您解除自动构建.

如果您想看到您自动化构建的状态,您可以去您的 Docker Hub 自动化构建页面,它将会想您展示您构建的状态和构建历史.

一旦您创建了一个自动化构建,您可以禁用或删除它.但是,您不能通过docker push推送一个自动化构建,而只能通过在Github或者BitBucket提交您的代码来管理它.

您可以在一个仓库中创建多个自动构建,配置它们只指定的`Dockerfil`e或`Git`分支.

### 构建触发器

自动构建也可以通过Docker Hub的Url来触发,这样您就可以通过命令重构自动构建镜像.

### Webhooks

webhooks属于您的存储库的一部分,当一个镜像更新或者推送到您的存储库时允许您触发一个事件.当您的镜像被推送的时候, `webhook` 可以根据您指定的url和一个有效的Json来递送.